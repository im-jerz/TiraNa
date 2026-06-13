# AirBnB Clone Admin Dashboard — Technical Design

## 1. Overview

**Architecture decisions:**

- **Pattern:** Modular Monolith – Single repo, clear module boundaries, easy to split later
- **Frontend:** Streamlit Multi-Page App – As specified
- **Database:** PostgreSQL + SQLAlchemy ORM – Parameterized queries, migrations via Alembic
- **Auth:** Session-based via `streamlit-authenticator` – Bcrypt hashing, 30‑min timeout, OTP verification
- **State:** `st.session_state` + cached DB queries – Streamlit-native

**Data ownership principle:**

- Admin dashboard owns its own tables (admin accounts, support tickets, disputes, system settings, audit log)
- Hosts, rooms, guests are owned by Host module – accessed read‑only via API
- No `role` column – each module has its own auth

---

## 2. Admin Login Flow

```
Admin enters email/password
       ↓
streamlit-authenticator (bcrypt check sa admin_accounts table)
       ↓
If 5 failed attempts → lock for 15 min (rate limiting)
       ↓
Success → Generate OTP (6 digits) → Save to otp_verifications table
       ↓
Admin enters OTP
       ↓
OTP verified → session stored (30 min timeout)
       ↓
Redirect to Dashboard
```

**OTP Details:**

- 6-digit code, expires in 5 minutes
- Purpose: `'login'`
- Stored in `otp_verifications` table
- Audit log on successful login: `admin_id`, `action: 'login'`, `ip_address`

---

## 3. Account Verification Flow

```
Host/Guest signs up → Submits verification documents (ID, selfie, etc.)
       ↓
Admin reviews verification request
       ↓
Approve → Host can post rooms, Guest can book rooms
Reject → Request sent back with reason
```

**Verification endpoints (Host module API):**

- `GET /api/admin/verifications` – get all pending verifications
- `GET /api/admin/verifications/{id}` – get verification details
- `POST /api/admin/verifications/{id}/approve` – approve account
- `POST /api/admin/verifications/{id}/reject` – reject with reason

**Verification documents:**

- To be decided with Host module team (ID, passport, selfie, etc.)
- Host module stores documents, admin reviews via API

---

## 4. Host Module API Contract

Admin dashboard will call these endpoints (to be implemented by Host module team).

Base URL stored in `system_settings` keys.

**Room endpoints:**

- `GET /api/admin/rooms?status=pending` – fetch pending rooms (with host email, photos)
- `GET /api/admin/rooms/{id}` – get room details
- `POST /api/admin/rooms/{id}/hide` – hide room (when reported)
- `POST /api/admin/rooms/{id}/show` – show room (after review)

**Host endpoints:**

- `GET /api/admin/hosts/{external_id}` – get host details (badge, verification, total rooms)
- `GET /api/admin/hosts/{external_id}/wallet` – get host wallet balance

**Guest endpoints:**

- `GET /api/admin/guests/{external_id}` – get guest details (for support tickets)

**Booking endpoints (read-only):**

- `GET /api/admin/bookings` – get all bookings (paginated)
- `GET /api/admin/bookings?status={status}` – get bookings by status
- `GET /api/admin/bookings/{id}` – get booking details
- `GET /api/admin/bookings/{id}/timeline` – get booking status timeline

**Payment endpoints:**

- `POST /api/payment/initiate` – initiate payment (amount based on room price from Host module DB)
- `GET /api/admin/payments` – get all payments (paginated)
- `GET /api/admin/payments?booking_id={id}` – get payment by booking
- `GET /api/admin/payments/{id}` – get payment details

**Review endpoints (read + moderate):**

- `GET /api/admin/reviews` – get all reviews (paginated)
- `GET /api/admin/reviews?room_id={id}` – get reviews by room
- `GET /api/admin/reviews/{id}/hide` – hide review
- `GET /api/admin/reviews/{id}/show` – show review

**Payout endpoints:**

- `GET /api/admin/withdrawals` – get all withdrawal requests
- `POST /api/admin/withdrawals/{id}/approve` – approve withdrawal
- `POST /api/admin/withdrawals/{id}/reject` – reject withdrawal

**Stats endpoint:**

- `GET /api/admin/stats` – dashboard KPIs (total bookings, revenue, active rooms)
- `GET /api/admin/stats/revenue?period={period}` – revenue by period
- `GET /api/admin/stats/bookings?period={period}` – booking stats by period

**Authentication:** API key (sent as `X-API-Key` header) or JWT (to be decided with Host module team).

**Note:** PayMongo test key only, no webhook initially.

---

## 5. Pages Overview

1. **Dashboard** – KPIs, revenue chart, alerts. Data from admin DB + Host API.
2. **Admin Management** – Manage admin accounts (CRUD, OTP invites). Data from admin DB.
3. **Account Verification** – Review and approve/reject host/guest accounts. Data from Host API.
4. **Rooms Management** – Hide/show rooms (when reported). Data from Host API.
5. **Bookings** – View, cancel, export bookings. Data from admin DB.
6. **Payments** – Process refunds, view revenue. Data from admin DB + Host API.
7. **Reviews** – Moderate reviews. Data from admin DB.
8. **Support & Disputes** – Ticket system, KYC verification. Data from admin DB.
9. **Settings** – Commission %, API URLs, etc. Data from admin DB.

---

## 6. Data Flow

**Booking flow:**

```
Client → Host Flask API → Host Oracle DB (hosts, rooms, original bookings)
                ↓
         Admin Dashboard (Streamlit)
                ↓
         Our PostgreSQL DB (admin_accounts, bookings_copy, payments, reviews, etc.)
                ↓
         Host API (for room reports, host/guest details)
```

**Payment flow:**

```
Client clicks "Pay" → Admin dashboard calls:
POST /api/payment/initiate (Host module API)
→ Amount based on room price from Host module DB
→ Returns payment link or PayMongo test key
→ Client completes payment
→ Host module updates their DB
→ Admin polls for payment status
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

**Sync mechanism** – Admin dashboard will poll Host API for room status and host/guest data. No real-time webhook initially (can be added later).

---

## 7. Security & Auth

- **Admin login** – uses `admin_accounts` table; no `role` column.
- **Session** – `streamlit-authenticator` with bcrypt; timeout 30 min.
- **OTP** – 6-digit code, 5 min expiry, stored in `otp_verifications` table.
- **Audit** – every admin write action logged to `audit_log`.
- **Rate limiting** – 5 failed login attempts per 15 min (DB tracked).
- **API calls to Host module** – use API key stored in `system_settings`.

**Per-module authentication** (no shared `role` column):

- **Admin** – manually created by existing admin → `admin_accounts` table
- **Host** – Host module client app → `hosts` table (Host module DB)
- **Guest** – Host module client app → `guests` table (Host module DB)

---

## 8. Implementation Plan (10 phases)

1. Project scaffold, DB connection, Alembic – ~8 files
2. Auth system (admin login, OTP, session) – ~5 files
3. Dashboard Overview (KPIs, charts) – ~3 files
4. Admin Management (CRUD, OTP invites) – ~4 files
5. Account Verification (API client + Host API) – ~3 files
6. Rooms Management (hide/show rooms) – ~2 files
7. Bookings Management (calendar, cancellations) – ~3 files
8. Payments & Refunds (Host API integration) – ~4 files
9. Support & Disputes (tickets, KYC) – ~4 files
10. System Settings & Audit Log – ~3 files

---

**End of document**
