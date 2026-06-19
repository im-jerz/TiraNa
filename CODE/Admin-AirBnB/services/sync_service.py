import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from models.booking_copy import BookingCache
from models.payment_copy import PaymentCache
from models.review_copy import ReviewCache
from models.system_setting import SystemSetting
from services.host_api import host_api

logger = logging.getLogger(__name__)

SYNC_INTERVAL_MINUTES = 5


def _get_last_sync(db: Session, key: str) -> datetime | None:
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if setting and setting.value:
        try:
            return datetime.fromisoformat(setting.value)
        except (ValueError, TypeError):
            return None
    return None


def _set_last_sync(db: Session, key: str) -> None:
    now = datetime.now(timezone.utc).isoformat()
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if setting:
        setting.value = now
    else:
        db.add(SystemSetting(id=str(uuid.uuid4()), key=key, value=now, description="Last sync timestamp"))
    db.commit()


def _needs_sync(db: Session, key: str) -> bool:
    last = _get_last_sync(db, key)
    if not last:
        return True
    elapsed = (datetime.now(timezone.utc) - last).total_seconds() / 60
    return elapsed >= SYNC_INTERVAL_MINUTES


def sync_bookings(db: Session) -> int:
    """Fetch all bookings from Host API and upsert into cache. Returns count."""
    if not _needs_sync(db, "last_sync_bookings"):
        return 0

    all_bookings = []
    page = 1
    while True:
        data = host_api.get_bookings(page=page, per_page=100)
        if not data or not data.get("bookings"):
            break
        all_bookings.extend(data["bookings"])
        if len(data["bookings"]) < 100:
            break
        page += 1

    count = 0
    for b in all_bookings:
        existing = db.query(BookingCache).filter(BookingCache.id == b["id"]).first()
        if existing:
            existing.guest_name = b.get("guest_name", existing.guest_name)
            existing.guest_email = b.get("guest_email", existing.guest_email)
            existing.listing_title = b.get("listing_title", existing.listing_title)
            existing.status = b.get("status", existing.status)
            existing.total_amount = b.get("total_amount", existing.total_amount)
            existing.cancellation_reason = b.get("cancellation_reason", existing.cancellation_reason)
        else:
            db.add(BookingCache(
                id=b["id"],
                guest_id=b.get("guest_id", ""),
                guest_name=b.get("guest_name", ""),
                guest_email=b.get("guest_email", ""),
                listing_id=b.get("listing_id", ""),
                listing_title=b.get("listing_title", ""),
                check_in=b.get("check_in", ""),
                check_out=b.get("check_out", ""),
                nights=b.get("nights", 0),
                status=b.get("status", ""),
                subtotal=b.get("subtotal", 0),
                service_fee=b.get("service_fee", 0),
                total_amount=b.get("total_amount", 0),
                cancellation_reason=b.get("cancellation_reason"),
            ))
        count += 1

    db.commit()
    _set_last_sync(db, "last_sync_bookings")
    logger.info("Synced %d bookings", count)
    return count


def sync_payments(db: Session) -> int:
    """Fetch all payments from Host API and upsert into cache. Returns count."""
    if not _needs_sync(db, "last_sync_payments"):
        return 0

    all_payments = []
    page = 1
    while True:
        data = host_api.get_payments(page=page, per_page=100)
        if not data or not data.get("payments"):
            break
        all_payments.extend(data["payments"])
        if len(data["payments"]) < 100:
            break
        page += 1

    count = 0
    for p in all_payments:
        existing = db.query(PaymentCache).filter(PaymentCache.id == p["id"]).first()
        if existing:
            existing.status = p.get("status", existing.status)
            existing.refund_amount = p.get("refund_amount", existing.refund_amount)
            existing.refund_reason = p.get("refund_reason", existing.refund_reason)
        else:
            db.add(PaymentCache(
                id=p["id"],
                booking_id=p.get("booking_id", ""),
                guest_id=p.get("guest_id", ""),
                guest_name=p.get("guest_name", ""),
                guest_email=p.get("guest_email", ""),
                amount=p.get("amount", 0),
                method=p.get("method", ""),
                status=p.get("status", ""),
                refund_amount=p.get("refund_amount"),
                refund_reason=p.get("refund_reason"),
            ))
        count += 1

    db.commit()
    _set_last_sync(db, "last_sync_payments")
    logger.info("Synced %d payments", count)
    return count


def sync_reviews(db: Session) -> int:
    """Fetch all reviews from Host API and upsert into cache. Returns count."""
    if not _needs_sync(db, "last_sync_reviews"):
        return 0

    all_reviews = []
    page = 1
    while True:
        data = host_api.get_reviews(page=page, per_page=100)
        if not data or not data.get("reviews"):
            break
        all_reviews.extend(data["reviews"])
        if len(data["reviews"]) < 100:
            break
        page += 1

    count = 0
    for r in all_reviews:
        existing = db.query(ReviewCache).filter(ReviewCache.id == r["id"]).first()
        if existing:
            existing.rating = r.get("rating", existing.rating)
            existing.text = r.get("text", existing.text)
            existing.is_hidden = r.get("is_hidden", existing.is_hidden)
        else:
            db.add(ReviewCache(
                id=r["id"],
                listing_id=r.get("listing_id", ""),
                guest_id=r.get("guest_id", ""),
                guest_name=r.get("guest_name", ""),
                guest_email=r.get("guest_email", ""),
                rating=r.get("rating", 0),
                text=r.get("text", ""),
                is_hidden=r.get("is_hidden", False),
            ))
        count += 1

    db.commit()
    _set_last_sync(db, "last_sync_reviews")
    logger.info("Synced %d reviews", count)
    return count


def sync_all(db: Session) -> dict:
    """Run all syncs. Returns summary."""
    return {
        "bookings": sync_bookings(db),
        "payments": sync_payments(db),
        "reviews": sync_reviews(db),
    }
