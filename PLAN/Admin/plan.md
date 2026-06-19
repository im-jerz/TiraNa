# Admin Module Flow

## 1. Dashboard & Overview

### 1.1 Main Dashboard

```text
[Admin Dashboard]
├─ Summary Cards
│  ├─ Total Registered Users
│  ├─ Total Verified Hosts
│  ├─ Active Listings
│  ├─ Active Bookings
│  └─ Platform Revenue
├─ Recent Activities
├─ Pending Listing Approvals
├─ Open Support Tickets
└─ Quick Access to Management Sections
```

---

## 2. User & Host Management

### 2.1 User Management

```text
[User Management]
├─ View registered users
├─ Search and filter accounts
├─ View user details
├─ Suspend or reactivate accounts
├─ Monitor account status
└─ View verification information
```

### 2.2 Host Management

```text
[Host Management]
├─ View host profiles
├─ Review verification requests
├─ Approve or reject host verification
├─ Assign host badges
└─ Monitor host status
```

### 2.3 Support & Disputes

```text
[Support Center]
├─ View support tickets
├─ Assign ticket priority
├─ Respond to user concerns
├─ Resolve disputes
└─ Close completed cases
```

---

## 3. Listing Moderation

### 3.1 Listing Review

```text
[Listing Management]
├─ View submitted listings
├─ Review property information
├─ Review uploaded images
├─ Approve listings
└─ Reject or flag listings
```

### 3.2 Content Moderation

```text
[Moderation]
├─ Monitor reported listings
├─ Remove policy violations
├─ Review flagged content
└─ Record moderation actions
```

---

## 4. Booking Supervision

### 4.1 Booking Monitoring

```text
[Booking Management]
├─ View booking records
├─ Search reservations
├─ Track booking status
├─ View booking details
└─ Monitor booking history
```

### 4.2 Booking Actions

```text
[Reservation Actions]
├─ Review cancellation requests
├─ Process refund requests
├─ Resolve booking disputes
└─ Apply administrative overrides
```

---

## 5. Financial Oversight

### 5.1 Payments & Revenue

```text
[Financial Dashboard]
├─ View payment transactions
├─ Monitor platform commissions
├─ Track host payouts
├─ Review payment disputes
└─ Generate revenue summaries
```

---

## 6. Analytics & Reports

### 6.1 Dashboard Analytics

```text
[Analytics]
├─ Gross Booking Value (GBV)
├─ Active Listings
├─ User Growth
├─ Booking Trends
└─ Revenue Metrics
```

### 6.2 Reports

```text
[Reports]
├─ Platform performance
├─ Seasonal demand
├─ User activity
├─ Booking insights
└─ Export reports
```

---

## 7. Platform Settings

### 7.1 System Configuration

```text
[System Settings]
├─ Commission rates
├─ Platform fees
├─ Tax configuration
├─ Cleaning fee limits
└─ General platform settings
```

---

## 8. Admin Database (PostgreSQL)

```text
PostgreSQL
├─ support_tickets
├─ verification_records
├─ moderation_actions
├─ admin_logs
├─ reports
├─ analytics_data
└─ system_settings
```

---

## 9. Admin API Endpoints

```text
User Management
GET    /api/admin/users
PATCH  /api/admin/users/{id}/status

Host Management
GET    /api/admin/hosts
PATCH  /api/admin/hosts/{id}/verify

Listing Moderation
GET    /api/admin/listings/pending
PATCH  /api/admin/listings/{id}/approve

Booking Management
GET    /api/admin/bookings
PATCH  /api/admin/bookings/{id}/resolve

Support
GET    /api/admin/support
PATCH  /api/admin/support/{id}/close

Analytics
GET    /api/admin/analytics

Settings
GET    /api/admin/settings
PUT    /api/admin/settings
```
