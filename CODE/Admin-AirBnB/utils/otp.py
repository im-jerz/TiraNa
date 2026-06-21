from datetime import datetime, timezone
import secrets
import string

from config import Config


def generate_random_code(length: int | None = None) -> str:
    return "".join(secrets.choice(string.digits) for _ in range(length or Config.OTP_LENGTH))


def is_otp_expired(expires_at: datetime) -> bool:
    return expires_at < datetime.now(timezone.utc)
