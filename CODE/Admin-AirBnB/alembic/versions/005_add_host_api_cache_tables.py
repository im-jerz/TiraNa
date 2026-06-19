"""Add bookings_cache, payments_cache, reviews_cache tables

Revision ID: 005
Revises: 004
Create Date: 2026-06-19
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "bookings_cache",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("guest_id", sa.String(36), nullable=False),
        sa.Column("guest_name", sa.String(255), nullable=False),
        sa.Column("guest_email", sa.String(255), nullable=False),
        sa.Column("listing_id", sa.String(36), nullable=False),
        sa.Column("listing_title", sa.String(255), nullable=False),
        sa.Column("check_in", sa.String(10), nullable=False),
        sa.Column("check_out", sa.String(10), nullable=False),
        sa.Column("nights", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("subtotal", sa.Float(), nullable=False),
        sa.Column("service_fee", sa.Float(), nullable=False),
        sa.Column("total_amount", sa.Float(), nullable=False),
        sa.Column("cancellation_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("synced_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_bookings_cache_guest_id", "bookings_cache", ["guest_id"])
    op.create_index("ix_bookings_cache_listing_id", "bookings_cache", ["listing_id"])
    op.create_index("ix_bookings_cache_status", "bookings_cache", ["status"])

    op.create_table(
        "payments_cache",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("booking_id", sa.String(36), nullable=False),
        sa.Column("guest_id", sa.String(36), nullable=False),
        sa.Column("guest_name", sa.String(255), nullable=False),
        sa.Column("guest_email", sa.String(255), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("method", sa.String(50), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("refund_amount", sa.Float(), nullable=True),
        sa.Column("refund_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("synced_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_payments_cache_booking_id", "payments_cache", ["booking_id"])
    op.create_index("ix_payments_cache_guest_id", "payments_cache", ["guest_id"])
    op.create_index("ix_payments_cache_status", "payments_cache", ["status"])

    op.create_table(
        "reviews_cache",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("listing_id", sa.String(36), nullable=False),
        sa.Column("guest_id", sa.String(36), nullable=False),
        sa.Column("guest_name", sa.String(255), nullable=False),
        sa.Column("guest_email", sa.String(255), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("is_hidden", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("synced_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_reviews_cache_listing_id", "reviews_cache", ["listing_id"])
    op.create_index("ix_reviews_cache_guest_id", "reviews_cache", ["guest_id"])


def downgrade() -> None:
    op.drop_index("ix_reviews_cache_guest_id", table_name="reviews_cache")
    op.drop_index("ix_reviews_cache_listing_id", table_name="reviews_cache")
    op.drop_table("reviews_cache")
    op.drop_index("ix_payments_cache_status", table_name="payments_cache")
    op.drop_index("ix_payments_cache_guest_id", table_name="payments_cache")
    op.drop_index("ix_payments_cache_booking_id", table_name="payments_cache")
    op.drop_table("payments_cache")
    op.drop_index("ix_bookings_cache_status", table_name="bookings_cache")
    op.drop_index("ix_bookings_cache_listing_id", table_name="bookings_cache")
    op.drop_index("ix_bookings_cache_guest_id", table_name="bookings_cache")
    op.drop_table("bookings_cache")
