from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import httpx

from ..database import get_db
from ..models import AdminAccount, Withdrawal
from ..middleware.admin_auth import get_current_admin
from ..config import get_settings

router = APIRouter(prefix="/admin/withdrawals", tags=["Admin Withdrawals"])
settings = get_settings()


@router.get("/")
async def list_withdrawals(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    """List all withdrawal requests."""
    query = db.query(Withdrawal)

    if status:
        query = query.filter(Withdrawal.status == status)

    query = query.order_by(Withdrawal.created_at.desc())

    total = query.count()
    withdrawals = query.offset(skip).limit(limit).all()

    return withdrawals


@router.get("/count")
async def count_withdrawals(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    """Count withdrawal requests."""
    query = db.query(Withdrawal)

    if status:
        query = query.filter(Withdrawal.status == status)

    count = query.count()
    return {"count": count}


@router.post("/{withdrawal_id}/approve")
async def approve_withdrawal(
    withdrawal_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    """Approve a withdrawal — deducts from host's wallet in Client-TiraNa."""
    withdrawal = db.query(Withdrawal).filter(Withdrawal.id == withdrawal_id).first()

    if not withdrawal:
        raise HTTPException(status_code=404, detail="Withdrawal not found")

    if withdrawal.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot approve withdrawal with status: {withdrawal.status}"
        )

    withdrawal.status = "approved"
    withdrawal.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(withdrawal)

    # Deduct from host's wallet in Client-TiraNa (only completed bookings)
    try:
        deduct_resp = httpx.post(
            f"{settings.CLIENT_API_BASE_URL}/api/host/wallet/deduct",
            json={
                "host_id": withdrawal.host_id,
                "amount": float(withdrawal.amount),
            },
            timeout=15,
        )
        print(f"Deduct response: {deduct_resp.status_code} {deduct_resp.text}")
    except Exception as e:
        print(f"Warning: wallet deduct failed for host {withdrawal.host_id}: {e}")

    return {"message": f"Withdrawal {withdrawal_id} approved", "data": {
        "id": withdrawal.id,
        "status": withdrawal.status,
        "amount": float(withdrawal.amount),
    }}


@router.post("/{withdrawal_id}/reject")
async def reject_withdrawal(
    withdrawal_id: int,
    reason: str = "",
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    """Reject a withdrawal request."""
    withdrawal = db.query(Withdrawal).filter(Withdrawal.id == withdrawal_id).first()

    if not withdrawal:
        raise HTTPException(status_code=404, detail="Withdrawal not found")

    if withdrawal.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot reject withdrawal with status: {withdrawal.status}"
        )

    withdrawal.status = "rejected"
    withdrawal.rejection_reason = reason or "No reason provided"
    withdrawal.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(withdrawal)

    return {"message": f"Withdrawal {withdrawal_id} rejected", "data": {
        "id": withdrawal.id,
        "status": withdrawal.status,
    }}
