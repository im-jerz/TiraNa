# Admin Authentication — Sign Up / Sign In with 6-Digit Email OTP

## Overview

Complete authentication flow for the Admin-AirBnB Streamlit app:
- **Sign Up**: Email + password → receive 6-digit OTP via email → verify → account created
- **Sign In**: Email + password → receive 6-digit OTP via email → verify → session established
- **Session**: Streamlit `st.session_state` manages login persistence

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Streamlit UI (app.py)              │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐ │
│  │ Sign Up  │  │ Sign In  │  │ OTP Verify    │ │
│  │ Page     │  │ Page     │  │ Page          │ │
│  └────┬─────┘  └────┬─────┘  └───────┬───────┘ │
│       │              │                │         │
│  ┌────▼──────────────▼────────────────▼───────┐ │
│  │           Auth Service (services/)         │ │
│  │  - register_admin()                        │ │
│  │  - login_admin()                           │ │
│  │  - generate_otp() / verify_otp()           │ │
│  │  - send_otp_email()                        │ │
│  └────────────────────┬───────────────────────┘ │
│                       │                         │
│  ┌────────────────────▼───────────────────────┐ │
│  │           Database Models (models/)        │ │
│  │  - AdminUser table                         │ │
│  │  - OTPCode table                           │ │
│  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## Step 1: Database Models

### AdminUser (`models/admin_user.py`)

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK, default `gen_random_uuid` |
| `email` | STRING | UNIQUE, NOT NULL |
| `password_hash` | STRING | NOT NULL (bcrypt hashed) |
| `full_name` | STRING | NOT NULL |
| `is_active` | BOOLEAN | DEFAULT True |
| `created_at` | TIMESTAMPTZ | DEFAULT now |
| `last_login` | TIMESTAMPTZ | NULLABLE |

### OTPCode (`models/otp_code.py`)

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK, default `gen_random_uuid` |
| `admin_id` | UUID | FK → AdminUser.id, ON DELETE CASCADE |
| `code` | STRING | NOT NULL (6 digits) |
| `purpose` | STRING | NOT NULL (`signup_verify` or `signin_verify`) |
| `expires_at` | TIMESTAMPTZ | NOT NULL (created_at + 10 min) |
| `used` | BOOLEAN | DEFAULT False |
| `created_at` | TIMESTAMPTZ | DEFAULT now |

### `models/__init__.py`

Export both models, provide `init_db()` to create tables via SQLAlchemy `Base.metadata.create_all()`.

---

## Step 2: Alembic Setup

| File | Action |
|------|--------|
| `alembic.ini` | Create — point to `sqlalchemy.url` from config |
| `alembic/env.py` | Create — import models, set `target_metadata = Base.metadata` |
| `alembic/versions/` | First migration: create `admin_users` and `otp_codes` tables |

---

## Step 3: Services

### `services/auth_service.py`

Core functions:

| Function | Description |
|----------|-------------|
| `register_admin(email, password, full_name)` | Hash password with bcrypt, create `AdminUser`, generate OTP, send email, return `(admin_id, otp_sent)` |
| `verify_signup_otp(admin_id, code)` | Check OTP is valid, not expired, not used; mark OTP used; return `True/False` |
| `login_admin(email, password)` | Look up admin by email, verify bcrypt password, generate OTP, send email, return `(admin_id, otp_sent)` |
| `verify_signin_otp(admin_id, code)` | Check OTP, mark used, update `last_login`, return `True/False` |
| `generate_otp(admin_id, purpose)` | Create 6-digit random code, store in `OTPCode` with 10-min expiry, return the code |
| `get_admin_by_id(admin_id)` | Fetch admin for session restoration |

### `services/email_service.py`

| Function | Description |
|----------|-------------|
| `send_otp_email(email, code, purpose)` | Send email via SMTP using `smtplib` + `email.mime` (stdlib) |

Config via env vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

Purpose drives the email subject/body:
- `signup_verify`: "Verify your admin account — Your code is {code}"
- `signin_verify`: "Sign in verification — Your code is {code}"

### `utils/otp.py`

| Function | Description |
|----------|-------------|
| `generate_random_code(length=6)` | Return a string of 6 random digits |
| `is_otp_expired(otp_record)` | Check `created_at + 10min < now` |

---

## Step 4: Streamlit UI

### `app.py` (entry point)

- Check `st.session_state.logged_in` — if True, redirect to `pages/dashboard.py`
- If not logged in, show sidebar/tabs to choose Sign In or Sign Up

