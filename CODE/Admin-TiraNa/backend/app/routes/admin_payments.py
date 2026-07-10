from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List
from ..models import AdminAccount
from ..schemas import PaymentResponse
from ..middleware.admin_auth import get_current_admin
from ..services.client_api_client import client_api_client

router = APIRouter(prefix="/admin/payments", tags=["Admin Payments"])


@router.get("/", response_model=List[PaymentResponse])
async def list_payments(
    status: str = Query("", description="Filter by status"),
    search: str = Query("", description="Search by payer name/email/payment ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Get list of all platform payments from Client API."""
    payments = await client_api_client.get_payments(
        status=status, search=search, skip=skip, limit=limit
    )
    return payments


@router.get("/count")
async def get_payment_count(
    status: str = Query("", description="Filter by status"),
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Get count of all platform payments from Client API."""
    count = await client_api_client.get_payment_count(status=status)
    return {"count": count}


@router.get("/revenue")
async def get_revenue_stats(
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Get revenue statistics from Client API."""
    stats = await client_api_client.get_revenue_stats()
    return stats


@router.post("/{payment_id}/refund")
async def refund_payment(
    payment_id: str,
    amount: float,
    reason: str,
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Process a refund for a payment via Client API."""
    success = await client_api_client.refund_payment(payment_id, amount, reason)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to process refund")
    return {
        "message": f"Refund of ₱{amount} for payment {payment_id} processed successfully",
        "payment_id": payment_id,
        "amount": amount,
        "reason": reason,
        "status": "refunded"
    }