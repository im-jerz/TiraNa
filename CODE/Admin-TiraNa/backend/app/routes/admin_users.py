from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
import logging
from ..database import get_db
from ..models import AdminAccount, AdminAuditLog
from ..middleware.admin_auth import get_current_admin
from ..services.host_api_client import host_api_client
from ..services.client_api_client import client_api_client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/users", tags=["Admin Users"])


@router.get("/")
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: str = Query("", description="Search by username or email"),
    current_admin: AdminAccount = Depends(get_current_admin)
):
    hosts = []
    client_users = []

    try:
        host_data = await host_api_client.get_hosts(search=search, skip=skip, limit=limit)
        if isinstance(host_data, dict):
            hosts = host_data.get("users", [])
            for h in hosts:
                h["id"] = str(h["id"])
                h["role"] = "Host"
    except Exception as e:
        logger.warning(f"Host API failed: {e}")

    try:
        client_users = await client_api_client.get_users(search=search, skip=skip, limit=limit)
        for c in client_users:
            c["role"] = "Client"
    except Exception as e:
        logger.warning(f"Client API failed: {e}")

    merged = hosts + client_users
    merged.sort(key=lambda u: u.get("created_at") or "", reverse=True)
    return {"users": merged}


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    role: str = Query("", description="User role: 'Host' or 'Client'"),
    current_admin: AdminAccount = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    if role.lower() == "host":
        success = await host_api_client.delete_host(int(user_id))
    else:
        success = await client_api_client.delete_user(user_id)

    if not success:
        raise HTTPException(status_code=404, detail="User not found or delete failed")

    log = AdminAuditLog(
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="DELETE_USER",
        details=f"Deleted {role or 'unknown'} user (ID: {user_id})",
    )
    db.add(log)
    db.commit()

    return {"message": "User deleted successfully"}
