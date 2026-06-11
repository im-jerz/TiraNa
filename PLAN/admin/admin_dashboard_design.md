# AirBnB Clone Admin Dashboard — Technical Design

## Architecture Decision

| Choice | Decision | Rationale |
|--------|----------|-----------|
| **Pattern** | Modular Monolith | Single repo, clear module boundaries, easy to split later |
| **Frontend** | Streamlit Multi-Page App | User specified Streamlit |
| **Database** | PostgreSQL + SQLAlchemy ORM | User specified PostgreSQL; SQLAlchemy for parameterized queries & migrations |
| **Auth** | Session-based via `streamlit-authenticator` | Native Streamlit integration, bcrypt hashing |
| **Migrations** | Alembic | SQLAlchemy-native schema versioning |
| **State** | `st.session_state` + cached DB queries | Streamlit-native, no extra libs |

---

## Project Structure

```
AirBnB-Clone/
├── app.py                          # Streamlit entry point
├── requirements.txt
├── .env.example
├── .gitignore
├── alembic.ini
├── alembic/
│   └── versions/                   # DB migrations
├── config/
│   ├── __init__.py
│   └── settings.py                 # Environment config loader
├── database/
│   ├── __init__.py
│   ├── connection.py               # Engine, session factory
│   └── models/
│       ├── __init__.py
│       ├── user.py                 # Users, Hosts
│       ├── listing.py              # Listings, ListingPhotos
│       ├── booking.py              # Bookings
│       ├── payment.py              # Payments, Payouts
│       ├── review.py               # Reviews
│       ├── support.py              # SupportTickets, Disputes
│       ├── verification.py         # VerificationRecords
│       ├── analytics.py            # AnalyticsData (materialized views)
│       └── system_settings.py      # SystemSettings
├── services/
│   ├── __init__.py
│   ├── auth.py                     # Authentication logic
│   ├── user_service.py
│   ├── listing_service.py
│   ├── booking_service.py
│   ├── payment_service.py
│   ├── review_service.py
│   ├── support_service.py
│   ├── analytics_service.py
│   └── settings_service.py
├── pages/
│   ├── 1_🏠_Dashboard_Overview.py
│   ├── 2_👥_User_Host_Management.py
│   ├── 3_🏘️_Listings_Management.py
│   ├── 4_📅_Booking_Management.py
│   ├── 5_💰_Payments_Commissions.py
│   ├── 6_📊_Analytics_Reports.py
│   ├── 7_🎫_Support_Disputes.py
│   └── 8_⚙️_System_Settings.py
├── components/
│   ├── __init__.py
│   ├── sidebar.py                  # Navigation + admin info
│   ├── charts.py                   # Reusable Plotly chart components
│   ├── tables.py                   # Reusable data table components
│   ├── forms.py                    # Reusable form components
│   └── metrics.py                  # KPI card components
├── utils/
│   ├── __init__.py
│   ├── validators.py               # Input validation helpers
│   ├── formatters.py               # Currency, date formatting
│   └── export.py                   # CSV/PDF export utilities
├── specs/
│   └── admin_dashboard_design.md   # This file
└── tests/
    ├── __init__.py
    ├── conftest.py
    ├── test_services/
    └── test_pages/
```

---

## Database Schema (PostgreSQL)

### Core Tables

