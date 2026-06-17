"""
Marshmallow request/response schemas for the Auth blueprint.

Field-level validation here mirrors the frontend validation in
pages/auth/*.jsx (password strength, PH phone format, matching
confirm fields) so the API never trusts client-side checks alone.
"""

import re
from marshmallow import Schema, fields, validates, validates_schema, ValidationError

# Min 8 chars, at least one uppercase, one digit, one special character
PASSWORD_PATTERN = re.compile(r"^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$")

# PH mobile numbers: 09xxxxxxxxx or +639xxxxxxxxx
PH_PHONE_PATTERN = re.compile(r"^(\+63|0)[0-9]{10}$")

OTP_PURPOSES = ("email_verification", "password_reset", "withdrawal_confirm")


def _validate_password(value):
    if not PASSWORD_PATTERN.match(value):
        raise ValidationError(
            "Password must be at least 8 characters and include an "
            "uppercase letter, a number, and a special character."
        )


# ─── Registration (flow.md 1.1 Sign Up, Steps 1-2) ────────────────────

class RegisterSchema(Schema):
    full_name = fields.String(required=True)
    email = fields.Email(required=True)
    password = fields.String(required=True, load_only=True)
    confirm_password = fields.String(required=True, load_only=True)
    phone = fields.String(required=True)

    @validates("full_name")
    def validate_full_name(self, value, **kwargs):
        if not value.strip():
            raise ValidationError("Full name is required.")

    @validates("password")
    def validate_password(self, value, **kwargs):
        _validate_password(value)

    @validates("phone")
    def validate_phone(self, value, **kwargs):
        if not PH_PHONE_PATTERN.match(value.replace(" ", "")):
            raise ValidationError("Enter a valid PH phone number (e.g. 09xxxxxxxxx).")

    @validates_schema
    def validate_passwords_match(self, data, **kwargs):
        if data.get("password") != data.get("confirm_password"):
            raise ValidationError("Passwords do not match.", field_name="confirm_password")


# ─── Login (flow.md 1.2 Sign In) ───────────────────────────────────────

class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True, load_only=True)


# ─── OTP verification (flow.md 1.1 Step 3, 1.3 Forgot Password) ───────

class OtpVerifySchema(Schema):
    email = fields.Email(required=True)
    otp_code = fields.String(required=True)
    purpose = fields.String(load_default="email_verification")

    @validates("otp_code")
    def validate_otp_code(self, value, **kwargs):
        if not (len(value) == 6 and value.isdigit()):
            raise ValidationError("OTP must be a 6-digit code.")

    @validates("purpose")
    def validate_purpose(self, value, **kwargs):
        if value not in OTP_PURPOSES:
            raise ValidationError(f"Purpose must be one of: {', '.join(OTP_PURPOSES)}.")


class ResendOtpSchema(Schema):
    email = fields.Email(required=True)
    purpose = fields.String(load_default="email_verification")

    @validates("purpose")
    def validate_purpose(self, value, **kwargs):
        if value not in OTP_PURPOSES:
            raise ValidationError(f"Purpose must be one of: {', '.join(OTP_PURPOSES)}.")


# ─── Forgot / reset password (flow.md 1.3 Account Recovery) ───────────

class ForgotPasswordSchema(Schema):
    email = fields.Email(required=True)


class ResetPasswordSchema(Schema):
    email = fields.Email(required=True)
    otp_code = fields.String(required=True)
    new_password = fields.String(required=True, load_only=True)
    confirm_password = fields.String(required=True, load_only=True)

    @validates("otp_code")
    def validate_otp_code(self, value, **kwargs):
        if not (len(value) == 6 and value.isdigit()):
            raise ValidationError("OTP must be a 6-digit code.")

    @validates("new_password")
    def validate_password(self, value, **kwargs):
        _validate_password(value)

    @validates_schema
    def validate_passwords_match(self, data, **kwargs):
        if data.get("new_password") != data.get("confirm_password"):
            raise ValidationError("Passwords do not match.", field_name="confirm_password")


# ─── Response shape ────────────────────────────────────────────────────

class HostPublicSchema(Schema):
    """Safe subset of Host fields returned after login/register."""
    id = fields.Integer()
    email = fields.Email()
    status = fields.String()
    email_verified = fields.Boolean()
    full_name = fields.String(attribute="profile.full_name")
    avatar_url = fields.String(attribute="profile.avatar_url", allow_none=True)
