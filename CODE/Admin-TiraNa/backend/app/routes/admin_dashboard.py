from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import AdminAccount, SupportTicket
from ..schemas import DashboardStatsResponse
from ..middleware.admin_auth import get_current_admin
from ..services.host_api_client import HostAPIClient, get_host_api_client
from ..services.client_api_client import client_api_client

router = APIRouter(prefix="/admin/dashboard", tags=["Admin Dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
async def dashboard_stats(
    period: str = "monthly",
    db: Session = Depends(get_db),
    host_client: HostAPIClient = Depends(get_host_api_client),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    open_tickets = db.query(SupportTicket).filter(SupportTicket.status == "open").count()

    # Fetch stats from Client API for user, booking, and revenue data
    client_users = await client_api_client.get_users()
    host_data = await host_client.get_hosts()
    host_users = host_data.get("users", []) if isinstance(host_data, dict) else []

    total_users = len(client_users) + len(host_users)

    # Get booking and revenue stats from Client API
    revenue_trend = []
    booking_trend = []
    total_bookings = 0
    total_revenue = 0

    try:
        revenue_trend = await client_api_client.get_revenue_trend(period)
    except Exception:
        pass

    try:
        booking_trend = await client_api_client.get_booking_trend(period)
    except Exception:
        pass

    try:
        total_bookings = await client_api_client.get_booking_count()
    except Exception:
        pass

    # Get host stats from Host API for active_listings and pending_withdrawals
    host_stats = await host_client.get_stats()

    # Get revenue totals from Client API
    revenue_data = await client_api_client.get_revenue_stats()
    total_revenue = revenue_data.get("total_revenue", 0) if revenue_data else 0

    # Count verified users from both backends
    verified_host_users = sum(1 for h in host_users if h.get("is_verified"))
    verified_client_users = sum(1 for c in client_users if c.get("is_verified"))
    verified_users = verified_host_users + verified_client_users
    unverified_users = total_users - verified_users

    return DashboardStatsResponse(
        total_users=total_users,
        verified_users=verified_users,
        unverified_users=unverified_users,
        active_listings=host_stats.get("active_listings", 0) or host_stats.get("total_properties", 0),
        total_bookings=total_bookings,
        revenue_this_month=total_revenue,
        pending_withdrawals=host_stats.get("pending_withdrawals", 0),
        open_support_tickets=open_tickets,
        revenue_trend=revenue_trend,
        booking_trend=booking_trend
    )
