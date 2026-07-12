"""
Internal host-facing withdrawal API.

These endpoints are called by Host-TiraNa backend via HTTP.
Protected by INTERNAL_API_KEY header.
"""

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from ..database import get_db
from ..models import Withdrawal
from ..config import get_settings

router = APIRouter(prefix="/api/internal/withdrawals", tags=["Internal Withdrawals"])
settings = get_settings()


async def verify_internal_key(x_internal_api_key: str = Header(None)):
    if x_internal_api_key != settings.INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid internal API key")
    return True


@router.post("/")
async def create_withdrawal(
    host_id: int,
    host_name: str,
    host_email: str,
    amount: float,
    method: str,
    db: Session = Depends(get_db),
    _: bool = Depends(verify_internal_key),
):
    """Create a withdrawal request (called by Host-TiraNa)."""
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")
    if not method:
        raise HTTPException(status_code=400, detail="Method is required")

    withdrawal = Withdrawal(
        host_id=host_id,
        host_name=host_name,
        host_email=host_email,
        amount=amount,
        method=method,
        status="pending",
    )
    db.add(withdrawal)
    db.commit()
    db.refresh(withdrawal)

    return {
        "message": "Withdrawal request submitted successfully",
        "data": {
            "id": withdrawal.id,
            "status": withdrawal.status,
            "amount": float(withdrawal.amount),
        },
    }


@router.get("/")
async def list_host_withdrawals(
    host_id: int = Query(...),
    db: Session = Depends(get_db),
    _: bool = Depends(verify_internal_key),
):
    """List withdrawals for a specific host (called by Host-TiraNa)."""
    withdrawals = (
        db.query(Withdrawal)
        .filter(Withdrawal.host_id == host_id)
        .order_by(Withdrawal.created_at.desc())
        .all()
    )

    data = [
        {
            "id": w.id,
            "amount": float(w.amount),
            "method": w.method,
            "status": w.status,
            "reference_number": w.reference_number,
            "rejection_reason": w.rejection_reason,
            "created_at": w.created_at.isoformat() if w.created_at else None,
            "updated_at": w.updated_at.isoformat() if w.updated_at else None,
        }
        for w in withdrawals
    ]

    return {"data": data}
