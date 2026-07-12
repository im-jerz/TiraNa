"""
Marshmallow request/response schemas for the Settings blueprint.
 
Covers:
  - Profile update  (§12.1)
  - Change password (§12.2)
  - 2FA enable/disable (§12.2)
"""
 
import re
from marshmallow import Schema, fields, validates, validates_schema, ValidationError
 
PASSWORD_PATTERN = re.compile(r"^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$")
PH_PHONE_PATTERN  = re.compile(r"^(\+63|0)[0-9]{10}$")
 
 
def _validate_password_strength(value):
    if not PASSWORD_PATTERN.match(value):
        raise ValidationError(
            "Password must be at least 8 characters and include an "
            "uppercase letter, a number, and a special character."
        )
 
 
# ── Profile ──────────────────────────────────────────────────────────
 
class UpdateProfileSchema(Schema):
    full_name = fields.String(required=True)
    phone     = fields.String(required=True)
    bio       = fields.String(load_default="", allow_none=True)
 
    @validates("full_name")
    def validate_full_name(self, value, **kwargs):
        v = value.strip()
        if not v:
            raise ValidationError("Full name is required.")
        if len(v) > 100:
            raise ValidationError("Full name must be 100 characters or fewer.")
 
    @validates("phone")
    def validate_phone(self, value, **kwargs):
        if not PH_PHONE_PATTERN.match(value.replace(" ", "")):
            raise ValidationError("Enter a valid PH phone number (e.g. 09xxxxxxxxx or +639xxxxxxxxx).")
 
    @validates("bio")
    def validate_bio(self, value, **kwargs):
        if value and len(value) > 500:
            raise ValidationError("Bio must be 500 characters or fewer.")
 
 
class ProfileResponseSchema(Schema):
    """Safe public representation of a host's profile."""
    id                  = fields.Integer(attribute="host_id")
    email               = fields.String()
    full_name           = fields.String()
    phone               = fields.String(allow_none=True)
    avatar_url          = fields.String(allow_none=True)
    bio                 = fields.String(allow_none=True)
    verification_status = fields.String()
    member_since        = fields.String()
 
 
# ── Security: password ────────────────────────────────────────────────
 
class ChangePasswordSchema(Schema):
    current_password = fields.String(required=True, load_only=True)
    new_password     = fields.String(required=True, load_only=True)
    confirm_password = fields.String(required=True, load_only=True)
 
    @validates("current_password")
    def validate_current(self, value, **kwargs):
        if not value:
            raise ValidationError("Current password is required.")
 
    @validates("new_password")
    def validate_new(self, value, **kwargs):
        _validate_password_strength(value)
 
    @validates_schema
    def validate_match(self, data, **kwargs):
        if data.get("new_password") != data.get("confirm_password"):
            raise ValidationError("Passwords don't match.", field_name="confirm_password")
 
 
# ── Security: 2FA ─────────────────────────────────────────────────────
 
class TwoFAVerifySchema(Schema):
    """Used for both enable and disable — just needs the 6-digit TOTP code."""
    totp_code = fields.String(required=True)
 
    @validates("totp_code")
    def validate_code(self, value, **kwargs):
        if not (len(value) == 6 and value.isdigit()):
            raise ValidationError("TOTP code must be a 6-digit number.")