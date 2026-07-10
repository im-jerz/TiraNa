import bcrypt
import random
import string
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import AdminAccount, AdminAuditLog, LoginAttempt, OTPVerification
from ..schemas import (
    AdminLoginRequest, AdminResponse, AdminTokenResponse, 
    VerifyOTPRequest, ChangePasswordRequest,
    AdminRegisterRequest, AdminRegisterVerifyRequest,
    AdminAcceptInviteRequest
)
from ..middleware.admin_auth import create_admin_token, get_current_admin, verify_temp_token
from ..services.email import send_otp_email

router = APIRouter(prefix="/admin/auth", tags=["Admin Auth"])

def generate_otp(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))

@router.post("/login", response_model=AdminTokenResponse)
def admin_login(request: AdminLoginRequest, fastapi_request: Request, db: Session = Depends(get_db)):
    # 1. Rate Limiting Check
    fifteen_minutes_ago = datetime.utcnow() - timedelta(minutes=15)
    failed_attempts = db.query(LoginAttempt).filter(
        LoginAttempt.email == request.username,
        LoginAttempt.success == False,
        LoginAttempt.attempted_at > fifteen_minutes_ago
    ).count()

    if failed_attempts >= 5:
        raise HTTPException(status_code=429, detail="Account locked. Try again in 15 min.")

    # 2. Authenticate Admin
    admin = db.query(AdminAccount).filter(
        (AdminAccount.username == request.username) | (AdminAccount.email == request.username)
    ).first()

    ip_address = fastapi_request.client.host if fastapi_request.client else None

    if not admin or not bcrypt.checkpw(request.password.encode("utf-8"), admin.password_hash.encode("utf-8")):
        # Log failed attempt
        attempt = LoginAttempt(email=request.username, success=False, ip_address=ip_address)
        db.add(attempt)
        db.commit()
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not admin.is_active:
        raise HTTPException(status_code=403, detail="Admin account is deactivated")

    # Clear failed attempts on success
    db.query(LoginAttempt).filter(LoginAttempt.email == request.username).delete()
    
    # 3. OTP Flow
    otp_code = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    otp_entry = OTPVerification(
        email=admin.email,
        code=otp_code,
        purpose="login",
        expires_at=expires_at
    )
    db.add(otp_entry)
    
    # Create temp token for OTP verification
    temp_token = create_admin_token(admin, purpose="otp_pending")
    
    try:
        send_otp_email(admin.email, otp_code, purpose="login")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to send OTP email")

    db.commit()

    return AdminTokenResponse(
        access_token="", 
        token_type="bearer", 
        requires_otp=True, 
        temp_token=temp_token,
        admin=AdminResponse.model_validate(admin),
    )

