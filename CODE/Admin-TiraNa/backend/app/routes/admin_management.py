from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import bcrypt
import random
import string
from datetime import datetime, timedelta
from ..database import get_db
from ..models import AdminAccount, AdminAuditLog, OTPVerification
from ..schemas import AdminResponse, AdminCreateRequest, AdminUpdateRequest, AdminInviteRequest
from ..middleware.admin_auth import get_current_admin
from ..services.email import send_otp_email

router = APIRouter(prefix="/admin/management", tags=["Admin Management"])


@router.get("/", response_model=List[AdminResponse])
def list_admins(
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    return db.query(AdminAccount).order_by(AdminAccount.created_at).all()


@router.get("/count")
def count_admins(db: Session = Depends(get_db), current_admin: AdminAccount = Depends(get_current_admin)):
    return {"total": db.query(AdminAccount).count()}


@router.get("/{admin_id}", response_model=AdminResponse)
def get_admin(
    admin_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    admin = db.query(AdminAccount).filter(AdminAccount.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    return admin


@router.post("/", response_model=AdminResponse, status_code=201)
def create_admin(
    body: AdminCreateRequest,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    existing = db.query(AdminAccount).filter(
        (AdminAccount.username == body.username) | (AdminAccount.email == body.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    hashed = bcrypt.hashpw(body.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    admin = AdminAccount(username=body.username, email=body.email, password_hash=hashed)
    db.add(admin)
    db.add(AdminAuditLog(
        admin_id=current_admin.id, admin_username=current_admin.username,
        action="CREATE_ADMIN", details=f"Created admin {body.username}",
    ))
    db.commit()
    db.refresh(admin)
    return admin


@router.put("/{admin_id}", response_model=AdminResponse)
def update_admin(
    admin_id: int,
    body: AdminUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    admin = db.query(AdminAccount).filter(AdminAccount.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    if admin.id == current_admin.id and body.is_active is False:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")
    if body.email is not None:
        admin.email = body.email
    if body.is_active is not None:
        admin.is_active = body.is_active
    db.add(AdminAuditLog(
        admin_id=current_admin.id, admin_username=current_admin.username,
        action="UPDATE_ADMIN", details=f"Updated admin {admin.username}",
    ))
    db.commit()
    db.refresh(admin)
    return admin


@router.post("/invite", status_code=201)
def invite_admin(
    body: AdminInviteRequest,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    existing = db.query(AdminAccount).filter(
        (AdminAccount.username == body.username) | (AdminAccount.email == body.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    admin = AdminAccount(
        username=body.username,
        email=body.email,
        is_active=False,
        password_changed=False,
    )
    db.add(admin)

    otp_code = "".join(random.choices(string.digits, k=6))
    otp_entry = OTPVerification(
        email=body.email,
        code=otp_code,
        purpose="admin_invite",
        expires_at=datetime.utcnow() + timedelta(hours=24),
    )
    db.add(otp_entry)

    try:
        send_otp_email(body.email, otp_code, purpose="admin_invite")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to send invitation email")

    db.add(AdminAuditLog(
        admin_id=current_admin.id, admin_username=current_admin.username,
        action="INVITE_ADMIN", details=f"Invited admin {body.username} ({body.email})",
    ))
    db.commit()
    return {"message": "Invitation sent successfully"}


@router.delete("/{admin_id}")
def delete_admin(
    admin_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    admin = db.query(AdminAccount).filter(AdminAccount.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    if admin.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    db.add(AdminAuditLog(
        admin_id=current_admin.id, admin_username=current_admin.username,
        action="DELETE_ADMIN", details=f"Deleted admin {admin.username} (ID: {admin.id})",
    ))
    db.delete(admin)
    db.commit()
    return {"message": "Admin deleted successfully"}
