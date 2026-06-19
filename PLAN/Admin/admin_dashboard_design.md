# AirBnB Clone Admin Dashboard — Technical Design

## 1. Overview

**Architecture decisions:**

- **Pattern:** Modular Monolith – Single repo, clear module boundaries, easy to split later
- **Frontend:** Streamlit Multi-Page App – As specified
- **Database:** PostgreSQL + SQLAlchemy ORM – Parameterized queries, migrations via Alembic
- **Auth:** Session-based via `streamlit-authenticator` – Bcrypt hashing, 30‑min timeout
- **State:** `st.session_state` + cached DB queries – Streamlit-native

**Data ownership principle:**

- Admin dashboard owns its own tables (admin accounts, support tickets, disputes, system settings, audit log)
- Hosts, listings, guests are owned by Host module – accessed read‑only via API
- No `role` column – each module has its own auth

---

## 2. Host Module API Contract

Admin dashboard will call these endpoints (to be implemented by Host module team).

Base URL stored in `system_settings` keys.

**Listing endpoints:**

- `GET /api/admin/listings?status=pending` – fetch pending listings (with host email, photos)
- `POST /api/admin/listings/{id}/approve` – approve listing
- `POST /api/admin/listings/{id}/reject` – reject with reason
- `POST /api/admin/listings/{id}/suspend` – suspend listing

**Host endpoints:**

- `GET /api/admin/hosts/{external_id}` – get host details (badge, verification, total listings)

**Guest endpoints:**

- `GET /api/admin/guests/{external_id}` – get guest details (for support tickets)

**Booking endpoints (read-only):**

- `GET /api/admin/bookings` – get all bookings (paginated)
- `GET /api/admin/bookings?status={status}` – get bookings by status
- `GET /api/admin/bookings/{id}` – get booking details
- `GET /api/admin/bookings/{id}/timeline` – get booking status timeline

**Payment endpoints (read-only):**

- `GET /api/admin/payments` – get all payments (paginated)
- `GET /api/admin/payments?booking_id={id}` – get payment by booking
- `GET /api/admin/payments/{id}` – get payment details

**Review endpoints (read + moderate):**

- `GET /api/admin/reviews` – get all reviews (paginated)
- `GET /api/admin/reviews?listing_id={id}` – get reviews by listing
- `GET /api/admin/reviews/{id}/hide` – hide review
- `GET /api/admin/reviews/{id}/show` – show review

**Payout endpoints:**

- `GET /api/admin/withdrawals` – get all withdrawal requests
- `POST /api/admin/withdrawals/{id}/approve` – approve withdrawal
- `POST /api/admin/withdrawals/{id}/reject` – reject withdrawal

**Stats endpoint:**

- `GET /api/admin/stats` – dashboard KPIs (total bookings, revenue, active listings)
- `GET /api/admin/stats/revenue?period={period}` – revenue by period
- `GET /api/admin/stats/bookings?period={period}` – booking stats by period

**Authentication:** API key (sent as `X-API-Key` header) or JWT (to be decided with Host module team).

---

## 3. Pages Overview

1. **Dashboard** – KPIs, revenue chart, alerts. Data from admin DB + Host API.
2. **Admin Management** – Manage admin accounts (CRUD, OTP invites). Data from admin DB.
3. **Listings Moderation** – Approve/reject/suspend listings. Data from Host API.
4. **Bookings** – View, cancel, export bookings. Data from admin DB.
5. **Payments** – Process refunds, view revenue. Data from admin DB + PayMongo webhook.
6. **Reviews** – Moderate reviews. Data from admin DB.
7. **Support & Disputes** – Ticket system, KYC verification. Data from admin DB.
8. **Settings** – Commission %, API URLs, etc. Data from admin DB.

---

## 4. Data Flow

**Booking flow:**

```
Client → Host Flask API → Host Oracle DB (hosts, listings, original bookings)
                ↓
         Admin Dashboard (Streamlit)
                ↓
         Our PostgreSQL DB (admin_accounts, bookings_copy, payments, reviews, etc.)
                ↓
         Host API (for listing moderation, host/guest details)
```

**Payment flow:**

```
Client → PayMongo → Host webhook → Host Oracle DB
                ↓
         Admin ← Host API (GET /api/admin/payments) ← Host Oracle DB
                ↓
         Admin views payments, tracks commissions (read-only)
```

**Support ticket flow:**

```
Client → Our API (POST /api/support/tickets) → Our PostgreSQL
                ↓
         Admin ← Direct DB query → admin_support_tickets table
                ↓
         Admin assigns, resolves tickets (full CRUD)
```

**Dispute flow:**

```
Client → Our API (POST /api/disputes) → Our PostgreSQL
                ↓ (or auto-created from cancelled booking)
         Admin views disputes, investigates via Host messages API
                ↓
         Admin resolves dispute → updates status + resolution
```

**Payout flow:**

```
Host → Host API (POST /api/withdrawals) → Host Oracle DB
                ↓
         Admin ← Host API (GET /api/admin/withdrawals) ← Host Oracle DB
                ↓
         Admin approves/rejects → Host API (POST /api/admin/withdrawals/{id}/approve)
```

**Sync mechanism** – Admin dashboard will poll Host API for listing status and host/guest data. No real-time webhook initially (can be added later).

---

## 5. Security & Auth

- **Admin login** – uses `admin_accounts` table; no `role` column.
- **Session** – `streamlit-authenticator` with bcrypt; timeout 30 min.
- **Audit** – every admin write action logged to `audit_log`.
- **Rate limiting** – 5 failed login attempts per 15 min (DB tracked).
- **API calls to Host module** – use API key stored in `system_settings`.

**Per-module authentication** (no shared `role` column):

- **Admin** – manually created by existing admin → `admin_accounts` table
- **Host** – Host module client app → `hosts` table (Host module DB)
- **Guest** – Host module client app → `guests` table (Host module DB)

---

## 6. Implementation Plan (10 phases)

1. Project scaffold, DB connection, Alembic – ~8 files
2. Auth system (admin login, session) – ~4 files
3. Dashboard Overview (KPIs, charts) – ~3 files
4. Admin Management (CRUD, OTP invites) – ~4 files
5. Listings Moderation (API client + Host API) – ~4 files
6. Bookings Management (calendar, cancellations) – ~3 files
7. Payments & Refunds (PayMongo integration) – ~4 files
8. Reviews Management – ~2 files
9. Support & Disputes (tickets, KYC) – ~4 files
10. System Settings & Audit Log – ~3 files

---

**End of document**
