"""
Settings routes.
 
    GET    /api/settings/profile                — get own profile
    PATCH  /api/settings/profile                — update name / phone / bio
    POST   /api/settings/profile/avatar         — upload new avatar photo
 
    POST   /api/settings/security/change-password   — change password
    GET    /api/settings/security/2fa/status        — get 2FA enabled flag
    POST   /api/settings/security/2fa/setup         — generate TOTP secret + URI
    POST   /api/settings/security/2fa/enable        — verify code + activate 2FA
    POST   /api/settings/security/2fa/disable       — verify code + deactivate 2FA
 
Active Sessions → Coming Soon (no endpoints implemented yet).
 
All routes require a valid JWT via @host_required.
"""
 
from flask import g, request
from marshmallow import ValidationError
 
from app.blueprints.settings import settings_bp
from app.blueprints.settings.schemas import (
    UpdateProfileSchema,
    ChangePasswordSchema,
    TwoFAVerifySchema,
)
from app.middleware.auth_middleware import host_required
from app.services import settings_service
from app.services.settings_service import SettingsError
from app.utils.response import success_response, error_response
from app.utils.validators import allowed_file, ALLOWED_DOCUMENT_EXTENSIONS
 
 
# ── §12.1  Profile ────────────────────────────────────────────────────
 
@settings_bp.route("/profile", methods=["GET"])
@host_required
def get_profile():
    """Return the authenticated host's profile data."""
    data = settings_service.get_profile(g.current_host)
    return success_response(data=data)
 
 
@settings_bp.route("/profile", methods=["PATCH"])
@host_required
def update_profile():
    """
    Update editable profile fields: full_name, phone, bio.
    Avatar is a separate multipart endpoint to keep JSON vs file handling clean.
    """
    schema = UpdateProfileSchema()
    try:
        data = schema.load(request.get_json() or {})
    except ValidationError as err:
        return error_response("Validation failed.", errors=err.messages, status=422)
 
    try:
        updated = settings_service.update_profile(g.current_host, data)
    except SettingsError as err:
        return error_response(err.message, status=err.status)
 
    return success_response(message="Profile updated successfully.", data=updated)
 
 
@settings_bp.route("/profile/avatar", methods=["POST"])
@host_required
def upload_avatar():
    """
    Upload a new avatar photo (multipart/form-data, field name: avatar).
    Accepts jpg, jpeg, png — max 5 MB.
    """
    file = request.files.get("avatar")
 
    if not file:
        return error_response("No file provided. Send the image as 'avatar'.", status=422)
 
    ALLOWED_AVATAR_EXTS = {"jpg", "jpeg", "png"}
    if not allowed_file(file.filename, ALLOWED_AVATAR_EXTS):
        return error_response(
            "Unsupported file type. Upload a JPG or PNG image.", status=422
        )
 
    try:
        result = settings_service.update_avatar(g.current_host, file)
    except SettingsError as err:
        return error_response(err.message, status=err.status)
 
    return success_response(
        message="Avatar updated successfully.",
        data=result,
    )
 
 
# ── §12.2  Security — Change Password ────────────────────────────────
 
@settings_bp.route("/security/change-password", methods=["POST"])
@host_required
def change_password():
    """
    Verify the host's current password, then replace it.
 
    Body (JSON):
        current_password  — the host's existing password
        new_password      — must meet strength requirements
        confirm_password  — must match new_password
    """
    schema = ChangePasswordSchema()
    try:
        data = schema.load(request.get_json() or {})
    except ValidationError as err:
        return error_response("Validation failed.", errors=err.messages, status=422)
 
    try:
        settings_service.change_password(
            host=g.current_host,
            current_pw=data["current_password"],
            new_pw=data["new_password"],
        )
    except SettingsError as err:
        return error_response(err.message, status=err.status)
 
    return success_response(message="Password changed successfully.")
 
 
# ── §12.2  Security — 2FA ────────────────────────────────────────────
 
@settings_bp.route("/security/2fa/status", methods=["GET"])
@host_required
def twofa_status():
    """Return current 2FA state: { enabled: bool, has_secret: bool }"""
    data = settings_service.get_2fa_status(g.current_host)
    return success_response(data=data)
 
 
@settings_bp.route("/security/2fa/setup", methods=["POST"])
@host_required
def twofa_setup():
    """
    Generate (or regenerate) a TOTP secret for this host and return
    the provisioning URI for a QR code plus the raw secret for
    manual entry.  2FA is NOT yet enabled — the host must call
    /2fa/enable with a valid code to activate it.
 
    Response:
        secret           — base32 secret (show once for manual backup)
        provisioning_uri — otpauth:// URI rendered as a QR code by the frontend
    """
    data = settings_service.setup_2fa(g.current_host)
    return success_response(
        message="Scan the QR code with your authenticator app, then verify with /2fa/enable.",
        data=data,
    )
 
 
@settings_bp.route("/security/2fa/enable", methods=["POST"])
@host_required
def twofa_enable():
    """
    Verify the first TOTP code after setup and activate 2FA.
 
    Body (JSON):
        totp_code — 6-digit code from the authenticator app
    """
    schema = TwoFAVerifySchema()
    try:
        data = schema.load(request.get_json() or {})
    except ValidationError as err:
        return error_response("Validation failed.", errors=err.messages, status=422)
 
    try:
        settings_service.enable_2fa(g.current_host, data["totp_code"])
    except SettingsError as err:
        return error_response(err.message, status=err.status)
 
    return success_response(message="Two-factor authentication enabled.")
 
 
@settings_bp.route("/security/2fa/disable", methods=["POST"])
@host_required
def twofa_disable():
    """
    Verify a live TOTP code, then disable 2FA and wipe the secret.
 
    Body (JSON):
        totp_code — 6-digit code from the authenticator app
    """
    schema = TwoFAVerifySchema()
    try:
        data = schema.load(request.get_json() or {})
    except ValidationError as err:
        return error_response("Validation failed.", errors=err.messages, status=422)
 
    try:
        settings_service.disable_2fa(g.current_host, data["totp_code"])
    except SettingsError as err:
        return error_response(err.message, status=err.status)
 
    return success_response(message="Two-factor authentication disabled.")
 
 
# ── Active Sessions (Coming Soon) ─────────────────────────────────────
# Placeholder so the frontend receives a clean 501 instead of a 404.
 
@settings_bp.route("/security/sessions", methods=["GET"])
@host_required
def list_sessions():
    return error_response(
        "Active Sessions management is not yet available.", status=501
    )