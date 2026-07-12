import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..config import get_settings

settings = get_settings()

def send_otp_email(email: str, code: str, purpose: str = "verification"):
    msg = MIMEMultipart("alternative")
    msg["From"] = settings.SMTP_FROM
    msg["To"] = email
    
    if purpose == "login":
        msg["Subject"] = "TiraNa - Admin Login OTP"
        title = "Admin Login"
        description = "Use the code below to complete your login:"
    elif purpose == "admin_invite":
        msg["Subject"] = "TiraNa - Admin Invitation"
        title = "Admin Invitation"
        description = "You have been invited to join TiraNa Admin Panel. Use the code below to set your password:"
    elif purpose == "password_reset":
        msg["Subject"] = "TiraNa - Password Reset OTP"
        title = "Password Reset"
        description = "Use the code below to reset your password:"
    else:
        msg["Subject"] = "TiraNa - Email Verification Code"
        title = "Email Verification"
        description = "Use the code below to verify your email address:"

    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #CB2957, #9e1a40); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">TiraNa Admin</h1>
            </div>
            <div style="padding: 30px; text-align: center;">
                <h2 style="color: #333; margin-bottom: 10px;">{title}</h2>
                <p style="color: #666; font-size: 14px;">{description}</p>
                <div style="margin: 25px 0; padding: 15px; background: #f0f4ff; border-radius: 8px; border: 2px dashed #CB2957;">
                    <span style="font-size: 36px; font-weight: bold; color: #CB2957; letter-spacing: 8px;">{code}</span>
                </div>
                <p style="color: #999; font-size: 12px;">This code expires in 5 minutes. Do not share this code with anyone.</p>
            </div>
            <div style="background: #f9fafb; padding: 15px; text-align: center; border-top: 1px solid #eee;">
                <p style="color: #aaa; font-size: 11px; margin: 0;">TiraNa Admin System &copy; 2026</p>
            </div>
        </div>
    </body>
    </html>
    """

    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.sendmail(settings.SMTP_FROM, email, msg.as_string())
    except Exception as e:
        print(f"[DEV MODE] Email send failed: {e}")
        print(f"[DEV MODE] OTP for {email}: {code}")