### `pages/sign_up.py`

1. Form: full_name, email, password, confirm_password
2. Client-side validation (email format, password match, min length)
3. Call `auth_service.register_admin()`
4. On success → show "OTP sent to your email" message, switch to OTP verification page

### `pages/sign_in.py`

1. Form: email, password
2. Call `auth_service.login_admin()`
3. On success → show "OTP sent to your email" message, switch to OTP verification page
4. On failure → show error

### `pages/verify_otp.py`

1. Show which email the OTP was sent to (masked: `j***n@gmail.com`)
2. 6-digit input field (or 6 separate single-digit inputs for UX)
3. Resend OTP button (with 60s cooldown)
4. Call `auth_service.verify_signup_otp()` or `verify_signin_otp()` based on context
5. On success → set `st.session_state.logged_in = True`, `st.session_state.admin_id = ...`, redirect to dashboard
6. On failure → show "Invalid or expired code"

### `pages/dashboard.py` (placeholder)

- Simple "Welcome, {name}" page with logout button
- Logout clears `st.session_state`

---

## Step 5: Configuration Updates

### `config.py` additions

```python
# SMTP Email
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
SMTP_FROM = os.getenv("SMTP_FROM", "noreply@airbnb-admin.com")

# OTP
OTP_EXPIRY_MINUTES = int(os.getenv("OTP_EXPIRY_MINUTES", "10"))
OTP_LENGTH = 6
```

### `.env.example` additions

```
# SMTP (for OTP emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@airbnb-admin.com
OTP_EXPIRY_MINUTES=10
```

---

## Step 6: Database Connection

### `database.py` (new)

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

engine = create_engine(Config.DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

## Auth Flow Diagram

### Sign Up

```
[1] User fills form → POST register_admin()
[2] DB: insert AdminUser (bcrypt pw)
[3] DB: insert OTPCode (6-digit, 10min TTL)
[4] Email: send OTP to user
[5] User enters OTP → POST verify_signup_otp()
[6] DB: mark OTP used, account verified
[7] Session: st.session_state.logged_in = True → Dashboard
```

### Sign In

```
[1] User enters email+password → POST login_admin()
[2] DB: lookup AdminUser, verify bcrypt
[3] DB: insert OTPCode (6-digit, 10min TTL)
[4] Email: send OTP to user
[5] User enters OTP → POST verify_signin_otp()
[6] DB: mark OTP used, update last_login
[7] Session: st.session_state.logged_in = True → Dashboard
```

---

## File Summary

| File | Action |
|------|--------|
| `app.py` | **Create** — Streamlit entry point |
| `database.py` | **Create** — SQLAlchemy engine + session |
| `models/__init__.py` | **Modify** — export models, `init_db()` |
| `models/admin_user.py` | **Create** — AdminUser model |
| `models/otp_code.py` | **Create** — OTPCode model |
| `services/__init__.py` | **Modify** — (empty is fine) |
| `services/auth_service.py` | **Create** — register, login, OTP logic |
| `services/email_service.py` | **Create** — SMTP email sending |
| `utils/__init__.py` | **Modify** — (empty is fine) |
| `utils/otp.py` | **Create** — OTP generation + validation helpers |
| `pages/sign_up.py` | **Create** — Sign up form |
| `pages/sign_in.py` | **Create** — Sign in form |
| `pages/verify_otp.py` | **Create** — 6-digit OTP verification page |
| `pages/dashboard.py` | **Create** — Placeholder admin dashboard |
| `config.py` | **Modify** — add SMTP + OTP config |
| `.env.example` | **Modify** — add SMTP env vars |
| `alembic.ini` | **Create** — Alembic config |
| `alembic/env.py` | **Create** — Alembic env with model imports |

---

## Security Notes

- Passwords hashed with bcrypt (cost factor 12)
- OTP codes expire after 10 minutes
- OTP codes are single-use (marked `used=True` after verification)
- Resend generates a new OTP, invalidating the previous one
- Session state is in-memory (Streamlit resets on page reload — acceptable for admin dashboard)
- SMTP credentials stored in `.env` (never hardcoded)

---

## Dependencies

All required packages are already in `requirements.txt`:

| Package | Purpose |
|---------|---------|
| `streamlit` | UI framework |
| `sqlalchemy` | ORM |
| `psycopg2-binary` | PostgreSQL driver |
| `bcrypt` | Password hashing |
| `python-dotenv` | Env vars |
| `alembic` | DB migrations |

The email service uses Python stdlib `smtplib` — no extra package needed.
