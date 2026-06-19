import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from config import Config


def send_otp_email(email: str, code: str, purpose: str) -> bool:
    subjects = {
        "signup_verify": "Verify your admin account",
        "signin_verify": "Sign in verification",
    }
    bodies = {
        "signup_verify": f"Your verification code is: {code}\n\nThis code expires in {Config.OTP_EXPIRY_MINUTES} minutes.",
        "signin_verify": f"Your sign in code is: {code}\n\nThis code expires in {Config.OTP_EXPIRY_MINUTES} minutes.",
    }

    msg = MIMEMultipart()
    msg["From"] = Config.SMTP_FROM
    msg["To"] = email
    msg["Subject"] = subjects.get(purpose, "Verification Code")
    msg.attach(MIMEText(bodies.get(purpose, f"Your code is: {code}"), "plain"))

    try:
        with smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT) as server:
            server.starttls()
            server.login(Config.SMTP_USER, Config.SMTP_PASS)
            server.sendmail(Config.SMTP_FROM, email, msg.as_string())
        return True
    except Exception:
        return False
