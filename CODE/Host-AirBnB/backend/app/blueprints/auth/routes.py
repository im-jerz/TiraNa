"""
Auth routes.

    POST /api/auth/register
    POST /api/auth/verify-otp
    POST /api/auth/resend-otp
    POST /api/auth/login
    POST /api/auth/refresh
    POST /api/auth/logout
    POST /api/auth/forgot-password
    POST /api/auth/reset-password

Maps to flow.md Section 1 (Authentication) and the "Auth" group in
Section 16 (API Endpoints Summary) of host_dashboard_design.md.
"""

from flask import request, current_app
from marshmallow import ValidationError
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt,
    get_jwt_identity,
)

from app.blueprints.auth import auth_bp
from app.blueprints.auth.schemas import (
    RegisterSchema,
    LoginSchema,
    OtpVerifySchema,
    ResendOtpSchema,
    ForgotPasswordSchema,
    ResetPasswordSchema,
    HostPublicSchema,
)
from app.models.host import Host
from app.services import auth_service
from app.services.auth_service import AuthError
from app.services.upload_service import save_kyc_document
from app.middleware.rate_limiter import is_locked_out, record_failed_login, clear_failed_logins
from app.utils.response import success_response, error_response
from app.utils.validators import allowed_file, file_size_ok, ALLOWED_DOCUMENT_EXTENSIONS


# In-memory JWT blocklist for /logout.
# Swap for a Redis set in production so it works across multiple workers.
_token_blocklist = set()


def is_token_revoked(jwt_header, jwt_payload):
    return jwt_payload["jti"] in _token_blocklist


# ─── Register ────────────────────────────────────────────────────────
# flow.md 1.1 Sign Up — Steps 1 & 2 combined (multi-step is frontend-only;
# the backend receives the full payload + two files in one request).

@auth_bp.route("/register", methods=["POST"])
def register():
    schema = RegisterSchema()
    try:
        data = schema.load(request.form.to_dict())
    except ValidationError as err:
        return error_response("Validation failed.", errors=err.messages, status=422)

    id_file = request.files.get("id_document")
    selfie_file = request.files.get("selfie_document")

    if not id_file or not allowed_file(id_file.filename, ALLOWED_DOCUMENT_EXTENSIONS):
        return error_response(
            "Government ID is required (jpg, png, or pdf, max 5MB).", status=422
        )
    if not selfie_file or not allowed_file(selfie_file.filename, ALLOWED_DOCUMENT_EXTENSIONS):
        return error_response(
            "Selfie with ID is required (jpg or png, max 5MB).", status=422
        )

    max_size = current_app.config.get("MAX_CONTENT_LENGTH")
    if not file_size_ok(id_file, max_size) or not file_size_ok(selfie_file, max_size):
        return error_response("Each file must be 5MB or smaller.", status=422)

    id_url = save_kyc_document(id_file, folder="kyc/id")
    selfie_url = save_kyc_document(selfie_file, folder="kyc/selfie")

    try:
        host = auth_service.register_host(data, id_url, selfie_url)
    except AuthError as err:
        return error_response(err.message, status=err.status)

    return success_response(
        message="Registration submitted. We've sent a verification code to your email.",
        data={"email": host.email, "status": host.status},
        status=201,
    )


# ─── OTP verification ──────────────────────────────────────────────────
# flow.md 1.1 Sign Up — Step 3 (email OTP), and reused by reset-password.

@auth_bp.route("/verify-otp", methods=["POST"])
def verify_otp_route():
    schema = OtpVerifySchema()
    try:
        data = schema.load(request.get_json() or {})
    except ValidationError as err:
        return error_response("Validation failed.", errors=err.messages, status=422)

    try:
        auth_service.verify_otp(data["email"], data["otp_code"], data["purpose"])
    except AuthError as err:
        return error_response(err.message, status=err.status)

    return success_response(message="Verification successful.")


@auth_bp.route("/resend-otp", methods=["POST"])
def resend_otp():
    schema = ResendOtpSchema()
    try:
        data = schema.load(request.get_json() or {})
    except ValidationError as err:
        return error_response("Validation failed.", errors=err.messages, status=422)

    auth_service.create_and_send_otp(data["email"], data["purpose"])

    return success_response(message="A new verification code has been sent.")


# ─── Login ───────────────────────────────────────────────────────────
# flow.md 1.2 Sign In

@auth_bp.route("/login", methods=["POST"])
def login():
    schema = LoginSchema()
    try:
        data = schema.load(request.get_json() or {})
    except ValidationError as err:
        return error_response("Validation failed.", errors=err.messages, status=422)

    email = data["email"]

    locked, seconds_remaining = is_locked_out(email)
    if locked:
        minutes = max(seconds_remaining // 60, 1)
        return error_response(
            f"Too many failed attempts. Try again in {minutes} minute(s).", status=429
        )

    try:
        host = auth_service.authenticate_host(email, data["password"])
    except AuthError as err:
        if err.status == 401:
            record_failed_login(email)
        return error_response(err.message, status=err.status)

    clear_failed_logins(email)

    access_token = create_access_token(identity=str(host.id))
    refresh_token = create_refresh_token(identity=str(host.id))

    return success_response(
        message="Login successful.",
        data={
            "access_token": access_token,
            "refresh_token": refresh_token,
            "host": HostPublicSchema().dump(host),
        },
    )


# ─── Refresh ─────────────────────────────────────────────────────────

@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    host_id = get_jwt_identity()
    new_access_token = create_access_token(identity=str(host_id))
    return success_response(data={"access_token": new_access_token})


# ─── Logout ──────────────────────────────────────────────────────────

@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    jti = get_jwt()["jti"]
    _token_blocklist.add(jti)
    return success_response(message="Logged out successfully.")


# ─── Forgot / Reset password ────────────────────────────────────────
# flow.md 1.3 Account Recovery

@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    schema = ForgotPasswordSchema()
    try:
        data = schema.load(request.get_json() or {})
    except ValidationError as err:
        return error_response("Validation failed.", errors=err.messages, status=422)

    host = Host.query.filter_by(email=data["email"]).first()
    if host:
        auth_service.create_and_send_otp(data["email"], purpose="password_reset")

    # Always return the same generic message — don't reveal whether the
    # email is registered (prevents account enumeration).
    return success_response(
        message="If that email is registered, a reset code has been sent."
    )


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    schema = ResetPasswordSchema()
    try:
        data = schema.load(request.get_json() or {})
    except ValidationError as err:
        return error_response("Validation failed.", errors=err.messages, status=422)

    try:
        auth_service.verify_otp(data["email"], data["otp_code"], purpose="password_reset")
        auth_service.reset_password(data["email"], data["new_password"])
    except AuthError as err:
        return error_response(err.message, status=err.status)

    return success_response(message="Password updated successfully.")
