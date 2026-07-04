import bcrypt
from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from .database import engine, get_db, SessionLocal, Base
from .models import AdminAccount, SystemSetting
from .config import get_settings
from .schemas import PublicStatsResponse
from .services.host_api_client import HostAPIClient, get_host_api_client
from .routes.admin_auth import router as admin_auth_router
from .routes.admin_management import router as admin_management_router
from .routes.admin_support import router as admin_support_router
from .routes.admin_disputes import router as admin_disputes_router
from .routes.admin_settings import router as admin_settings_router
from .routes.admin_dashboard import router as admin_dashboard_router
from .routes.admin_audit import router as admin_audit_router
from .routes.admin_host_proxy import router as admin_host_proxy_router
from .routes.admin_users import router as admin_users_router
from .routes.admin_bookings import router as admin_bookings_router
from .routes.admin_payments import router as admin_payments_router
from .routes.admin_withdrawals import router as admin_withdrawals_router
from .routes.admin_listings import router as admin_listings_router
from .routes.admin_reviews import router as admin_reviews_router
from .middleware.admin_auth import get_current_admin

settings = get_settings()

app = FastAPI(
    title="TiraNa Admin API",
    description="FastAPI backend for TiraNa Admin System",
    version="1.0.0",
)

cors_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin_auth_router)
app.include_router(admin_management_router)
app.include_router(admin_support_router)
app.include_router(admin_disputes_router)
app.include_router(admin_settings_router)
app.include_router(admin_dashboard_router)
app.include_router(admin_audit_router)
app.include_router(admin_host_proxy_router)
app.include_router(admin_users_router)
app.include_router(admin_bookings_router)
app.include_router(admin_payments_router)
app.include_router(admin_withdrawals_router)
app.include_router(admin_listings_router)
app.include_router(admin_reviews_router)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    seed_default_admin()
    seed_default_settings()


def seed_default_admin():
    session = SessionLocal()
    try:
        existing = session.query(AdminAccount).filter(
            AdminAccount.username == "admin"
        ).first()
        if not existing:
            hashed = bcrypt.hashpw("admin123".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            admin = AdminAccount(
                username="admin",
                email="admin@tirana.com",
                password_hash=hashed,
                is_active=True,
            )
            session.add(admin)
            session.commit()
            print("[SEED] Default admin created (username: admin, password: admin123)")
        else:
            print("[SEED] Admin account already exists, skipping")
    except Exception as e:
        session.rollback()
        print(f"[SEED] Error seeding admin: {e}")
    finally:
        session.close()


def seed_default_settings():
    defaults = {
        "commission_percentage": ("10", "Platform commission percentage"),
        "host_api_base_url": ("http://localhost:5001", "Host module API base URL"),
        "platform_name": ("TiraNa", "Platform display name"),
        "support_email": ("support@tirana.com", "Support contact email"),
        "min_payout_amount": ("500", "Minimum withdrawal amount (PHP)"),
        "max_refund_days": ("30", "Max days after booking to request refund"),
    }

    session = SessionLocal()
    try:
        for key, (value, desc) in defaults.items():
            existing = session.query(SystemSetting).filter(SystemSetting.key == key).first()
            if not existing:
                session.add(SystemSetting(key=key, value=value, description=desc))
        session.commit()
        print("[SEED] Default settings ensured")
    except Exception as e:
        session.rollback()
        print(f"[SEED] Error seeding settings: {e}")
    finally:
        session.close()


@app.get("/")
def root():
    return {"message": "TiraNa Admin API is running"}


@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database error: {str(e)}")


@app.get("/api/public/stats", response_model=PublicStatsResponse)
async def public_stats(
    db: Session = Depends(get_db),
    client: HostAPIClient = Depends(get_host_api_client),
):
    total_admins = db.query(AdminAccount).count()
    active_admins = db.query(AdminAccount).filter(AdminAccount.is_active == True).count()

    host_stats = await client.get_stats()

    return PublicStatsResponse(
        total_admins=total_admins,
        active_admins=active_admins,
        total_users=host_stats.get("total_hosts", 0),
        total_bookings=host_stats.get("total_bookings", 0),
        total_revenue=host_stats.get("total_revenue", 0),
    )
