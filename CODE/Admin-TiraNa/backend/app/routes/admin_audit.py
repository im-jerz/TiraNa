from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..models import AdminAuditLog, AdminAccount
from ..schemas import AdminAuditLogResponse
from ..middleware.admin_auth import get_current_admin

router = APIRouter(prefix="/admin/audit", tags=["Admin Audit Log"])


@router.get("/", response_model=list[AdminAuditLogResponse])
def list_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    action: Optional[str] = "",
    admin_username: Optional[str] = "",
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    query = db.query(AdminAuditLog)
    if action:
        query = query.filter(AdminAuditLog.action == action)
    if admin_username:
        query = query.filter(AdminAuditLog.admin_username.ilike(f"%{admin_username}%"))
    return query.order_by(AdminAuditLog.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/count")
def count_audit_logs(
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    return {"total": db.query(AdminAuditLog).count()}
