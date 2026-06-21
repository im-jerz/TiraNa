from sqlalchemy.orm import Session
from sqlalchemy import desc

from models.audit_log import AuditLog


def log_action(db: Session, admin_id: str, action: str, target_type: str, target_id: str, details: str = "") -> AuditLog:
    entry = AuditLog(
        admin_id=admin_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=details or None,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_audit_logs(db: Session, admin_id: str = "", target_type: str = "", page: int = 1, per_page: int = 20) -> dict:
    query = db.query(AuditLog)
    if admin_id:
        query = query.filter(AuditLog.admin_id == admin_id)
    if target_type:
        query = query.filter(AuditLog.target_type == target_type)
    total = query.count()
    logs = query.order_by(desc(AuditLog.created_at)).offset((page - 1) * per_page).limit(per_page).all()
    return {"logs": logs, "total": total, "page": page, "per_page": per_page}