@router.post("/verify-otp", response_model=AdminTokenResponse)
def verify_otp(request: VerifyOTPRequest, db: Session = Depends(get_db)):
    # 1. Verify Temp Token
    admin_id = verify_temp_token(request.temp_token, request.email)
    
    # 2. Verify OTP Code
    otp_entry = db.query(OTPVerification).filter(
        OTPVerification.email == request.email,
        OTPVerification.code == request.code,
        OTPVerification.purpose == "login",
        OTPVerification.used == False,
        OTPVerification.expires_at > datetime.utcnow()
    ).first()

    if not otp_entry:
        raise HTTPException(status_code=401, detail="Invalid or expired OTP")

    # 3. Mark OTP as used
    otp_entry.used = True
    
    # 4. Get Admin and issue full token
    admin = db.query(AdminAccount).filter(AdminAccount.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    access_token = create_admin_token(admin, purpose="admin_access")

    log = AdminAuditLog(
        admin_id=admin.id, 
        admin_username=admin.username, 
        action="admin_login", 
        details="Admin logged in successfully via OTP"
    )
    db.add(log)
    db.commit()

    return AdminTokenResponse(access_token=access_token, token_type="bearer", admin=admin)

@router.put("/change-password")
def change_password(request: ChangePasswordRequest, current_admin: AdminAccount = Depends(get_current_admin), db: Session = Depends(get_db)):
    if not bcrypt.checkpw(request.current_password.encode("utf-8"), current_admin.password_hash.encode("utf-8")):
        raise HTTPException(status_code=401, detail="Invalid current password")
    
    hashed_password = bcrypt.hashpw(request.new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    current_admin.password_hash = hashed_password
    current_admin.password_changed = True
    
    log = AdminAuditLog(
        admin_id=current_admin.id, 
        admin_username=current_admin.username, 
        action="change_password", 
        details="Admin changed their password"
    )
    db.add(log)
    db.commit()
    
    return {"message": "Password updated successfully"}

@router.get("/me", response_model=AdminResponse)
def admin_me(current_admin: AdminAccount = Depends(get_current_admin)):
    return current_admin


@router.post("/register", status_code=201)
def register_admin(request: AdminRegisterRequest, db: Session = Depends(get_db)):
    if len(request.username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    existing = db.query(AdminAccount).filter(
        (AdminAccount.username == request.username) | (AdminAccount.email == request.email)
    ).first()
    if existing:
        if existing.username == request.username:
            raise HTTPException(status_code=400, detail="Username already taken")
        raise HTTPException(status_code=400, detail="Email already registered")

    otp_code = generate_otp()
    hashed = bcrypt.hashpw(request.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    admin = AdminAccount(
        username=request.username,
        email=request.email,
        password_hash=hashed,
        is_active=False,
        password_changed=False,
    )
    db.add(admin)

    otp_entry = OTPVerification(
        email=request.email,
        code=otp_code,
        purpose="registration",
        expires_at=datetime.utcnow() + timedelta(minutes=10),
    )
    db.add(otp_entry)

    try:
        send_otp_email(request.email, otp_code, purpose="verification")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to send verification email")

    db.commit()
    return {"message": "Verification code sent to your email", "email": request.email}


@router.post("/accept-invite")
def accept_invite(request: AdminAcceptInviteRequest, db: Session = Depends(get_db)):
    otp_entry = db.query(OTPVerification).filter(
        OTPVerification.email == request.email,
        OTPVerification.code == request.code,
        OTPVerification.purpose == "admin_invite",
        OTPVerification.used == False,
        OTPVerification.expires_at > datetime.utcnow(),
    ).first()

    if not otp_entry:
        raise HTTPException(status_code=401, detail="Invalid or expired invitation code")

    admin = db.query(AdminAccount).filter(AdminAccount.email == request.email).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin account not found")

    hashed_password = bcrypt.hashpw(request.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    admin.password_hash = hashed_password
    admin.is_active = True
    admin.password_changed = True
    otp_entry.used = True

    log = AdminAuditLog(
        admin_id=admin.id,
        admin_username=admin.username,
        action="admin_invite_accepted",
        details="Admin account activated via invitation",
    )
    db.add(log)
    db.commit()

    return {"message": "Invitation accepted successfully. You can now log in."}


@router.post("/register/verify")
def verify_register(request: AdminRegisterVerifyRequest, db: Session = Depends(get_db)):
    otp_entry = db.query(OTPVerification).filter(
        OTPVerification.email == request.email,
        OTPVerification.code == request.code,
        OTPVerification.purpose == "registration",
        OTPVerification.used == False,
        OTPVerification.expires_at > datetime.utcnow(),
    ).first()

    if not otp_entry:
        raise HTTPException(status_code=401, detail="Invalid or expired verification code")

    admin = db.query(AdminAccount).filter(AdminAccount.email == request.email).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin account not found")

    admin.is_active = True
    admin.password_changed = True
    otp_entry.used = True

    log = AdminAuditLog(
        admin_id=admin.id,
        admin_username=admin.username,
        action="admin_registered",
        details="Admin account created and verified via email",
    )
    db.add(log)
    db.commit()

    return {"message": "Admin account verified successfully. You can now log in."}
