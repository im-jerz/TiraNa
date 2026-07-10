from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import Dispute, AdminAccount, AdminAuditLog
from ..schemas import DisputeResponse, DisputeCreateRequest, DisputeUpdateRequest
from ..middleware.admin_auth import get_current_admin

router = APIRouter(prefix="/admin/disputes", tags=["Admin Disputes"])


@router.get("/", response_model=List[DisputeResponse])
def list_disputes(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status: Optional[str] = "",
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    query = db.query(Dispute)
    if status:
        query = query.filter(Dispute.status == status)
    return query.order_by(Dispute.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/count")
def count_disputes(
    status: Optional[str] = "",
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    query = db.query(Dispute)
    if status:
        query = query.filter(Dispute.status == status)
    return {"total": query.count()}


@router.get("/{dispute_id}", response_model=DisputeResponse)
def get_dispute(
    dispute_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
    return dispute


@router.post("/", response_model=DisputeResponse, status_code=201)
def create_dispute(
    body: DisputeCreateRequest,
    db: Session = Depends(get_db),
):
    dispute = Dispute(**body.model_dump())
    db.add(dispute)
    db.commit()
    db.refresh(dispute)
    return dispute


@router.put("/{dispute_id}", response_model=DisputeResponse)
def update_dispute(
    dispute_id: int,
    body: DisputeUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(dispute, field, value)
    db.add(AdminAuditLog(
        admin_id=current_admin.id, admin_username=current_admin.username,
        action="UPDATE_DISPUTE", details=f"Updated dispute {dispute.id}: {', '.join(update_data.keys())}",
    ))
    db.commit()
    db.refresh(dispute)
    return dispute
