import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from models.system_setting import SystemSetting


DEFAULT_SETTINGS = {
    "commission_percent": ("10", "Platform commission percentage"),
    "smtp_host": ("smtp.gmail.com", "SMTP server host"),
    "smtp_port": ("587", "SMTP server port"),
    "smtp_user": ("", "SMTP username"),
    "smtp_from": ("noreply@airbnb-admin.com", "Sender email address"),
    "support_email": ("", "Support contact email"),
    "min_withdrawal_amount": ("500", "Minimum host withdrawal amount (PHP)"),
    "platform_name": ("AirBnB Clone", "Platform display name"),
    "tax_percent": ("12", "VAT tax percentage"),
    "host_service_fee_percent": ("3", "Host service fee percentage"),
    "guest_service_fee_percent": ("14", "Guest service fee percentage"),
    "min_cleaning_fee": ("0", "Minimum cleaning fee (PHP)"),
    "max_cleaning_fee": ("5000", "Maximum cleaning fee (PHP)"),
    "default_cleaning_fee": ("500", "Default cleaning fee (PHP)"),
}


def _init_defaults(db: Session) -> None:
    existing = {s.key for s in db.query(SystemSetting.key).all()}
    for key, (value, description) in DEFAULT_SETTINGS.items():
        if key not in existing:
            db.add(SystemSetting(
                id=str(uuid.uuid4()),
                key=key,
                value=value,
                description=description,
            ))
    db.commit()


def get_setting(db: Session, key: str) -> str:
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if setting:
        return setting.value
    if key in DEFAULT_SETTINGS:
        return DEFAULT_SETTINGS[key][0]
    return ""


def get_all_settings(db: Session) -> list[SystemSetting]:
    _init_defaults(db)
    return db.query(SystemSetting).order_by(SystemSetting.key).all()


def set_setting(db: Session, key: str, value: str, admin_id: str) -> SystemSetting | None:
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        setting = SystemSetting(
            id=str(uuid.uuid4()),
            key=key,
            value=value,
            updated_by=admin_id,
        )
        db.add(setting)
    else:
        setting.value = value
        setting.updated_by = admin_id
        setting.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(setting)
    return setting