```sql
-- 1. USERS (core auth/account data)
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active     BOOLEAN DEFAULT TRUE,
    is_verified   BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USER_PROFILES (personal information, linked to users)
CREATE TABLE user_profiles (
    id          SERIAL PRIMARY KEY,
    user_id     INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name   VARCHAR(100) NOT NULL,
    phone       VARCHAR(20),
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. HOSTS (host-specific profile data — a user is a host if their user_id exists here)
-- Contains: badge (superhost/new), response metrics, verification status
-- Linked to users table via user_id FK
CREATE TABLE hosts (
    id              SERIAL PRIMARY KEY,
    user_id         INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    badge           VARCHAR(50),           -- 'superhost', 'new', etc.
    host_since      DATE,
    response_rate   DECIMAL(5,2),
    response_time   VARCHAR(20),
    total_listings  INT DEFAULT 0,
    verification_status VARCHAR(20) DEFAULT 'pending'
);

-- 4. ADMINS (extends users — a user is an admin if their user_id exists here)
CREATE TABLE admins (
    id              SERIAL PRIMARY KEY,
    user_id         INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    clearance_level VARCHAR(50) DEFAULT 'standard',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 5. LISTINGS (admin moderation only — core data owned by client app/Kayla Carl)
-- Admin can only modify: status (approve/reject/suspend)
-- Read-only access for: title, description, price, location, host_id
CREATE TABLE listings (
    id              SERIAL PRIMARY KEY,
    host_id         INT REFERENCES hosts(id) ON DELETE CASCADE,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    property_type   VARCHAR(50),
    room_type       VARCHAR(50),
    max_guests      INT DEFAULT 1,
    bedrooms        INT DEFAULT 1,
    bathrooms       INT DEFAULT 1,
    price_per_night DECIMAL(10,2),
    cleaning_fee    DECIMAL(10,2) DEFAULT 0,
    service_fee     DECIMAL(10,2) DEFAULT 0,
    address         TEXT,
    city            VARCHAR(100),
    country         VARCHAR(100),
    latitude        DECIMAL(9,6),
    longitude       DECIMAL(9,6),
    status          VARCHAR(20) DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected','suspended')),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 6. LISTING_PHOTOS
-- photo_url: cloud URL (Cloudinary/S3), validated for image type (JPG/PNG), max file size
CREATE TABLE listing_photos (
    id          SERIAL PRIMARY KEY,
    listing_id  INT REFERENCES listings(id) ON DELETE CASCADE,
    photo_url   TEXT NOT NULL,        -- cloud URL, not local path
    is_primary  BOOLEAN DEFAULT FALSE,
    caption     VARCHAR(200),
    sort_order  INT DEFAULT 0
);

-- 7. BOOKINGS
-- guests_count: must be <= listing's max_guests, validated at booking creation
CREATE TABLE bookings (
    id              SERIAL PRIMARY KEY,
    listing_id      INT REFERENCES listings(id),
    guest_id        INT REFERENCES users(id),
    check_in        DATE NOT NULL,
    check_out       DATE NOT NULL,
    guests_count    INT DEFAULT 1,
    total_price     DECIMAL(10,2),
    status          VARCHAR(20) DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','cancelled','completed','disputed')),
    cancellation_reason TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PAYMENTS
-- Gateway: PayMongo (GCash, Maya, GrabPay, ShopeePay, Visa/Mastercard, BPI/UBP/BDO bank transfer, QR Ph)
-- Commission: platform fee deducted per transaction
-- Refund flow: admin-initiated, tracked via status (pending -> refunded)
-- Flow: Payment Intent -> attach method -> webhook confirms payment.paid or payment.failed
CREATE TABLE payments (
    id              SERIAL PRIMARY KEY,
    booking_id      INT REFERENCES bookings(id),
    payer_id        INT REFERENCES users(id),
    payee_id        INT REFERENCES users(id),
    amount          DECIMAL(10,2) NOT NULL,
    commission      DECIMAL(10,2) DEFAULT 0,
    payment_method  VARCHAR(50),
    status          VARCHAR(20) DEFAULT 'pending'
                    CHECK (status IN ('pending','completed','refunded','disputed')),
    transaction_id  VARCHAR(100),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PAYOUTS
CREATE TABLE payouts (
    id              SERIAL PRIMARY KEY,
    host_id         INT REFERENCES hosts(id),
    amount          DECIMAL(10,2) NOT NULL,
    status          VARCHAR(20) DEFAULT 'pending'
                    CHECK (status IN ('pending','processing','completed','failed')),
    method          VARCHAR(50),
    processed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 10. REVIEWS
-- Reviews only allowed after booking status = 'completed'
-- One review per booking (enforced by UNIQUE on booking_id)
CREATE TABLE reviews (
    id          SERIAL PRIMARY KEY,
    booking_id  INT UNIQUE REFERENCES bookings(id),
    listing_id  INT REFERENCES listings(id),
    guest_id    INT REFERENCES users(id),
    rating      INT CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    response    TEXT,                -- host response
    is_visible  BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 11. SUPPORT_TICKETS
-- Admin ticket system: users submit tickets, admins respond via resolution field
-- No real-time chat
-- Categories: booking, payment, listing, account, other
CREATE TABLE support_tickets (
    id              SERIAL PRIMARY KEY,
    user_id         INT REFERENCES users(id),
    booking_id      INT REFERENCES bookings(id),
    subject         VARCHAR(200) NOT NULL,
    description     TEXT,
    category        VARCHAR(50),    -- 'booking','payment','listing','account','other'
    priority        VARCHAR(20) DEFAULT 'medium'
                    CHECK (priority IN ('low','medium','high','urgent')),
    status          VARCHAR(20) DEFAULT 'open'
                    CHECK (status IN ('open','in_progress','resolved','closed')),
    assigned_to     INT REFERENCES users(id),
    resolution      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 12. DISPUTES
CREATE TABLE disputes (
    id              SERIAL PRIMARY KEY,
    ticket_id       INT REFERENCES support_tickets(id),
    booking_id      INT REFERENCES bookings(id),
    filed_by        INT REFERENCES users(id),
    reason          VARCHAR(50),    -- 'cancellation','damage','no_show','other'
    description     TEXT,
    evidence_urls   TEXT[],         -- array of URLs
    resolution      TEXT,
    resolved_by     INT REFERENCES users(id),
    status          VARCHAR(20) DEFAULT 'open'
                    CHECK (status IN ('open','under_review','resolved','closed')),
    refund_amount   DECIMAL(10,2) DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ
);

-- 13. VERIFICATION_RECORDS
-- Identity verification (Airbnb model): government ID (passport, driver's license, national ID) + selfie
-- Host KYC: legal name, date of birth, residential address (required before payout)
-- Admin review flow: pending -> approved/rejected
CREATE TABLE verification_records (
    id              SERIAL PRIMARY KEY,
    user_id         INT REFERENCES users(id),
    doc_type        VARCHAR(50),    -- 'passport','drivers_license','national_id'
    doc_url         TEXT,
    status          VARCHAR(20) DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected')),
    reviewed_by     INT REFERENCES users(id),
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at     TIMESTAMPTZ
);

-- 14. SYSTEM_SETTINGS
CREATE TABLE system_settings (
    id              SERIAL PRIMARY KEY,
    key             VARCHAR(100) UNIQUE NOT NULL,
    value           TEXT,
    description     TEXT,
    updated_by      INT REFERENCES users(id),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 15. ANALYTICS_SNAPSHOTS (daily aggregated data)
CREATE TABLE analytics_snapshots (
    id                  SERIAL PRIMARY KEY,
    date                DATE NOT NULL,
    total_gbv           DECIMAL(12,2),
    total_bookings      INT,
    active_listings     INT,
    new_users           INT,
    new_hosts           INT,
    cancellation_rate   DECIMAL(5,2),
    avg_rating          DECIMAL(3,2),
    platform_revenue    DECIMAL(12,2),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 16. AUDIT_LOG (security tracking)
CREATE TABLE audit_log (
    id          SERIAL PRIMARY KEY,
    admin_id    INT REFERENCES users(id),
    action      VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),        -- 'user','listing','booking','setting'
    target_id   INT,
    details     JSONB,
    ip_address  INET,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 17. OTP_RECORDS (for phone/email verification and 2FA)
CREATE TABLE otp_records (
    id              SERIAL PRIMARY KEY,
    user_id         INT REFERENCES users(id) ON DELETE CASCADE,
    otp_code        VARCHAR(10) NOT NULL,
    purpose         VARCHAR(50) NOT NULL,    -- 'signup','login','password_reset'
    expires_at      TIMESTAMPTZ NOT NULL,
    is_used         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Streamlit Pages — Feature Breakdown

### Page 1: Dashboard Overview

| Component | Details |
|-----------|---------|
| KPI Cards | Total GBV, active listings, total users, bookings today, platform revenue |
| Charts | Revenue trend (30-day line chart), booking volume (bar chart), user growth (area chart) |
| Alerts | Pending listings, open disputes, low-stock dates |
| Table | Recent activity feed (last 20 events) |

### Page 2: User & Host Management

| Component | Details |
|-----------|---------|
| Tabs | Users \| Hosts |
| Filters | Role, status, verification status, date range, search |
| Table | Paginated user/host list with inline status badges |
| Actions | View profile modal, edit, suspend/reactivate, send message |
| Verification | Review pending verifications, approve/reject with notes |
| Host Badges | Assign/revoke superhost status |

### Page 3: Listings Management

| Component | Details |
|-----------|---------|
| Filters | Status (pending/approved/rejected), property type, city, price range |
| Table | Paginated listings with thumbnail, title, host, status, price |
| Detail View | Photo gallery, description, amenities, pricing breakdown |
| Actions | Approve, reject (with reason), suspend, remove |
| Moderation | Review flagged photos, detect policy violations |

### Page 4: Booking Management

| Component | Details |
|-----------|---------|
| Calendar View | Visual calendar showing booking density by listing |
| Filters | Status, date range, listing, guest, price range |
| Table | All bookings with guest, listing, dates, status, total |
| Actions | View details, cancel (with reason), process refund, override disputes |
| Bulk Ops | Export booking data, bulk status updates |

### Page 5: Payments & Commissions

| Component | Details |
|-----------|---------|
| KPIs | Total revenue, commissions earned, pending payouts, refund total |
| Revenue Table | Booking-level payment breakdown (guest pays, host receives, platform fee) |
| Payouts | Host payout queue, process/reject payouts |
| Disputes | Payment disputes, security deposits, insurance claims |
| Export | Financial reports (CSV/PDF) |

### Page 6: Analytics & Reports

| Component | Details |
|-----------|---------|
| KPIs | GBV, occupancy rate, avg daily rate, guest satisfaction |
| Charts | Seasonal demand heatmap, booking trends, top cities, listing performance |
| Filters | Date range, metric selection, comparison periods |
| Reports | Generate downloadable reports, schedule automated reports |
| Insights | AI-generated insights summary (optional) |

### Page 7: Support & Disputes

| Component | Details |
|-----------|---------|
| Tabs | Tickets \| Disputes |
| Filters | Status, priority, category, date range |
| Table | Ticket/dispute list with priority badges, assigned agent |
| Actions | Assign agent, change priority, resolve, escalate |
| Detail View | Full conversation thread, evidence upload, resolution form |
| Metrics | Avg resolution time, tickets by category, agent performance |

### Page 8: System Settings

| Component | Details |
|-----------|---------|
| Sections | Commissions \| Fees \| Pricing \| Platform \| Tax |
| Forms | Edit commission %, service fees, cleaning fee limits |
| Pricing | Dynamic pricing rules, seasonal multipliers |
| Platform | Platform name, support email, terms URL, maintenance mode |
| Audit Log | Settings change history with admin who made the change |

---

## Security Checklist (per fullstack-guardian)

| Category | Implementation |
|----------|----------------|
| **Auth** | `streamlit-authenticator` with bcrypt; session timeout 30 min |
| **Authz** | Admin role check: user_id must exist in `admins` table; implicit role via admins/hosts tables |
| **Input Validation** | Pydantic models for all form submissions; server-side validation |
| **SQL Injection** | SQLAlchemy ORM with parameterized queries only; no raw SQL |
| **XSS** | Streamlit auto-escapes; sanitize any `st.markdown(unsafe_allow_html=True)` |
| **Rate Limiting** | Login attempts limited to 5/15min via DB tracking |
| **Audit Logging** | `audit_log` table recording all admin actions (who, what, when) |
| **Secrets** | `.env` file for DB credentials, not committed to git |
| **CSRF** | Streamlit handles via session tokens |

### Per-Module Authentication

| Module | Sign Up | Sign In |
|--------|---------|---------|
| **Admin** | Created manually by existing admin (insert into `users` + `admins`) | Admin login page → checks `admins` table |
| **Host** | Client app signup → inserts into `users` + `user_profiles` + `hosts` | Client login → checks `hosts` table |
| **Guest** | Client app signup → inserts into `users` + `user_profiles` | Client login → no `hosts` or `admins` record |

---

## Implementation Phases

| Phase | Scope | Est. Files |
|-------|-------|------------|
| **Phase 1** | Project scaffold, DB connection, models, Alembic migrations | ~15 |
| **Phase 2** | Auth system, sidebar, page skeleton with routing | ~5 |
| **Phase 3** | Dashboard Overview (KPIs, charts) | ~4 |
| **Phase 4** | User & Host Management (CRUD, verification) | ~4 |
| **Phase 5** | Listings Management (moderation, approval) | ~4 |
| **Phase 6** | Booking Management (calendar, cancellations) | ~4 |
| **Phase 7** | Payments & Commissions (payouts, disputes) | ~4 |
| **Phase 8** | Analytics & Reports (charts, export) | ~4 |
| **Phase 9** | Support & Disputes (ticketing system) | ~4 |
| **Phase 10** | System Settings (configuration panel) | ~3 |

---

## Key Dependencies (`requirements.txt`)

```
streamlit>=1.32.0
streamlit-authenticator>=0.3.0
sqlalchemy>=2.0
psycopg2-binary>=2.9
alembic>=1.13
pandas>=2.2
plotly>=5.18
python-dotenv>=1.0
pydantic>=2.5
bcrypt>=4.1
```

---

## Three-Perspective Design (Fullstack Guardian)

### [Frontend]
- Streamlit multi-page app with `st.navigation()` or sidebar routing
- Reusable components: KPI cards, data tables, charts, form modals
- Loading states with `st.spinner()` for all DB queries
- Error display with `st.error()` and `st.toast()` for confirmations
- Pagination via `st.session_state` page tracking
- Responsive layout using `st.columns()` and `st.expander()`

### [Backend]
- SQLAlchemy ORM models mapped to PostgreSQL tables
- Service layer pattern: each domain has a service module with pure functions
- DB session management via `database/connection.py` context manager
- Alembic for schema migrations (version-controlled)
- Parameterized queries only — no raw SQL string interpolation
- Pydantic models for form validation on every write operation

### [Security]
- Admin authentication: bcrypt-hashed passwords, session-based login
- Role-based access: every page checks if user_id exists in `admins` table (implicit role, no role column)
- Audit trail: all admin mutations logged to `audit_log` table
- Secrets in `.env` (never committed); loaded via `python-dotenv`
- Input sanitization: Pydantic validation + Streamlit auto-escaping
- SQL injection prevention: SQLAlchemy ORM exclusively
