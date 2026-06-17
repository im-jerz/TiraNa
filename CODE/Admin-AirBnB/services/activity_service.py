from sqlalchemy.orm import Session
from sqlalchemy import desc

from models.activity_log import ActivityLog


def log_activity(db: Session, guest_id: str, action: str, details: str = "", ip_address: str = "") -> ActivityLog:
    entry = ActivityLog(
        guest_id=guest_id,
        action=action,
        details=details or None,
        ip_address=ip_address or None,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_activities(db: Session, guest_id: str, page: int = 1, per_page: int = 20) -> dict:
    query = db.query(ActivityLog).filter(ActivityLog.guest_id == guest_id)
    total = query.count()
    activities = query.order_by(desc(ActivityLog.created_at)).offset((page - 1) * per_page).limit(per_page).all()
    return {"activities": activities, "total": total, "page": page, "per_page": per_page}
