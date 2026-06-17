"""
Business logic for the Auth blueprint.

Routes stay thin — they validate input via Marshmallow schemas,
delegate to these service functions, and translate results into
HTTP responses via app.utils.response.
"""

from datetime import datetime

from flask import current_app
from flask_mail import Message

from app.extensions import db, bcrypt, mail
from app.models.host import Host, HostProfile, HostKycDocument, OtpVerification
from app.utils.otp import generate_otp_code, get_otp_expiry


class AuthError(Exception):
    """Raised for expected auth failures (bad credentials, expired OTP, etc.)."""

    def __init__(self, message, status=400):
        super().__init__(message)
        self.message = message
        self.status = status


# ─── Registration ──────────────────────────────────────────────────

def register_host(data: dict, id_document_url: str, selfie_document_url: str) -> Host:
    """
    Creates a Host (status=awaiting_verification), its HostProfile,
    two pending HostKycDocument rows, and fires an email-verification OTP.

    Maps to flow.md Section 1.1 (Sign Up) Steps 1-3.
    """
    if Host.query.filter_by(email=data["email"]).first():
        raise AuthError("Email already registered. Sign in instead.", status=409)

    password_hash = bcrypt.generate_password_hash(data["password"]).decode("utf-8")

    host = Host(
        email=data["email"],
        password_hash=password_hash,
        status="awaiting_verification",
        email_verified=0,
    )
    db.session.add(host)
    db.session.flush()  # assigns host.id before commit, needed for FKs below

    profile = HostProfile(
        host_id=host.id,
        full_name=data["full_name"],
        phone=data["phone"],
    )
    db.session.add(profile)

    db.session.add_all([
        HostKycDocument(
            host_id=host.id,
            document_type="id_card",
            document_url=id_document_url,
            status="pending",
        ),
        HostKycDocument(
            host_id=host.id,
            document_type="selfie_with_id",
            document_url=selfie_document_url,
            status="pending",
        ),
    ])

    db.session.commit()

    create_and_send_otp(host.email, purpose="email_verification")

    return host


# ─── OTP ────────────────────────────────────────────────────────────

def create_and_send_otp(email: str, purpose: str) -> OtpVerification:
    """
    Issues a new OTP row and emails the code to the host.
    Used for email_verification, password_reset, and withdrawal_confirm.
    """
    otp = OtpVerification(
        email=email,
        otp_code=generate_otp_code(),
        purpose=purpose,
        expires_at=get_otp_expiry(),
    )
    db.session.add(otp)
    db.session.commit()

    _send_otp_email(email, otp.otp_code, purpose)
    return otp


def verify_otp(email: str, code: str, purpose: str) -> OtpVerification:
    """
    Validates the most recent unverified OTP for (email, purpose).
    On success for purpose=email_verification, also flips
    Host.email_verified to 1.
    """
    otp = (
        OtpVerification.query.filter_by(email=email, purpose=purpose, verified_at=None)
        .order_by(OtpVerification.created_at.desc())
        .first()
    )

    if otp is None:
        raise AuthError("No pending verification code found. Please request a new one.")

    if otp.expires_at < datetime.utcnow():
        raise AuthError("This code has expired. Please request a new one.")

    if otp.otp_code != code:
        raise AuthError("Incorrect code. Please try again.")

    otp.verified_at = datetime.utcnow()

    if purpose == "email_verification":
        host = Host.query.filter_by(email=email).first()
        if host:
            host.email_verified = 1

    db.session.commit()
    return otp


def _send_otp_email(email: str, code: str, purpose: str) -> None:
    subjects = {
        "email_verification": "Verify your TiraNa email",
        "password_reset": "Reset your TiraNa password",
        "withdrawal_confirm": "Confirm your TiraNa withdrawal",
    }
    headings = {
        "email_verification": "Confirm your email",
        "password_reset": "Reset your password",
        "withdrawal_confirm": "Confirm your withdrawal",
    }
    intros = {
        "email_verification": "Use the code below to verify your email address and finish setting up your host account.",
        "password_reset": "Use the code below to reset your password. If you didn't request this, you can safely ignore this email.",
        "withdrawal_confirm": "Use the code below to confirm your withdrawal request.",
    }
    subject = subjects.get(purpose, "Your TiraNa verification code")
    heading = headings.get(purpose, "Your verification code")
    intro = intros.get(purpose, "Use the code below to continue.")
    expiry_minutes = current_app.config.get("OTP_EXPIRY_MINUTES", 10)

    text_body = (
        f"{heading}\n\n"
        f"{intro}\n\n"
        f"Your verification code is {code}. It expires in {expiry_minutes} minutes.\n\n"
        f"If you didn't request this, you can safely ignore this email.\n\n"
        f"— TiraNa Trust & Safety Team"
    )

    html_body = f"""\
<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background-color:#F7F4EF; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F4EF; padding:40px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="background-color:#1C3A2F; padding:28px 32px;">
                <span style="color:#F7F4EF; font-size:20px; font-weight:700; letter-spacing:0.2px;">TiraNa</span>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 12px 32px;">
                <h1 style="margin:0 0 12px 0; color:#1C3A2F; font-size:22px; font-weight:700;">{heading}</h1>
                <p style="margin:0 0 24px 0; color:#4B5563; font-size:15px; line-height:1.6;">{intro}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px;">
                <div style="background-color:#F7F4EF; border-radius:10px; padding:24px; text-align:center;">
                  <span style="font-size:32px; font-weight:700; letter-spacing:8px; color:#1C3A2F;">{code}</span>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 36px 32px;">
                <p style="margin:0; color:#6B7280; font-size:13px; line-height:1.6;">
                  This code expires in {expiry_minutes} minutes. If you didn't request this, you can safely ignore this email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#F7F4EF; padding:20px 32px; text-align:center;">
                <p style="margin:0; color:#9CA3AF; font-size:12px;">— TiraNa Trust &amp; Safety Team</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>"""

    msg = Message(
        subject=subject,
        recipients=[email],
        body=text_body,
        html=html_body,
    )

    try:
        mail.send(msg)
    except Exception as exc:
        current_app.logger.error("Failed to send OTP email to %s: %s", email, exc)
        raise AuthError(
            "We couldn't send the verification email. Please try again in a moment.",
            status=502,
        ) from exc


# ─── Login ───────────────────────────────────────────────────────────

def authenticate_host(email: str, password: str) -> Host:
    """
    Verifies credentials. Raises AuthError(401) for bad credentials
    and AuthError(403) for suspended accounts.

    Note: hosts with status='awaiting_verification' are still allowed
    to authenticate — the frontend uses `host.status` from the login
    response to show a "pending admin review" banner (see flow.md
    Section 1.2).
    """
    host = Host.query.filter_by(email=email).first()

    if host is None or not bcrypt.check_password_hash(host.password_hash, password):
        raise AuthError("Invalid email or password.", status=401)

    if host.status == "suspended":
        raise AuthError("Your account has been suspended. Contact support.", status=403)

    return host


# ─── Password reset ─────────────────────────────────────────────────

def reset_password(email: str, new_password: str) -> Host:
    host = Host.query.filter_by(email=email).first()
    if host is None:
        raise AuthError("Account not found.", status=404)

    host.password_hash = bcrypt.generate_password_hash(new_password).decode("utf-8")
    db.session.commit()
    return host
