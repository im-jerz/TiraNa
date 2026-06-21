"""Add login_attempts table and OTP lockout columns to admin_users

Revision ID: 002
Revises: 001
Create Date: 2026-06-16
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "login_attempts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column(
            "attempted_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("success", sa.Boolean(), server_default="false", nullable=False),
    )
    op.create_index("ix_login_attempts_email", "login_attempts", ["email"])

    op.add_column(
        "admin_users",
        sa.Column("failed_otp_attempts", sa.Integer(), server_default="0", nullable=False),
    )
    op.add_column(
        "admin_users",
        sa.Column("otp_locked_until", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("admin_users", "otp_locked_until")
    op.drop_column("admin_users", "failed_otp_attempts")
    op.drop_index("ix_login_attempts_email", table_name="login_attempts")
    op.drop_table("login_attempts")
