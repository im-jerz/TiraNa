import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from models.system_setting import SystemSetting


DEFAULT_SETTINGS = {
    "commission_percent": ("10", "Platform commission percentage"),
    "host_api_url": ("http://localhost:5000", "Host module API base URL"),
    "host_api_key": ("", "API key for Host module authentication"),
    "smtp_host": ("smtp.gmail.com", "SMTP server host"),
    "smtp_port": ("587", "SMTP server port"),
    "smtp_user": ("", "SMTP username"),
    "smtp_from": ("noreply@airbnb-admin.com", "Sender email address"),
    "support_email": ("", "Support contact email"),
    "min_withdrawal_amount": ("500", "Minimum host withdrawal amount (PHP)"),
    "platform_name": ("AirBnB Clone", "Platform display name"),
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
