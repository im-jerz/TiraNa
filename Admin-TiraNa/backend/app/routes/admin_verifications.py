from fastapi import APIRouter, Depends, Query, HTTPException, Body
from sqlalchemy.orm import Session
import uuid
import logging
from ..database import get_db
from ..models import AdminAccount, AdminAuditLog
from ..middleware.admin_auth import get_current_admin
from ..services.host_api_client import host_api_client
from ..services.client_api_client import client_api_client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/verifications", tags=["Admin Verifications"])


def is_uuid(value: str) -> bool:
    try:
        uuid.UUID(value)
        return True
    except ValueError:
        return False


@router.get("/")
async def list_verifications(
    status: str = Query("", description="Filter by status: pending, approved, rejected"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_admin: AdminAccount = Depends(get_current_admin)
):
    host_verifications = []
    client_verifications = []

    try:
        host_verifications = await host_api_client.get_verifications(status=status, skip=skip, limit=limit)
    except Exception as e:
        logger.warning(f"Host API verifications failed: {e}")

    try:
        client_verifications = await client_api_client.get_verifications(status=status, skip=skip, limit=limit)
    except Exception as e:
        logger.warning(f"Client API verifications failed: {e}")

    for v in host_verifications:
        if v.get("id_card_url") and not v["id_card_url"].startswith("http"):
            v["id_card_url"] = f"http://localhost:5001{v['id_card_url']}"
        if v.get("selfie_url") and not v["selfie_url"].startswith("http"):
            v["selfie_url"] = f"http://localhost:5001{v['selfie_url']}"

    for v in client_verifications:
        if v.get("id_front_url") and not v["id_front_url"].startswith("http"):
            v["id_front_url"] = f"http://localhost:5000{v['id_front_url']}"
        if v.get("id_back_url") and not v["id_back_url"].startswith("http"):
            v["id_back_url"] = f"http://localhost:5000{v['id_back_url']}"

    merged = host_verifications + client_verifications
    merged.sort(key=lambda v: v.get("submitted_at") or v.get("created_at") or "", reverse=True)

    return {"verifications": merged}


@router.post("/{verification_id}/approve")
async def approve_verification(
    verification_id: str,
    current_admin: AdminAccount = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    if is_uuid(verification_id):
        success = await client_api_client.approve_verification(verification_id)
    else:
        success = await host_api_client.approve_verification(int(verification_id))
    if not success:
        raise HTTPException(status_code=404, detail="Verification not found or approve failed")

    log = AdminAuditLog(
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="APPROVE_VERIFICATION",
        details=f"Approved verification (ID: {verification_id})",
    )
    db.add(log)
    db.commit()

    return {"message": "Verification approved successfully"}


@router.post("/{verification_id}/reject")
async def reject_verification(
    verification_id: str,
    body: dict = Body(default={}),
    current_admin: AdminAccount = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    reason = body.get("reason", "")
    if is_uuid(verification_id):
        success = await client_api_client.reject_verification(verification_id, reason=reason)
    else:
        success = await host_api_client.reject_verification(int(verification_id), reason=reason)
    if not success:
        raise HTTPException(status_code=404, detail="Verification not found or reject failed")

    log = AdminAuditLog(
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="REJECT_VERIFICATION",
        details=f"Rejected verification (ID: {verification_id}). Reason: {reason}",
    )
    db.add(log)
    db.commit()

    return {"message": "Verification rejected successfully"}
