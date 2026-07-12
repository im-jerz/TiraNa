"""
OTP generation helpers.

Per Section 2.1, OTP_VERIFICATIONS.otp_code is a 6-digit VARCHAR2(6).
Codes expire after Config.OTP_EXPIRY_MINUTES minutes (default 10).
"""

import secrets
from datetime import datetime, timedelta
from flask import current_app


def generate_otp_code() -> str:
    """Generate a zero-padded numeric OTP (default length: 6)."""
    length = current_app.config.get("OTP_LENGTH", 6)
    return "".join(secrets.choice("0123456789") for _ in range(length))


def get_otp_expiry() -> datetime:
    """Returns the UTC datetime at which a newly-issued OTP expires."""
    minutes = current_app.config.get("OTP_EXPIRY_MINUTES", 10)
    return datetime.utcnow() + timedelta(minutes=minutes)
