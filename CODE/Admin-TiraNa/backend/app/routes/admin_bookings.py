from fastapi import APIRouter, Depends, Query
from typing import List
from ..models import AdminAccount
from ..schemas import BookingResponse
from ..middleware.admin_auth import get_current_admin
from ..services.client_api_client import client_api_client

router = APIRouter(prefix="/admin/bookings", tags=["Admin Bookings"])


@router.get("/", response_model=List[BookingResponse])
async def list_bookings(
    status: str = Query("", description="Filter by status"),
    search: str = Query("", description="Search by guest name/email/booking ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Get list of all platform bookings from Client API."""
    bookings = await client_api_client.get_bookings(
        status=status, search=search, skip=skip, limit=limit
    )
    return bookings
