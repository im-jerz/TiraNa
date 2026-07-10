from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AdminLoginRequest(BaseModel):
    username: str
    password: str


class AdminResponse(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    password_changed: bool
    created_at: datetime
    class Config:
        from_attributes = True


class AdminTokenResponse(BaseModel):
    access_token: str
    token_type: str
    admin: Optional[AdminResponse] = None
    requires_otp: bool = False
    temp_token: Optional[str] = None


class VerifyOTPRequest(BaseModel):
    email: str
    code: str
    temp_token: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class AdminCreateRequest(BaseModel):
    username: str
    email: str
    password: str


class AdminUpdateRequest(BaseModel):
    email: Optional[str] = None
    is_active: Optional[bool] = None


class AdminRegisterRequest(BaseModel):
    username: str
    email: str
    password: str


class AdminRegisterVerifyRequest(BaseModel):
    email: str
    code: str


class AdminAcceptInviteRequest(BaseModel):
    email: str
    code: str
    password: str


class AdminInviteRequest(BaseModel):
    username: str
    email: str


class TicketCreateRequest(BaseModel):
    subject: str
    description: str
    requester_name: Optional[str] = None
    requester_email: Optional[str] = None
    category: str = "general"
    priority: str = "medium"


class TicketUpdateRequest(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    priority: Optional[str] = None
    resolution: Optional[str] = None


class TicketResponse(BaseModel):
    id: int
    subject: str
    description: str
    requester_name: Optional[str] = None
    requester_email: Optional[str] = None
    category: str
    priority: str
    status: str
    assigned_to: Optional[str] = None
    resolution: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True


class DisputeCreateRequest(BaseModel):
    booking_external_id: Optional[str] = None
    filed_by: str
    filed_by_email: Optional[str] = None
    reason: str
    evidence: Optional[str] = None


class DisputeUpdateRequest(BaseModel):
    status: Optional[str] = None
    resolution: Optional[str] = None
    resolved_by: Optional[str] = None


class DisputeResponse(BaseModel):
    id: int
    booking_external_id: Optional[str] = None
    filed_by: Optional[str] = None
    filed_by_email: Optional[str] = None
    reason: str
    evidence: Optional[str] = None
    status: str
    resolution: Optional[str] = None
    resolved_by: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True


class SettingResponse(BaseModel):
    id: int
    key: str
    value: Optional[str] = None
    description: Optional[str] = None
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True


class SettingUpdateRequest(BaseModel):
    value: str
    description: Optional[str] = None


class PublicStatsResponse(BaseModel):
    total_admins: int = 0
    active_admins: int = 0
    total_users: int = 0
    total_bookings: int = 0
    total_revenue: float = 0


# ── Dashboard Schemas ──

class DashboardStatsResponse(BaseModel):
    total_users: int = 0
    verified_users: int = 0
    unverified_users: int = 0
    active_listings: int = 0
    total_bookings: int = 0
    revenue_this_month: float = 0
    pending_withdrawals: int = 0
    open_support_tickets: int = 0
    revenue_trend: list = []
    booking_trend: list = []


# ── Audit Log Schemas ──

class AdminAuditLogResponse(BaseModel):
    id: int
    admin_id: Optional[int] = None
    admin_username: Optional[str] = None
    action: str
    details: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True


# ── Host Proxy Schemas ──

class RoomResponse(BaseModel):
    id: int
    name: str
    host_name: Optional[str] = None
    host_email: Optional[str] = None
    price_per_night: Optional[float] = None
    status: str = "active"
    photo_url: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    property_type: Optional[str] = None
    max_guests: Optional[int] = None
    bedrooms: Optional[int] = None
    beds: Optional[int] = None
    bathrooms: Optional[float] = None


class BookingResponse(BaseModel):
    id: str
    listing_title: Optional[str] = None
    listing_id: Optional[str] = None
    guest_name: Optional[str] = None
    guest_email: Optional[str] = None
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    nights: Optional[int] = None
    total_price: Optional[float] = None
    status: str = "pending"
    cancellation_reason: Optional[str] = None


class PaymentResponse(BaseModel):
    id: str  # UUID string from Client backend
    payer_name: Optional[str] = None
    amount: float = 0
    method: Optional[str] = None
    status: str = "pending"
    created_at: Optional[str] = None
    booking_external_id: Optional[str] = None  # Add this field for booking reference
    payer_email: Optional[str] = None  # Add this field for email display


class ReviewResponse(BaseModel):
    id: int
    user_name: Optional[str] = None
    rating: float = 0
    comment: Optional[str] = None
    is_hidden: bool = False
    created_at: Optional[str] = None


class WithdrawalResponse(BaseModel):
    id: int
    host_name: Optional[str] = None
    amount: float = 0
    method: Optional[str] = None
    status: str = "pending"
    created_at: Optional[str] = None


class WithdrawalListResponse(BaseModel):
    data: list
    total: int = 0
    skip: int = 0
    limit: int = 0


class VerificationResponse(BaseModel):
    id: str
    name: Optional[str] = None
    email: Optional[str] = None
    type: str = "host"
    status: str = "pending"
    phone: Optional[str] = None
    id_url: Optional[str] = None
    id_back_url: Optional[str] = None
    selfie_url: Optional[str] = None
    created_at: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str = "Host"
    status: str = "active"
    is_verified: bool = False
    created_at: Optional[str] = None
