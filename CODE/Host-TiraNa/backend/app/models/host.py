"""
ORM models for HOSTS, HOST_PROFILES, HOST_KYC_DOCUMENTS,
OTP_VERIFICATIONS, and PAYOUT_ACCOUNTS.

Matches Section 2.1 ("Auth & Host Profiles") of host_dashboard_design.md.
PayoutAccount is included here per the Section 10 file map, but it is
primarily used by the Settings/Wallet blueprints in later phases.
"""

from datetime import datetime
from sqlalchemy import orm
from app.extensions import db


class Host(db.Model):
    __tablename__ = "HOSTS"

    STATUSES = ("awaiting_verification", "active", "suspended", "inactive")

    id = db.Column(db.Integer, db.Identity(), primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(30), nullable=False, default="awaiting_verification")
    email_verified = db.Column(db.Integer, nullable=False, default=0)  # 0/1
    tfa_enabled = db.Column(db.Integer, nullable=False, default=0)     # 0/1 — added for §12.2
    tfa_secret = db.Column(db.String(64))                              # TOTP base32 secret
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    profile = db.relationship(
        "HostProfile", backref="host", uselist=False, cascade="all, delete-orphan"
    )
    kyc_documents = db.relationship(
        "HostKycDocument", backref="host", cascade="all, delete-orphan"
    )
    payout_accounts = db.relationship(
        "PayoutAccount", backref="host", cascade="all, delete-orphan"
    )

    @orm.reconstructor
    def init_on_load(self):
        self.status = self.status.strip() if self.status else self.status

    def __repr__(self):
        return f"<Host {self.email}>"


class HostProfile(db.Model):
    __tablename__ = "HOST_PROFILES"

    id = db.Column(db.Integer, db.Identity(), primary_key=True)
    host_id = db.Column(
        db.Integer, db.ForeignKey("HOSTS.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    full_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    avatar_url = db.Column(db.String(500))
    bio = db.Column(db.Text)
    is_superhost = db.Column(db.Integer, default=0)  # 0/1
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<HostProfile {self.full_name}>"


class HostKycDocument(db.Model):
    __tablename__ = "HOST_KYC_DOCUMENTS"

    DOCUMENT_TYPES = ("id_card", "passport", "drivers_license", "selfie_with_id")
    STATUSES = ("pending", "approved", "rejected")

    id = db.Column(db.Integer, db.Identity(), primary_key=True)
    host_id = db.Column(db.Integer, db.ForeignKey("HOSTS.id", ondelete="CASCADE"), nullable=False)
    document_type = db.Column(db.String(50), nullable=False)
    document_url = db.Column(db.String(500), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="pending")
    review_notes = db.Column(db.String(500))
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    reviewed_at = db.Column(db.DateTime)

    def __repr__(self):
        return f"<HostKycDocument {self.document_type} ({self.status})>"


class OtpVerification(db.Model):
    __tablename__ = "OTP_VERIFICATIONS"

    PURPOSES = ("email_verification", "password_reset", "withdrawal_confirm")

    id = db.Column(db.Integer, db.Identity(), primary_key=True)
    email = db.Column(db.String(255), nullable=False, index=True)
    otp_code = db.Column(db.String(6), nullable=False)
    purpose = db.Column(db.String(50), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    verified_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<OtpVerification {self.email} ({self.purpose})>"


class PayoutAccount(db.Model):
    __tablename__ = "PAYOUT_ACCOUNTS"

    ACCOUNT_TYPES = ("bank", "gcash", "maya")

    id = db.Column(db.Integer, db.Identity(), primary_key=True)
    host_id = db.Column(db.Integer, db.ForeignKey("HOSTS.id", ondelete="CASCADE"), nullable=False)
    account_type = db.Column(db.String(20), nullable=False)
    account_name = db.Column(db.String(100), nullable=False)
    account_number = db.Column(db.String(50), nullable=False)
    bank_name = db.Column(db.String(100))
    is_default = db.Column(db.Integer, default=0)
    is_verified = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<PayoutAccount {self.account_type}:{self.account_number}>"