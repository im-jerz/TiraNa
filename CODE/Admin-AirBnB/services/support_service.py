from datetime import datetime, timezone

from sqlalchemy.orm import Session
from sqlalchemy import desc

from models.support_ticket import SupportTicket
from models.ticket_message import TicketMessage


def create_ticket(db: Session, guest_id: str, subject: str, description: str, priority: str = "medium") -> SupportTicket:
    ticket = SupportTicket(
        guest_id=guest_id,
        subject=subject,
        description=description,
        priority=priority,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


def get_tickets(db: Session, status: str = "", assigned_to: str = "", page: int = 1, per_page: int = 20) -> dict:
    query = db.query(SupportTicket)
    if status:
        query = query.filter(SupportTicket.status == status)
    if assigned_to:
        query = query.filter(SupportTicket.assigned_to == assigned_to)
    total = query.count()
    tickets = query.order_by(desc(SupportTicket.created_at)).offset((page - 1) * per_page).limit(per_page).all()
    return {"tickets": tickets, "total": total, "page": page, "per_page": per_page}


def get_ticket(db: Session, ticket_id: str) -> SupportTicket | None:
    return db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()


def assign_ticket(db: Session, ticket_id: str, admin_id: str) -> SupportTicket | None:
    ticket = get_ticket(db, ticket_id)
    if ticket:
        ticket.assigned_to = admin_id
        if ticket.status == "open":
            ticket.status = "in_progress"
        db.commit()
        db.refresh(ticket)
    return ticket


def resolve_ticket(db: Session, ticket_id: str) -> SupportTicket | None:
    ticket = get_ticket(db, ticket_id)
    if ticket:
        ticket.status = "resolved"
        ticket.resolved_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(ticket)
    return ticket


def add_message(db: Session, ticket_id: str, sender: str, message: str) -> TicketMessage:
    msg = TicketMessage(ticket_id=ticket_id, sender=sender, message=message)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def get_messages(db: Session, ticket_id: str) -> list[TicketMessage]:
    return db.query(TicketMessage).filter(TicketMessage.ticket_id == ticket_id).order_by(TicketMessage.created_at).all()


def get_ticket_count(db: Session, status: str = "") -> int:
    query = db.query(SupportTicket)
    if status:
        query = query.filter(SupportTicket.status == status)
    return query.count()
