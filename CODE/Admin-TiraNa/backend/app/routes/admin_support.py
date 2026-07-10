from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import SupportTicket, AdminAccount, AdminAuditLog
from ..schemas import TicketResponse, TicketCreateRequest, TicketUpdateRequest
from ..middleware.admin_auth import get_current_admin

router = APIRouter(prefix="/admin/support", tags=["Admin Support"])


@router.get("/", response_model=List[TicketResponse])
def list_tickets(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status: Optional[str] = "",
    priority: Optional[str] = "",
    category: Optional[str] = "",
    search: Optional[str] = "",
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    query = db.query(SupportTicket)
    if status:
        query = query.filter(SupportTicket.status == status)
    if priority:
        query = query.filter(SupportTicket.priority == priority)
    if category:
        query = query.filter(SupportTicket.category == category)
    if search:
        query = query.filter(
            SupportTicket.subject.ilike(f"%{search}%") |
            SupportTicket.requester_name.ilike(f"%{search}%") |
            SupportTicket.requester_email.ilike(f"%{search}%")
        )
    return query.order_by(SupportTicket.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/count")
def count_tickets(
    status: Optional[str] = "",
    priority: Optional[str] = "",
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    query = db.query(SupportTicket)
    if status:
        query = query.filter(SupportTicket.status == status)
    if priority:
        query = query.filter(SupportTicket.priority == priority)
    return {"total": query.count()}


@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.post("/", response_model=TicketResponse, status_code=201)
def create_ticket(
    body: TicketCreateRequest,
    db: Session = Depends(get_db),
):
    ticket = SupportTicket(**body.model_dump())
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.put("/{ticket_id}", response_model=TicketResponse)
def update_ticket(
    ticket_id: int,
    body: TicketUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(ticket, field, value)
    db.add(AdminAuditLog(
        admin_id=current_admin.id, admin_username=current_admin.username,
        action="UPDATE_TICKET", details=f"Updated ticket {ticket.id}: {', '.join(update_data.keys())}",
    ))
    db.commit()
    db.refresh(ticket)
    return ticket
