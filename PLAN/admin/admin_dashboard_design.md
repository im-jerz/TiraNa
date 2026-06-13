# AirBnB Clone Admin Dashboard — Technical Design

## 1. Overview

| Choice | Decision | Rationale |
|--------|----------|-----------|
| **Pattern** | Modular Monolith | Single repo, clear module boundaries, easy to split later |
| **Frontend** | Streamlit Multi-Page App | User specified Streamlit |
| **Database** | PostgreSQL + SQLAlchemy ORM | User specified PostgreSQL; SQLAlchemy for parameterized queries & migrations |
| **Auth** | Session-based via `streamlit-authenticator` | Native Streamlit integration, bcrypt hashing |
| **Migrations** | Alembic | SQLAlchemy-native schema versioning |
| **State** | `st.session_state` + cached DB queries | Streamlit-native, no extra libs |

**Boundary:** The admin dashboard owns only admin, booking, payment, support, and system data. Host, listing, and guest profile data lives in Carl's module — accessed via API.

---

## 2. Admin Database Schema

### 2.1 Admin Auth & Profile (2 tables)

```sql
-- 1. ADMIN_ACCOUNTS (core auth data)
CREATE TABLE admin_accounts (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ADMIN_PROFILES (personal info, linked to admin_accounts)
CREATE TABLE admin_profiles (
    id              SERIAL PRIMARY KEY,
    admin_id        INT UNIQUE REFERENCES admin_accounts(id) ON DELETE CASCADE,
    full_name       VARCHAR(100) NOT NULL,
    phone           VARCHAR(20),
    avatar_url      TEXT,
    clearance_level VARCHAR(50) DEFAULT 'standard',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 Bookings & Transactions (4 tables)

```sql
-- 3. BOOKINGS
-- guest_external_id: Carl's guest ID (fetched via API for display)
CREATE TABLE bookings (
    id                  SERIAL PRIMARY KEY,
    listing_id          VARCHAR(255) NOT NULL,          -- Carl's listing ID
    guest_external_id   VARCHAR(255) NOT NULL,          -- Carl's guest ID
    check_in            DATE NOT NULL,
    check_out           DATE NOT NULL,
    guests_count        INT DEFAULT 1,
    total_price         DECIMAL(10,2),
    status              VARCHAR(20) DEFAULT 'pending'
                        CHECK (status IN ('pending','confirmed','cancelled','completed','disputed')),
    cancellation_reason TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PAYMENTS (PayMongo gateway)
CREATE TABLE payments (
    id                  SERIAL PRIMARY KEY,
    booking_id          INT REFERENCES bookings(id),
    payer_external_id   VARCHAR(255) NOT NULL,          -- Carl's guest ID
    payee_external_id   VARCHAR(255) NOT NULL,          -- Carl's host ID
    amount              DECIMAL(10,2) NOT NULL,
    commission          DECIMAL(10,2) DEFAULT 0,
    payment_method      VARCHAR(50),
    status              VARCHAR(20) DEFAULT 'pending'
                        CHECK (status IN ('pending','completed','refunded','disputed')),
    transaction_id      VARCHAR(100),
    paymongo_payment_id VARCHAR(255),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PAYOUTS
CREATE TABLE payouts (
    id                  SERIAL PRIMARY KEY,
    host_external_id    VARCHAR(255) NOT NULL,          -- Carl's host ID
    amount              DECIMAL(10,2) NOT NULL,
    status              VARCHAR(20) DEFAULT 'pending'
                        CHECK (status IN ('pending','processing','completed','failed')),
    method              VARCHAR(50),
    processed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 6. REVIEWS (one per booking, after completion)
CREATE TABLE reviews (
    id                      SERIAL PRIMARY KEY,
    booking_id              INT UNIQUE REFERENCES bookings(id),
    listing_id              VARCHAR(255) NOT NULL,      -- Carl's listing ID
    reviewer_external_id    VARCHAR(255) NOT NULL,      -- Carl's guest ID
    rating                  INT CHECK (rating BETWEEN 1 AND 5),
    comment                 TEXT,
    response                TEXT,
    is_visible              BOOLEAN DEFAULT TRUE,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.3 Support & Disputes (2 tables)

```sql
-- 7. ADMIN_SUPPORT_TICKETS
CREATE TABLE admin_support_tickets (
    id                       SERIAL PRIMARY KEY,
    submitted_by_external_id VARCHAR(255),              -- Carl's user ID
    booking_id               INT REFERENCES bookings(id),
    subject                  VARCHAR(200) NOT NULL,
    description              TEXT,
    category                 VARCHAR(50),               -- 'booking','payment','listing','account','other'
    priority                 VARCHAR(20) DEFAULT 'medium'
                             CHECK (priority IN ('low','medium','high','urgent')),
    status                   VARCHAR(20) DEFAULT 'open'
                             CHECK (status IN ('open','in_progress','resolved','closed')),
    assigned_to_admin_id     INT REFERENCES admin_accounts(id),
    resolution               TEXT,
    created_at               TIMESTAMPTZ DEFAULT NOW(),
    updated_at               TIMESTAMPTZ DEFAULT NOW()
);

-- 8. DISPUTES
CREATE TABLE disputes (
    id                   SERIAL PRIMARY KEY,
    ticket_id            INT REFERENCES admin_support_tickets(id),
    booking_id           INT REFERENCES bookings(id),
    filed_by_external_id VARCHAR(255),                  -- Carl's user ID
    reason               VARCHAR(50),                   -- 'cancellation','damage','no_show','other'
    description          TEXT,
    evidence_urls        TEXT[],
    resolution           TEXT,
    resolved_by_admin_id INT REFERENCES admin_accounts(id),
    status               VARCHAR(20) DEFAULT 'open'
                         CHECK (status IN ('open','under_review','resolved','closed')),
    refund_amount        DECIMAL(10,2) DEFAULT 0,
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    resolved_at          TIMESTAMPTZ
);
```

### 2.4 System & Security (3 tables)

```sql
-- 9. SYSTEM_SETTINGS (platform config + external API keys)
CREATE TABLE system_settings (
    id                   SERIAL PRIMARY KEY,
    key                  VARCHAR(100) UNIQUE NOT NULL,
    value                TEXT,
    description          TEXT,
    updated_by_admin_id  INT REFERENCES admin_accounts(id),
    updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- 10. AUDIT_LOG (admin action tracking)
CREATE TABLE audit_log (
    id          SERIAL PRIMARY KEY,
    admin_id    INT REFERENCES admin_accounts(id),
    action      VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),                           -- 'admin','booking','payment','setting'
    target_id   INT,
    details     JSONB,
    ip_address  INET,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 11. OTP_VERIFICATIONS (admin-only: login, password reset, admin invite)
CREATE TABLE otp_verifications (
    id          SERIAL PRIMARY KEY,
    email       VARCHAR(255) NOT NULL,
    otp_code    VARCHAR(6) NOT NULL,
    purpose     VARCHAR(50) CHECK (purpose IN ('login','password_reset','admin_invite')),
    expires_at  TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.5 External ID Reference Pattern

All guest, host, and listing references use external IDs from Carl's service.

| Field | References | Source |
|-------|------------|--------|
| `guest_external_id` | Guest user ID | Carl's guest service |
| `host_external_id` | Host user ID | Carl's host service |
| `listing_id` | Listing ID | Carl's listing service |
| `reviewer_external_id` | Guest user ID | Carl's guest service |
| `filed_by_external_id` | User ID (guest/host) | Carl's service |
| `payer_external_id` | Guest user ID | Carl's guest service |
| `payee_external_id` | Host user ID | Carl's host service |

Guest/host/listing details (name, email, etc.) are fetched via Carl's API at runtime — no local storage.

---

## 3. Carl's API Contract

API config stored in `system_settings` (`carl_api_base_url`, `carl_api_key`).

### Host Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/hosts?email={email}` | GET | Get host details |
| `/api/admin/hosts/{external_id}` | GET | Get single host |
| `/api/admin/hosts/{external_id}/listings` | GET | Get host's listings |

### Listing Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/listings?status={status}` | GET | Get paginated listings |
| `/api/admin/listings/{id}` | GET | Get listing details |
| `/api/admin/listings/{id}/approve` | POST | Approve listing |
| `/api/admin/listings/{id}/reject` | POST | Reject listing (with reason) |
| `/api/admin/listings/{id}/suspend` | POST | Suspend listing |

### Guest Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/guests?email={email}` | GET | Get guest profile |
| `/api/admin/guests/{external_id}` | GET | Get single guest |

Wrapper functions in `services/external_api.py` call these endpoints.

---

## 4. Pages Overview

| Page | Purpose | Data Source |
|------|---------|-------------|
| 1. Dashboard Overview | KPIs, charts, alerts, activity feed | DB + API |
| 2. Host & Guest Management | View/manage hosts and guests | Carl's API |
| 3. Listings Management | Approve/reject/suspend listings | Carl's API |
| 4. Booking Management | Calendar, bookings, cancellations | DB |
| 5. Payments & Commissions | Revenue, payouts, disputes | DB |
| 6. Analytics & Reports | Charts, trends, downloadable reports | DB + API |
| 7. Support & Disputes | Tickets, disputes, resolution | DB |
| 8. System Settings | Config, fees, external API setup | DB |

---

## 5. Security & Auth

| Category | Implementation |
|----------|----------------|
| **Auth** | `streamlit-authenticator` with bcrypt; session timeout 30 min |
| **Authz** | Admin if `admin_id` exists in `admin_accounts` — no role column |
| **Input Validation** | Pydantic models for all form submissions |
| **SQL Injection** | SQLAlchemy ORM with parameterized queries only |
| **XSS** | Streamlit auto-escaping; sanitize `unsafe_allow_html=True` |
| **Rate Limiting** | Login attempts limited to 5/15min via DB |
| **Audit Logging** | `audit_log` records all admin actions |
| **Secrets** | `.env` for DB credentials, never committed |
| **External API Keys** | Stored in `system_settings`, not in code |

### Per-Module Authentication

| Module | Sign Up | Sign In |
|--------|---------|---------|
| **Admin** | Created manually by existing admin | Admin login → `admin_accounts` table |
| **Host** | Carl's API (external) | Admin views via API call |
| **Guest** | Carl's API (external) | Admin views via API call |

---

## 6. Implementation Plan

| Phase | Scope |
|-------|-------|
| 1 | Project scaffold, DB connection, models, Alembic migrations |
| 2 | Auth system, sidebar, page routing |
| 3 | Dashboard Overview (KPIs, charts) |
| 4 | Host & Guest Management (via API) |
| 5 | Listings Management (via API) |
| 6 | Booking Management |
| 7 | Payments & Commissions |
| 8 | Analytics & Reports |
| 9 | Support & Disputes |
| 10 | System Settings + External API config |

### Key Dependencies

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
requests>=2.31
```
