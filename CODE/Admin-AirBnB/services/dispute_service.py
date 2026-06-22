from datetime import datetime, timezone

from sqlalchemy.orm import Session
from sqlalchemy import desc

from models.dispute import Dispute, DisputeMessage


def create_dispute(
    db: Session,
    booking_id: str,
    guest_id: str,
    host_id: str,
    reason: str,
) -> Dispute:
    dispute = Dispute(
        booking_id=booking_id,
        guest_id=guest_id,
        host_id=host_id,
        reason=reason,
    )
    db.add(dispute)
    db.commit()
    db.refresh(dispute)
    return dispute


def get_disputes(
    db: Session,
    status: str = "",
    assigned_to: str = "",
    page: int = 1,
    per_page: int = 20,
) -> dict:
    query = db.query(Dispute)
    if status:
        query = query.filter(Dispute.status == status)
    if assigned_to:
        query = query.filter(Dispute.assigned_to == assigned_to)
    total = query.count()
    disputes = query.order_by(desc(Dispute.created_at)).offset((page - 1) * per_page).limit(per_page).all()
    return {"disputes": disputes, "total": total, "page": page, "per_page": per_page}


def get_dispute(db: Session, dispute_id: str) -> Dispute | None:
    return db.query(Dispute).filter(Dispute.id == dispute_id).first()


def assign_dispute(db: Session, dispute_id: str, admin_id: str) -> Dispute | None:
    dispute = get_dispute(db, dispute_id)
    if dispute:
        dispute.assigned_to = admin_id
        if dispute.status == "open":
            dispute.status = "investigating"
        db.commit()
        db.refresh(dispute)
    return dispute


def investigate_dispute(db: Session, dispute_id: str) -> Dispute | None:
    dispute = get_dispute(db, dispute_id)
    if dispute:
        dispute.status = "investigating"
        db.commit()
        db.refresh(dispute)
    return dispute


def resolve_dispute(db: Session, dispute_id: str, resolution: str) -> Dispute | None:
    dispute = get_dispute(db, dispute_id)
    if dispute:
        dispute.status = "resolved"
        dispute.resolution = resolution
        dispute.resolved_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(dispute)
    return dispute


def dismiss_dispute(db: Session, dispute_id: str, reason: str) -> Dispute | None:
    dispute = get_dispute(db, dispute_id)
    if dispute:
        dispute.status = "dismissed"
        dispute.resolution = reason
        dispute.resolved_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(dispute)
    return dispute


def add_message(db: Session, dispute_id: str, sender: str, message: str) -> DisputeMessage:
    msg = DisputeMessage(dispute_id=dispute_id, sender=sender, message=message)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def get_messages(db: Session, dispute_id: str) -> list[DisputeMessage]:
    return db.query(DisputeMessage).filter(DisputeMessage.dispute_id == dispute_id).order_by(DisputeMessage.created_at).all()


def get_dispute_count(db: Session, status: str = "") -> int:
    query = db.query(Dispute)
    if status:
        query = query.filter(Dispute.status == status)
    return query.count()
