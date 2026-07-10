from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import SystemSetting, AdminAccount, AdminAuditLog
from ..schemas import SettingResponse, SettingUpdateRequest
from ..middleware.admin_auth import get_current_admin

router = APIRouter(prefix="/admin/settings", tags=["Admin Settings"])

HIDDEN_KEYS = {"host_api_base_url"}


@router.get("/", response_model=List[SettingResponse])
def list_settings(
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    return db.query(SystemSetting).filter(~SystemSetting.key.in_(HIDDEN_KEYS)).order_by(SystemSetting.key).all()


@router.get("/{key}", response_model=SettingResponse)
def get_setting(
    key: str,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    if key in HIDDEN_KEYS:
        raise HTTPException(status_code=404, detail="Setting not found")
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return setting


@router.put("/{key}", response_model=SettingResponse)
def update_setting(
    key: str,
    body: SettingUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    if key in HIDDEN_KEYS:
        raise HTTPException(status_code=404, detail="Setting not found")
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    old_value = setting.value
    setting.value = body.value
    if body.description is not None:
        setting.description = body.description
    db.add(AdminAuditLog(
        admin_id=current_admin.id, admin_username=current_admin.username,
        action="UPDATE_SETTING", details=f"Updated setting {key}: {old_value} → {body.value}",
    ))
    db.commit()
    db.refresh(setting)
    return setting


@router.post("/", response_model=SettingResponse, status_code=201)
def create_setting(
    key: str,
    body: SettingUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: AdminAccount = Depends(get_current_admin),
):
    existing = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if existing:
        raise HTTPException(status_code=400, detail="Setting key already exists")
    setting = SystemSetting(key=key, value=body.value, description=body.description)
    db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting
