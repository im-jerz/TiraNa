"""
Business logic for the Settings blueprint.
 
Covers §12.1 Profile Settings and §12.2 Security Settings
(change password + 2FA TOTP; Active Sessions is Coming Soon).
 
2FA uses TOTP (RFC 6238) via the pyotp library.
The TOTP secret is stored in HOSTS.tfa_secret (VARCHAR2 64).
It is only written once the host verifies the first code (POST /2fa/enable).
"""
 
import secrets
from datetime import datetime
 
import pyotp
from flask import current_app
 
from app.extensions import db, bcrypt
from app.models.host import Host, HostProfile
from app.services.upload_service import save_avatar
 
 
class SettingsError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.message = message
        self.status = status
 
 
# ── Helpers ───────────────────────────────────────────────────────────
 
def _derive_verification_status(host: Host) -> str:
    """
    Derives the display verification status shown on the ID card.
    A host is 'verified' when their account is active and email-confirmed.
    """
    if host.status == "active" and host.email_verified:
        return "verified"
    return "pending"
 
 
def _serialize_profile(host: Host) -> dict:
    p = host.profile
    return {
        "host_id":             host.id,
        "email":               host.email,
        "full_name":           p.full_name if p else "",
        "phone":               p.phone if p else None,
        "avatar_url":          p.avatar_url if p else None,
        "bio":                 p.bio if p else None,
        "verification_status": _derive_verification_status(host),
        "member_since":        host.created_at.strftime("%Y-%m-%d") if host.created_at else None,
    }
 
 
# ── §12.1 Profile ─────────────────────────────────────────────────────
 
def get_profile(host: Host) -> dict:
    """Returns the serialized profile for the settings ID card."""
    return _serialize_profile(host)
 
 
def update_profile(host: Host, data: dict) -> dict:
    """
    Updates HOST_PROFILES fields (full_name, phone, bio).
    Avatar is handled separately via update_avatar().
    """
    profile = host.profile
 
    if profile is None:
        # Shouldn't happen in production, but guard defensively
        profile = HostProfile(host_id=host.id)
        db.session.add(profile)
 
    profile.full_name  = data["full_name"].strip()
    profile.phone      = data["phone"].strip()
    profile.bio        = (data.get("bio") or "").strip() or None
    profile.updated_at = datetime.utcnow()
 
    db.session.commit()
    return _serialize_profile(host)
 
 
def update_avatar(host: Host, file_storage) -> dict:
    """
    Saves a new avatar image and updates HOST_PROFILES.avatar_url.
    Uses upload_service.save_avatar() so the storage backend can be
    swapped from local disk to Cloudinary without touching this service.
    """
    max_bytes = current_app.config.get("MAX_CONTENT_LENGTH", 5 * 1024 * 1024)
    file_storage.seek(0, 2)          # seek to end
    size = file_storage.tell()
    file_storage.seek(0)
 
    if size > 5 * 1024 * 1024:      # hard-cap avatar at 5 MB regardless of global limit
        raise SettingsError("Avatar photo must be 5 MB or smaller.", status=422)
 
    avatar_url = save_avatar(file_storage, host_id=host.id)
 
    profile = host.profile
    if profile is None:
        profile = HostProfile(host_id=host.id, full_name="")
        db.session.add(profile)
 
    profile.avatar_url  = avatar_url
    profile.updated_at  = datetime.utcnow()
 
    db.session.commit()
    return {"avatar_url": avatar_url}
 
 
# ── §12.2 Security — Change Password ─────────────────────────────────
 
def change_password(host: Host, current_pw: str, new_pw: str) -> None:
    """
    Verifies the current password, then replaces it with the hashed
    new password.  Raises SettingsError(401) on wrong current password.
    """
    if not bcrypt.check_password_hash(host.password_hash, current_pw):
        raise SettingsError("Current password is incorrect.", status=401)
 
    host.password_hash = bcrypt.generate_password_hash(new_pw).decode("utf-8")
    host.updated_at    = datetime.utcnow()
 
    db.session.commit()
 
 
# ── §12.2 Security — 2FA (TOTP) ──────────────────────────────────────
 
def _issuer() -> str:
    return current_app.config.get("APP_NAME", "TiraNa")
 
 
def get_2fa_status(host: Host) -> dict:
    return {
        "enabled": bool(host.tfa_enabled),
        "has_secret": bool(host.tfa_secret),
    }
 
 
def setup_2fa(host: Host) -> dict:
    """
    Generates a fresh TOTP secret, stores it on the host row (but does
    NOT flip tfa_enabled yet — that happens after the host verifies the
    first code via enable_2fa()).
 
    Returns the provisioning URI that the frontend renders as a QR code
    via a library like qrcode.js, plus the raw secret for manual entry.
    """
    secret = pyotp.random_base32()
 
    # Persist the pending secret so enable_2fa() can verify against it
    host.tfa_secret  = secret
    host.updated_at  = datetime.utcnow()
    db.session.commit()
 
    totp = pyotp.TOTP(secret)
    uri  = totp.provisioning_uri(name=host.email, issuer_name=_issuer())
 
    return {
        "secret":           secret,
        "provisioning_uri": uri,
    }
 
 
def enable_2fa(host: Host, totp_code: str) -> None:
    """
    Verifies the code against the pending secret stored during setup_2fa(),
    then flips tfa_enabled = 1.
 
    Raises SettingsError(422) if no secret exists or the code is wrong.
    """
    if not host.tfa_secret:
        raise SettingsError(
            "No 2FA setup in progress. Call /2fa/setup first.", status=422
        )
 
    totp = pyotp.TOTP(host.tfa_secret)
    if not totp.verify(totp_code, valid_window=1):
        raise SettingsError("Incorrect authenticator code. Try again.", status=422)
 
    host.tfa_enabled = 1
    host.updated_at  = datetime.utcnow()
    db.session.commit()
 
 
def disable_2fa(host: Host, totp_code: str) -> None:
    """
    Verifies a live TOTP code, then disables 2FA and clears the secret.
    Requires the host to prove they still have access to their authenticator.
    """
    if not host.tfa_enabled or not host.tfa_secret:
        raise SettingsError("Two-factor authentication is not currently enabled.", status=422)
 
    totp = pyotp.TOTP(host.tfa_secret)
    if not totp.verify(totp_code, valid_window=1):
        raise SettingsError("Incorrect authenticator code. Try again.", status=422)
 
    host.tfa_enabled = 0
    host.tfa_secret  = None
    host.updated_at  = datetime.utcnow()
    db.session.commit()