from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Text, Numeric,
    ForeignKey, Index, func
)
from sqlalchemy.orm import relationship
from .database import Base


# ─── Admin Models ─────────────────────────────────────────────────

class AdminAccount(Base):
    __tablename__ = "admin_accounts"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    password_changed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class LoginAttempt(Base):
    __tablename__ = "login_attempts"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), nullable=False, index=True)
    attempted_at = Column(DateTime(timezone=True), server_default=func.now())
    success = Column(Boolean, default=False)
    ip_address = Column(String(45), nullable=True)


class OTPVerification(Base):
    __tablename__ = "otp_verifications"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), nullable=False, index=True)
    code = Column(String(6), nullable=False)
    purpose = Column(String(50), nullable=False)  # 'login', 'password_reset', 'signup'
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AdminAuditLog(Base):
    __tablename__ = "admin_audit_log"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, nullable=True)
    admin_username = Column(String(50), nullable=True)
    action = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ─── Support Tickets ───────────────────────────────────────────────

class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    requester_name = Column(String(100), nullable=True)
    requester_email = Column(String(100), nullable=True, index=True)
    category = Column(String(50), default="general", index=True)
    priority = Column(String(20), default="medium", index=True)
    status = Column(String(20), default="open", index=True)
    assigned_to = Column(String(50), nullable=True)
    resolution = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


# ─── Disputes ──────────────────────────────────────────────────────

class Dispute(Base):
    __tablename__ = "disputes"

    id = Column(Integer, primary_key=True, index=True)
    booking_external_id = Column(String(100), nullable=True, index=True)
    filed_by = Column(String(100), nullable=True)
    filed_by_email = Column(String(100), nullable=True)
    reason = Column(Text, nullable=False)
    evidence = Column(Text, nullable=True)
    status = Column(String(20), default="open", index=True)
    resolution = Column(Text, nullable=True)
    resolved_by = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


# ─── System Settings ──────────────────────────────────────────────

class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


# ─── Withdrawals ───────────────────────────────────────────────────

class Withdrawal(Base):
    __tablename__ = "withdrawals"

    id = Column(Integer, primary_key=True, index=True)
    host_id = Column(Integer, nullable=False, index=True)
    host_name = Column(String(100), nullable=True)
    host_email = Column(String(100), nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    method = Column(String(50), nullable=True)  # bank, gcash, paymaya, etc.
    status = Column(String(20), default="pending", index=True)  # pending, approved, rejected, completed
    reference_number = Column(String(100), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    class Config:
        from_attributes = True
