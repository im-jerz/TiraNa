from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List
from ..models import AdminAccount
from ..schemas import UserResponse
from ..middleware.admin_auth import get_current_admin
from ..services.host_api_client import host_api_client
from ..services.client_api_client import client_api_client

router = APIRouter(prefix="/admin/users", tags=["Admin Users"])


@router.get("/", response_model=List[UserResponse])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: str = Query("", description="Search by username or email"),
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Get list of platform users from Host and Client backends."""
    host_data = await host_api_client.get_hosts(search=search, skip=skip, limit=limit)
    client_users = await client_api_client.get_users(search=search, skip=skip, limit=limit)

    hosts = host_data.get("users", [])
    for h in hosts:
        h["id"] = str(h["id"])
        h["role"] = "Host"

    for c in client_users:
        c["role"] = "Client"

    merged = hosts + client_users
    merged.sort(key=lambda u: u.get("created_at") or "", reverse=True)
    return merged


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Delete a platform user via Host API."""
    success = await host_api_client.delete_host(int(user_id))
    if not success:
        raise HTTPException(status_code=404, detail="User not found or delete failed")
    return {"message": "User deleted successfully"}
