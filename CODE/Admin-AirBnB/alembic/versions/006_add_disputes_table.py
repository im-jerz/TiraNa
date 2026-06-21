"""Add disputes and dispute_messages tables

Revision ID: 006
Revises: 005
Create Date: 2026-06-19
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "disputes",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("booking_id", sa.String(36), nullable=False),
        sa.Column("guest_id", sa.String(36), nullable=False),
        sa.Column("host_id", sa.String(36), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("status", sa.String(20), server_default="open", nullable=False),
        sa.Column("resolution", sa.Text(), nullable=True),
        sa.Column("assigned_to", sa.String(36), sa.ForeignKey("admin_users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_disputes_booking_id", "disputes", ["booking_id"])
    op.create_index("ix_disputes_guest_id", "disputes", ["guest_id"])
    op.create_index("ix_disputes_host_id", "disputes", ["host_id"])
    op.create_index("ix_disputes_status", "disputes", ["status"])

    op.create_table(
        "dispute_messages",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("dispute_id", sa.String(36), sa.ForeignKey("disputes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("sender", sa.String(20), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_dispute_messages_dispute_id", "dispute_messages", ["dispute_id"])


def downgrade() -> None:
    op.drop_index("ix_dispute_messages_dispute_id", table_name="dispute_messages")
    op.drop_table("dispute_messages")
    op.drop_index("ix_disputes_status", table_name="disputes")
    op.drop_index("ix_disputes_host_id", table_name="disputes")
    op.drop_index("ix_disputes_guest_id", table_name="disputes")
    op.drop_index("ix_disputes_booking_id", table_name="disputes")
    op.drop_table("disputes")
