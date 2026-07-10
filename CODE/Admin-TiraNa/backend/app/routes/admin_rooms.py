from fastapi import APIRouter, Depends, Query, HTTPException, Body
import logging
from ..models import AdminAccount
from ..middleware.admin_auth import get_current_admin
from ..services.host_api_client import host_api_client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/rooms", tags=["Admin Rooms"])


@router.get("/")
async def list_rooms(
    status: str = Query("", description="Filter by status: active, inactive, suspended"),
    search: str = Query("", description="Search by title or host name"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_admin: AdminAccount = Depends(get_current_admin)
):
    try:
        rooms = await host_api_client.get_rooms(status=status, search=search, skip=skip, limit=limit)
    except Exception as e:
        logger.warning(f"Host API rooms failed: {e}")
        rooms = []

    for r in rooms:
        if r.get("cover_photo") and not r["cover_photo"].startswith("http"):
            r["cover_photo"] = f"http://localhost:5001{r['cover_photo']}"

    return {"rooms": rooms}


@router.post("/{room_id}/status")
async def update_room_status(
    room_id: int,
    body: dict = Body(default={}),
    current_admin: AdminAccount = Depends(get_current_admin)
):
    status = body.get("status", "active")
    success = await host_api_client.update_room_status(room_id, status)
    if not success:
        raise HTTPException(status_code=404, detail="Room not found or update failed")
    return {"message": f"Room status updated to {status}"}
