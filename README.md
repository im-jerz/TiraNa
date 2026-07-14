# TiraNa

**A Digital Rental Platform for Tenants and Property Owners Across the Philippines**

TiraNa is an integrated long-term and short-term rental platform designed for fresh graduates from Philippine provinces who relocate to Metro Manila for employment. The system addresses the lack of verified data on safety, availability, and legitimacy in existing online rental systems — a demographic that faces pervasive rental scams, housing costs consuming 60–100% of entry-level salaries, and informal lease agreements with no legal recourse.

---

## Table of Contents

- [System Overview](#system-overview)
- [Modules](#modules)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Client Module (Tenant Portal)](#client-module-tenant-portal)
  - [Host Module (Property Owner Dashboard)](#host-module-property-owner-dashboard)
  - [Admin Module (Admin Panel)](#admin-module-admin-panel)
- [Running All Modules Together](#running-all-modules-together)
- [Default Accounts](#default-accounts)

---

## System Overview

TiraNa is built on a **microservices architecture** with three independent subsystems, each with its own frontend, backend, and database:

| Module | Purpose | Backend | Frontend | Database |
|--------|---------|---------|----------|----------|
| **Client** | Tenant/renter portal | Node.js + Express | React + Vite | CockroachDB |
| **Host** | Property owner dashboard | Python + Flask | React + Vite | Oracle Database Free |
| **Admin** | Platform administration | Python + FastAPI | React + Vite | PostgreSQL |

### Key Features

- **Landlord & Property Verification** — Admin-reviewed ID and ownership documents to prevent rental scams
- **Secure Payments** — PayMongo-integrated payments (GCash, Maya, credit/debit cards)
- **Digital Lease Management** — In-app lease contracts and booking management
- **Neighborhood Guides** — Cost-of-living data, commute options, and safety info for Metro Manila areas
- **Review & Rating System** — Post-stay ratings for landlords and properties
- **Admin Dashboard** — Dispute resolution, analytics, user management, and audit logs

---

## Modules

### Client Module (Tenant Portal)
Lets tenants search for and book housing safely. Features include:
- ID verification submission
- Property browsing with filters (location, price, type, amenities)
- Booking creation, cancellation, and refund requests
- Secure checkout via PayMongo
- Reviews, ratings, and saved properties (wishlist)
- Notifications and profile management

### Host Module (Property Owner Dashboard)
Lets landlords list and manage their rental properties. Features include:
- Dashboard with property, booking, revenue, and review summaries
- Full property listing creation (photos, pricing, amenities, rules, cancellation policy)
- Booking management (confirm, cancel, refund)
- Guest management with private notes
- Revenue tracking and payout history

### Admin Module (Admin Panel)
Oversees the entire platform. Features include:
- Platform-wide statistics dashboard
- User and admin account management
- Listing moderation (approve, reject, suspend, hide/show)
- Booking oversight with full timeline visibility
- Verification management for hosts and clients
- Withdrawal approval/rejection
- Support ticket and dispute management
- Audit logs for all administrative activity

---

## Prerequisites

Before running any module, ensure you have the following installed:

- **Docker** & **Docker Compose** (recommended for easiest setup)
- **Node.js 18+** and **npm** (for local dev without Docker)
- **Python 3.12+** and **pip** (for Host and Admin backends without Docker)

---

## Getting Started

### Client Module (Tenant Portal)

**Using Docker (recommended):**

```bash
cd Client-TiraNa
docker-compose up --build
```

This starts:
- Frontend at `http://localhost:5173`
- Backend API at `http://localhost:5000`
- CockroachDB at port `26257` (SQL) / `8080` (Web UI)

**Local development (without Docker):**

```bash
# Backend
cd Client-TiraNa/backend
cp .env.example .env   # configure environment variables
npm install
npm run dev            # starts on port 5000

# Frontend (in a separate terminal)
cd Client-TiraNa/frontend
npm install
npm run dev            # starts on port 5173
```

**Environment variables** (`backend/.env`):

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | CockroachDB connection string | `postgresql://root@localhost:26257/defaultdb?sslmode=disable` |
| `JWT_SECRET` | Secret for JWT token signing | your-secret-key |
| `SMTP_HOST` | Email SMTP server | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | your-email@gmail.com |
| `SMTP_PASS` | SMTP app password | your-app-password |
| `PAYMONGO_SECRET_KEY` | PayMongo secret key | test key |
| `PAYMONGO_PUBLIC_KEY` | PayMongo public key | test key |

**Database setup (local dev without Docker):**

After starting CockroachDB, run the init queries to create all required tables:

```bash
cockroach sql --url "postgresql://root@localhost:26257/defaultdb?sslmode=disable" --file Client-TiraNa/backend/db/init.sql
```

Or manually execute the SQL in `backend/db/init.sql` via the CockroachDB Web UI at `http://localhost:8080`.

---

### Host Module (Property Owner Dashboard)

**Using Docker (recommended):**

```bash
cd Host-TiraNa
docker-compose up --build
```

This starts:
- Frontend at `http://localhost:5174`
- Backend API at `http://localhost:5001`
- Oracle Database Free at port `1521`

**Local development (without Docker):**

```bash
# Backend
cd Host-TiraNa/backend
cp .env.example .env   # configure environment variables
pip install -r requirements.txt
python wsgi.py         # starts on port 5000

# Frontend (in a separate terminal)
cd Host-TiraNa/frontend
npm ci
npm run dev            # starts on port 5174
```

**Environment variables** (`backend/.env`):

| Variable | Description | Example |
|----------|-------------|---------|
| `FLASK_ENV` | Environment mode | `development` |
| `SECRET_KEY` | Flask secret key | random-string |
| `JWT_SECRET_KEY` | JWT signing key | random-string |
| `DATABASE_URL` | Oracle connection string | `oracle+oracledb://USER:PASS@localhost:1521/?service_name=FREEPDB1` |
| `MAIL_SERVER` | SMTP server | `smtp.gmail.com` |
| `MAIL_PORT` | SMTP port | `587` |
| `MAIL_USERNAME` | SMTP user | your-email@gmail.com |
| `MAIL_PASSWORD` | SMTP password | your-app-password |
| `MAIL_DEFAULT_SENDER` | Sender email | your-email@gmail.com |
| `CLIENT_API_URL` | Client module API URL | `http://localhost:5000` |
| `ADMIN_API_URL` | Admin module API URL | `http://localhost:5002` |
| `ADMIN_INTERNAL_API_KEY` | Shared secret for inter-service calls | `tirana-internal-secret-key` |

---

### Admin Module (Admin Panel)

**Using Docker (recommended):**

```bash
cd Admin-TiraNa
docker-compose up --build
```

This starts:
- Frontend at `http://localhost:5175`
- Backend API at `http://localhost:5002` (Swagger docs at `/docs`)
- PostgreSQL at port `5432`

> Migrations run automatically on startup via Alembic.

**Local development (without Docker):**

```bash
# Backend
cd Admin-TiraNa/backend
cp ../.env .env         # or create .env with required variables
pip install -r requirements.txt
alembic upgrade head    # run database migrations
python seed_admin.py    # seed initial admin account
uvicorn app.main:app --reload --port 5002

# Frontend (in a separate terminal)
cd Admin-TiraNa/frontend
npm install
npm run dev             # starts on port 5175
```

**Environment variables** (`Admin-TiraNa/.env`):

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://tira_admin:tira_secret@localhost:5432/tirana_db` |
| `SECRET_KEY` | JWT signing secret | your-secret-key |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token TTL | `60` |
| `POSTGRES_USER` | DB username | `tira_admin` |
| `POSTGRES_PASSWORD` | DB password | `tira_secret` |
| `POSTGRES_DB` | DB name | `tirana_db` |
| `SMTP_HOST` | SMTP server | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | your-email@gmail.com |
| `SMTP_PASS` | SMTP app password | your-app-password |
| `SMTP_FROM` | Sender email | your-email@gmail.com |
| `HOST_API_BASE_URL` | Host module API URL | `http://localhost:5001` |
| `CLIENT_API_BASE_URL` | Client module API URL | `http://localhost:5000` |
| `INTERNAL_API_KEY` | Shared secret for inter-service calls | `tirana-internal-secret-key` |

---

## Running All Modules Together

Start each module in separate terminals. **Order matters** — start Client first, then Host, then Admin, because each module's backend references the previous ones:

```bash
# Terminal 1 — Client (port 5000)
cd Client-TiraNa && docker-compose up --build

# Terminal 2 — Host (port 5001)
cd Host-TiraNa && docker-compose up --build

# Terminal 3 — Admin (port 5002)
cd Admin-TiraNa && docker-compose up --build
```

### Access Points

| Service | URL |
|---------|-----|
| Client Frontend | http://localhost:5173 |
| Host Frontend | http://localhost:5174 |
| Admin Frontend | http://localhost:5175 |
| Admin API Docs (Swagger) | http://localhost:5002/docs |
| CockroachDB Web UI | http://localhost:8080 |

---

## Default Accounts

### Admin
- **Username:** `start_admin`
- **Email:** `admin@tirana.com`
- **Password:** `Admin123@`

---

## Tech Stack Summary

| Component | Technology |
|-----------|------------|
| Client Backend | Node.js 18 + Express 4 |
| Client Frontend | React 18 + Vite 5 + Tailwind CSS |
| Client Database | CockroachDB v23.2.11 |
| Host Backend | Python 3.13 + Flask 3.0 |
| Host Frontend | React 19 + Vite 8 + Tailwind CSS |
| Host Database | Oracle Database Free |
| Admin Backend | Python 3.12 + FastAPI + Uvicorn |
| Admin Frontend | React 18 + Vite 5 + Tailwind CSS |
| Admin Database | PostgreSQL 16 |
| Payments | PayMongo (GCash, Maya, Cards) |
| Containerization | Docker + Docker Compose |
| Auth | JWT + bcrypt + OTP verification |
