from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from ..database import get_db
from ..middleware.admin_auth import get_current_admin
from ..models import AdminAccount
from ..services.host_api_client import HostAPIClient, get_host_api_client

router = APIRouter(prefix="/admin/host", tags=["Admin Host Sync"])

@router.get("/rooms")
async def get_rooms(
    status: Optional[str] = None,
    client: HostAPIClient = Depends(get_host_api_client),
    admin: AdminAccount = Depends(get_current_admin)
):
    return await client.get_rooms(status=status)

@router.get("/rooms/{room_id}")
async def get_room(
    room_id: str,
    client: HostAPIClient = Depends(get_host_api_client),
    admin: AdminAccount = Depends(get_current_admin)
):
    return await client.get_room(room_id)

@router.post("/rooms/{room_id}/hide")
async def hide_room(
    room_id: str,
    client: HostAPIClient = Depends(get_host_api_client),
    admin: AdminAccount = Depends(get_current_admin)
):
    return await client.hide_room(room_id)

@router.post("/rooms/{room_id}/show")
async def show_room(
    room_id: str,
    client: HostAPIClient = Depends(get_host_api_client),
    admin: AdminAccount = Depends(get_current_admin)
):
    return await client.show_room(room_id)

@router.get("/hosts/{external_id}")
async def get_host(
    external_id: str,
    client: HostAPIClient = Depends(get_host_api_client),
    admin: AdminAccount = Depends(get_current_admin)
):
    return await client.get_host(external_id)

@router.get("/hosts/{external_id}/wallet")
async def get_host_wallet(
    external_id: str,
    client: HostAPIClient = Depends(get_host_api_client),
    admin: AdminAccount = Depends(get_current_admin)
):
    return await client.get_host_wallet(external_id)

@router.get("/guests/{external_id}")
async def get_guest(
    external_id: str,
    client: HostAPIClient = Depends(get_host_api_client),
    admin: AdminAccount = Depends(get_current_admin)
):
    return await client.get_guest(external_id)

@router.get("/bookings")
async def get_bookings(
    status: Optional[str] = None,
    page: int = 1,
    client: HostAPIClient = Depends(get_host_api_client),
    admin: AdminAccount = Depends(get_current_admin)
):
    return await client.get_bookings(status=status, page=page)

@router.get("/bookings/{booking_id}")
async def get_booking(
    booking_id: str,
    client: HostAPIClient = Depends(get_host_api_client),
    admin: AdminAccount = Depends(get_current_admin)
):
    return await client.get_booking(booking_id)

@router.get("/bookings/{booking_id}/timeline")
async def get_booking_timeline(
    booking_id: str,
    client: HostAPIClient = Depends(get_host_api_client),
    admin: AdminAccount = Depends(get_current_admin)
):
    return await client.get_booking_timeline(booking_id)

@router.get("/payments")
async def get_payments(
    booking_id: Optional[str] = None,
    page: int = 1,
    client: HostAPIClient = Depends(get_host_api_client),
    admin: AdminAccount = Depends(get_current_admin)
):
    return await client.get_payments(booking_id=booking_id, page=page)

@router.get("/payments/{payment_id}")
async def get_payment(
    payment_id: str,
    client: HostAPIClient = Depends(get_host_api_client),
    admin: AdminAccount = Depends(get_current_admin)
):
    return await client.get_payment(payment_id)

@router.get("/reviews")
async def get_reviews(
    room_id: Optional[str] = None,
    page: int = 1,
    client: HostAPIClient = Depends(get_host_api_client),
    admin: AdminAccount = Depends(get_current_admin)
):
    return await client.get_reviews(room_id=room_id, page=page)

@router.post("/reviews/{review_id}/hide")
async def hide_review(
    review_id: str,
    client: HostAPIClient = Depends(get_host_api_client),
    admin: AdminAccount = Depends(get_current_admin)
):
    return await client.hide_review(review_id)

@router.post("/reviews/{review_id}/show")
async def show_review(
    review_id: str,
    client: HostAPIClient = Depends(get_host_api_client),
    admin: AdminAccount = Depends(get_current_admin)
):
    return await client.show_review(review_id)

@router.get("/withdrawals")
async def get_withdrawals(
    client: HostAPIClient = Depends(get_host_api_client),
    admin: AdminAccount = Depends(get_current_admin)
):
    return await client.get_withdrawals()

@router.post("/withdrawals/{id}/approve")
async def approve_withdrawal(
    id: str,
    client: HostAPIClient = Depends(get_host_api_client),
    admin: AdminAccount = Depends(get_current_admin)
):
    return await client.approve_withdrawal(id)

@router.post("/withdrawals/{id}/reject")
async def reject_withdrawal(
    id: str,
    reason: str,
    client: HostAPIClient = Depends(get_host_api_client),
    admin: AdminAccount = Depends(get_current_admin)
):
    return await client.reject_withdrawal(id, reason)

@router.get("/stats")
async def get_stats(
    client: HostAPIClient = Depends(get_host_api_client),
    admin: AdminAccount = Depends(get_current_admin)
):
    return await client.get_stats()

@router.get("/stats/revenue")
async def get_revenue_stats(
    period: str = "monthly",
    client: HostAPIClient = Depends(get_host_api_client),
    admin: AdminAccount = Depends(get_current_admin)
):
    return await client.get_revenue_stats(period)

@router.get("/stats/bookings")
async def get_booking_stats(
    period: str = "monthly",
    client: HostAPIClient = Depends(get_host_api_client),
    admin: AdminAccount = Depends(get_current_admin)
):
    return await client.get_booking_stats(period)

@router.get("/verifications")
async def get_verifications(
    status: Optional[str] = None,
    user_type: Optional[str] = None,
    client: HostAPIClient = Depends(get_host_api_client),
    admin: AdminAccount = Depends(get_current_admin)
):
    return await client.get_verifications(status=status, user_type=user_type)

@router.get("/verifications/{id}")
async def get_verification(
    id: str,
    client: HostAPIClient = Depends(get_host_api_client),
    admin: AdminAccount = Depends(get_current_admin)
):
    return await client.get_verification(id)

@router.post("/verifications/{id}/approve")
async def approve_verification(
    id: str,
    client: HostAPIClient = Depends(get_host_api_client),
    admin: AdminAccount = Depends(get_current_admin)
):
    return await client.approve_verification(id)

@router.post("/verifications/{id}/reject")
async def reject_verification(
    id: str,
    reason: str,
    client: HostAPIClient = Depends(get_host_api_client),
    admin: AdminAccount = Depends(get_current_admin)
):
    return await client.reject_verification(id, reason)
