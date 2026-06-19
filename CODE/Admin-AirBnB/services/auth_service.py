import logging
from datetime import datetime, timedelta, timezone

import bcrypt
from sqlalchemy.orm import Session

from config import Config
from models.admin_user import AdminUser
from models.login_attempt import LoginAttempt
from models.otp_code import OTPCode
from services.email_service import send_otp_email
from utils.otp import generate_random_code

logger = logging.getLogger(__name__)

MAX_LOGIN_ATTEMPTS = 5
LOGIN_LOCKOUT_MINUTES = 15
MAX_OTP_ATTEMPTS = 5
OTP_LOCKOUT_MINUTES = 15


def generate_otp(db: Session, admin_id: str, purpose: str) -> str:
    code = generate_random_code(Config.OTP_LENGTH)
    otp = OTPCode(
        admin_id=admin_id,
        code=code,
        purpose=purpose,
        expires_at=OTPCode.create_expires_at(Config.OTP_EXPIRY_MINUTES),
    )
    db.add(otp)
    db.commit()
    return code


def register_admin(db: Session, email: str, password: str, full_name: str) -> tuple[str | None, str | None]:
    existing = db.query(AdminUser).filter(AdminUser.email == email).first()
    if existing:
        return None, "Email already registered"

    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()
    admin = AdminUser(email=email, password_hash=password_hash, full_name=full_name)
    db.add(admin)
    db.commit()
    db.refresh(admin)

    code = generate_otp(db, admin.id, "signup_verify")
    email_sent = send_otp_email(email, code, "signup_verify")
    if Config.APP_ENV == "development":
        logger.info("DEV MODE — OTP code for %s: %s", email, code)
    if not email_sent:
        return None, "Failed to send verification email. Please try again."
    return admin.id, None


def verify_signup_otp(db: Session, admin_id: str, code: str) -> tuple[bool, str | None]:
    admin = db.query(AdminUser).filter(AdminUser.id == admin_id).first()
    if not admin:
        return False, "Admin not found"

    if admin.otp_locked_until and admin.otp_locked_until > datetime.now(timezone.utc):
        remaining = (admin.otp_locked_until - datetime.now(timezone.utc)).seconds // 60 + 1
        return False, f"Too many failed attempts. Try again in {remaining} min."

    otp = (
        db.query(OTPCode)
        .filter(
            OTPCode.admin_id == admin_id,
            OTPCode.code == code,
            OTPCode.purpose == "signup_verify",
            OTPCode.used == False,
        )
        .order_by(OTPCode.created_at.desc())
        .first()
    )
    if not otp or otp.expires_at < datetime.now(timezone.utc):
        admin.failed_otp_attempts += 1
        if admin.failed_otp_attempts >= MAX_OTP_ATTEMPTS:
            admin.otp_locked_until = datetime.now(timezone.utc) + timedelta(minutes=OTP_LOCKOUT_MINUTES)
        db.commit()
        return False, "Invalid or expired code"

    otp.used = True
    admin.failed_otp_attempts = 0
    admin.otp_locked_until = None
    db.commit()
    return True, None


def login_admin(db: Session, email: str, password: str) -> tuple[str | None, str | None]:
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=LOGIN_LOCKOUT_MINUTES)
    recent_failures = (
        db.query(LoginAttempt)
        .filter(
            LoginAttempt.email == email,
            LoginAttempt.success == False,
            LoginAttempt.attempted_at > cutoff,
        )
        .count()
    )
    if recent_failures >= MAX_LOGIN_ATTEMPTS:
        return None, f"Too many failed attempts. Try again in {LOGIN_LOCKOUT_MINUTES} min."

    admin = db.query(AdminUser).filter(AdminUser.email == email).first()
    if not admin or not bcrypt.checkpw(password.encode(), admin.password_hash.encode()):
        db.add(LoginAttempt(email=email, success=False))
        db.commit()
        return None, "Invalid email or password"

    db.add(LoginAttempt(email=email, success=True))
    db.commit()

    code = generate_otp(db, admin.id, "signin_verify")
    email_sent = send_otp_email(email, code, "signin_verify")
    if Config.APP_ENV == "development":
        logger.info("DEV MODE — OTP code for %s: %s", email, code)
    if not email_sent:
        return None, "Failed to send verification email. Please try again."
    return admin.id, None


def verify_signin_otp(db: Session, admin_id: str, code: str) -> tuple[bool, str | None]:
    admin = db.query(AdminUser).filter(AdminUser.id == admin_id).first()
    if not admin:
        return False, "Admin not found"

    if admin.otp_locked_until and admin.otp_locked_until > datetime.now(timezone.utc):
        remaining = (admin.otp_locked_until - datetime.now(timezone.utc)).seconds // 60 + 1
        return False, f"Too many failed attempts. Try again in {remaining} min."

    otp = (
        db.query(OTPCode)
        .filter(
            OTPCode.admin_id == admin_id,
            OTPCode.code == code,
            OTPCode.purpose == "signin_verify",
            OTPCode.used == False,
        )
        .order_by(OTPCode.created_at.desc())
        .first()
    )
    if not otp or otp.expires_at < datetime.now(timezone.utc):
        admin.failed_otp_attempts += 1
        if admin.failed_otp_attempts >= MAX_OTP_ATTEMPTS:
            admin.otp_locked_until = datetime.now(timezone.utc) + timedelta(minutes=OTP_LOCKOUT_MINUTES)
        db.commit()
        return False, "Invalid or expired code"

    otp.used = True
    admin.failed_otp_attempts = 0
    admin.otp_locked_until = None
    admin.last_login = datetime.now(timezone.utc)
    db.commit()
    return True, None


def get_admin_by_id(db: Session, admin_id: str) -> AdminUser | None:
    return db.query(AdminUser).filter(AdminUser.id == admin_id).first()


def has_valid_otp(db: Session, admin_id: str, purpose: str) -> bool:
    return (
        db.query(OTPCode)
        .filter(
            OTPCode.admin_id == admin_id,
            OTPCode.purpose == purpose,
            OTPCode.used == False,
            OTPCode.expires_at > datetime.now(timezone.utc),
        )
        .first()
        is not None
    )


def resend_otp(db: Session, admin_id: str, purpose: str, email: str) -> tuple[str | None, str | None]:
    # Rate limit: max 3 OTPs per admin per purpose in the last 5 minutes.
    # This prevents abuse even if the user refreshes the page (which resets
    # st.session_state.cooldown) or opens multiple tabs.
    window = datetime.now(timezone.utc) - timedelta(minutes=5)
    recent_otps = (
        db.query(OTPCode)
        .filter(
            OTPCode.admin_id == admin_id,
            OTPCode.purpose == purpose,
            OTPCode.created_at > window,
        )
        .count()
    )
    if recent_otps >= 3:
        return None, "Too many resend requests. Please wait a few minutes."

    code = generate_otp(db, admin_id, purpose)
    email_sent = send_otp_email(email, code, purpose)
    if Config.APP_ENV == "development":
        logger.info("DEV MODE — New OTP code for %s: %s", email, code)
    if not email_sent:
        return None, "Failed to send email. Please try again."
    return code, None
