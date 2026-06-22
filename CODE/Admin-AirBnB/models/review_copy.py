from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class ReviewCache(Base):
    __tablename__ = "reviews_cache"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    listing_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    guest_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    guest_name: Mapped[str] = mapped_column(String(255), nullable=False)
    guest_email: Mapped[str] = mapped_column(String(255), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(Text(), nullable=False)
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    synced_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
