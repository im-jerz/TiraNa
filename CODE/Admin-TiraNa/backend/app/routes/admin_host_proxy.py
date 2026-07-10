"""
Admin Host Proxy routes.
Proxies requests to Host-TiraNa API for rooms, bookings, reviews, etc.
"""

from fastapi import APIRouter, Depends, Query
from ..models import AdminAccount
from ..schemas import RoomResponse, BookingResponse, PaymentResponse, ReviewResponse, WithdrawalResponse, VerificationResponse
from ..middleware.admin_auth import get_current_admin
from ..services.host_api_client import host_api_client
from ..services.client_api_client import client_api_client
from ..config import get_settings

settings = get_settings()
router = APIRouter(prefix="/admin/host", tags=["Admin Host Proxy"])


# ─── Rooms ─────────────────────────────────────────────────

@router.get("/rooms", response_model=list[RoomResponse])
async def get_host_rooms(
    status: str = Query("", description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Get list of rooms from Host API."""
    rooms = await host_api_client.get_rooms(status=status, skip=skip, limit=limit)
    return rooms


@router.post("/rooms/{room_id}/hide")
async def hide_host_room(
    room_id: int,
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Hide a room via Host API."""
    success = await host_api_client.hide_room(room_id)
    return {"message": "Room hidden successfully" if success else "Failed to hide room"}


@router.post("/rooms/{room_id}/show")
async def show_host_room(
    room_id: int,
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Show a hidden room via Host API."""
    success = await host_api_client.show_room(room_id)
    return {"message": "Room shown successfully" if success else "Failed to show room"}


# ─── Bookings ──────────────────────────────────────────────

@router.get("/bookings", response_model=list[BookingResponse])
async def get_host_bookings(
    status: str = Query("", description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Get list of bookings from Host API."""
    bookings = await host_api_client.get_bookings(status=status, skip=skip, limit=limit)
    return bookings


@router.get("/bookings/{booking_id}")
async def get_host_booking(
    booking_id: int,
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Get single booking detail from Host API."""
    booking = await host_api_client.get_booking(booking_id)
    return {"booking": booking}


@router.get("/bookings/{booking_id}/timeline")
async def get_host_booking_timeline(
    booking_id: int,
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Get booking status timeline from Host API."""
    timeline = await host_api_client.get_booking_timeline(booking_id)
    return {"timeline": timeline}


# ─── Stats ─────────────────────────────────────────────────

@router.get("/stats")
async def get_host_stats(
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Get dashboard statistics from Host API."""
    stats = await host_api_client.get_stats()
    return stats


@router.get("/stats/revenue")
async def get_host_revenue_stats(
    period: str = Query("monthly", description="Time period"),
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Get revenue statistics from Host API."""
    stats = await host_api_client.get_revenue_stats(period)
    return stats


@router.get("/stats/bookings")
async def get_host_booking_stats(
    period: str = Query("monthly", description="Time period"),
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Get booking statistics from Host API."""
    stats = await host_api_client.get_booking_stats(period)
    return stats


# ─── Payments ──────────────────────────────────────────────

@router.get("/payments", response_model=list[PaymentResponse])
async def get_host_payments(
    status: str = Query("", description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Get list of payments from Host API."""
    payments = await host_api_client.get_payments(status=status, skip=skip, limit=limit)
    return payments


# ─── Reviews ───────────────────────────────────────────────

@router.get("/reviews", response_model=list[ReviewResponse])
async def get_host_reviews(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Get list of reviews from Host API."""
    reviews = await host_api_client.get_reviews(skip=skip, limit=limit)
    return reviews


@router.post("/reviews/{review_id}/hide")
async def hide_host_review(
    review_id: int,
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Hide a review via Host API."""
    success = await host_api_client.hide_review(review_id)
    return {"message": "Review hidden successfully" if success else "Failed to hide review"}


@router.post("/reviews/{review_id}/show")
async def show_host_review(
    review_id: int,
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Show a hidden review via Host API."""
    success = await host_api_client.show_review(review_id)
    return {"message": "Review shown successfully" if success else "Failed to show review"}


# ─── Withdrawals ───────────────────────────────────────────

@router.get("/withdrawals", response_model=list[WithdrawalResponse])
async def get_host_withdrawals(
    status: str = Query("", description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Get list of withdrawal requests from Host API."""
    withdrawals = await host_api_client.get_withdrawals(status=status, skip=skip, limit=limit)
    return withdrawals


@router.post("/withdrawals/{withdrawal_id}/approve")
async def approve_host_withdrawal(
    withdrawal_id: int,
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Approve a withdrawal request via Host API."""
    success = await host_api_client.approve_withdrawal(withdrawal_id)
    return {"message": "Withdrawal approved" if success else "Failed to approve withdrawal"}


@router.post("/withdrawals/{withdrawal_id}/reject")
async def reject_host_withdrawal(
    withdrawal_id: int,
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Reject a withdrawal request via Host API."""
    success = await host_api_client.reject_withdrawal(withdrawal_id)
    return {"message": "Withdrawal rejected" if success else "Failed to reject withdrawal"}


# ─── Verifications ─────────────────────────────────────────

@router.get("/verifications", response_model=list[VerificationResponse])
async def get_host_verifications(
    status: str = Query("", description="Filter by status"),
    type: str = Query("", description="Filter by type (host/guest)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Get unified list of verification requests from Host and Client backends."""

    host_verifications = []
    client_verifications = []

    if not type or type == "host":
        host_verifications = await host_api_client.get_verifications(
            status=status, skip=skip, limit=limit
        )
        host_base = "http://localhost:5001"
        for v in host_verifications:
            v["id"] = str(v["id"])
            v["type"] = "host"
            if v.get("id_url") and v["id_url"].startswith("/uploads/"):
                v["id_url"] = f"{host_base}{v['id_url']}"
            if v.get("selfie_url") and v["selfie_url"].startswith("/uploads/"):
                v["selfie_url"] = f"{host_base}{v['selfie_url']}"

    if not type or type == "guest":
        client_status = ""
        if status == "pending":
            client_status = "pending"
        elif status == "approved":
            client_status = "approved"
        elif status == "rejected":
            client_status = "rejected"
        client_verifications = await client_api_client.get_verifications(
            status=client_status, skip=skip, limit=limit
        )
        client_base = f"http://localhost:5000"
        for v in client_verifications:
            v["type"] = "guest"
            if v.get("id_url") and v["id_url"].startswith("/uploads/"):
                v["id_url"] = f"{client_base}{v['id_url']}"
            if v.get("id_back_url") and v["id_back_url"].startswith("/uploads/"):
                v["id_back_url"] = f"{client_base}{v['id_back_url']}"

    merged = host_verifications + client_verifications
    merged.sort(key=lambda v: v.get("created_at") or "", reverse=True)
    return merged


@router.post("/verifications/{verification_id}/approve")
async def approve_host_verification(
    verification_id: str,
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Approve a verification request via Host API."""
    success = await host_api_client.approve_verification(int(verification_id))
    return {"message": "Verification approved" if success else "Failed to approve verification"}


@router.post("/verifications/{verification_id}/reject")
async def reject_host_verification(
    verification_id: str,
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Reject a verification request via Host API."""
    success = await host_api_client.reject_verification(int(verification_id))
    return {"message": "Verification rejected" if success else "Failed to reject verification"}


# ─── Client Verifications ─────────────────────────────────────

@router.post("/client/verifications/{verification_id}/approve")
async def approve_client_verification(
    verification_id: str,
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Approve a client verification request via Client API."""
    success = await client_api_client.approve_verification(verification_id)
    return {"message": "Verification approved" if success else "Failed to approve verification"}


@router.post("/client/verifications/{verification_id}/reject")
async def reject_client_verification(
    verification_id: str,
    reason: str = "",
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Reject a client verification request via Client API."""
    success = await client_api_client.reject_verification(verification_id, reason)
    return {"message": "Verification rejected" if success else "Failed to reject verification"}
