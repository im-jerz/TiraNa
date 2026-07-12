"""drop_host_client_tables

Revision ID: d5e6f7a8b9c0
Revises: b2c3d4e5f6g7
Create Date: 2026-06-27 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd5e6f7a8b9c0'
down_revision: Union[str, None] = 'b2c3d4e5f6g7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def table_exists(table_name: str) -> bool:
    bind = op.get_bind()
    return sa.inspect(bind).has_table(table_name)


def upgrade() -> None:
    # Drop tables with foreign key dependencies first (children before parents)
    if table_exists('reviews'):
        op.drop_table('reviews')
    if table_exists('payments'):
        op.drop_table('payments')
    if table_exists('bookings'):
        op.drop_table('bookings')
    if table_exists('withdrawals'):
        op.drop_table('withdrawals')
    if table_exists('listings'):
        op.drop_table('listings')
    if table_exists('users'):
        op.drop_table('users')


def downgrade() -> None:
    # Recreate tables in dependency order (parents before children)
    if not table_exists('users'):
        op.create_table('users',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('username', sa.String(length=50), nullable=False),
            sa.Column('email', sa.String(length=100), nullable=False),
            sa.Column('password_hash', sa.String(length=255), nullable=False),
            sa.Column('is_verified', sa.Boolean(), nullable=True),
            sa.Column('verification_code', sa.String(length=6), nullable=True),
            sa.Column('external_id', sa.String(length=100), nullable=True),
            sa.Column('synced_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_users_external_id'), 'users', ['external_id'], unique=True)
        op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
        op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
        op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

    if not table_exists('listings'):
        op.create_table('listings',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('external_id', sa.String(length=100), nullable=True),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('host_external_id', sa.String(length=100), nullable=True),
            sa.Column('host_email', sa.String(length=100), nullable=True),
            sa.Column('location', sa.String(length=255), nullable=True),
            sa.Column('price_per_night', sa.Numeric(precision=10, scale=2), nullable=True),
            sa.Column('status', sa.String(length=20), nullable=True),
            sa.Column('rejection_reason', sa.Text(), nullable=True),
            sa.Column('photo_url', sa.Text(), nullable=True),
            sa.Column('synced_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_listings_external_id'), 'listings', ['external_id'], unique=True)
        op.create_index(op.f('ix_listings_host_external_id'), 'listings', ['host_external_id'], unique=False)
        op.create_index(op.f('ix_listings_id'), 'listings', ['id'], unique=False)
        op.create_index(op.f('ix_listings_status'), 'listings', ['status'], unique=False)

    if not table_exists('bookings'):
        op.create_table('bookings',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('external_id', sa.String(length=100), nullable=True),
            sa.Column('listing_id', sa.Integer(), nullable=True),
            sa.Column('listing_title', sa.String(length=255), nullable=True),
            sa.Column('guest_name', sa.String(length=100), nullable=True),
            sa.Column('guest_email', sa.String(length=100), nullable=True),
            sa.Column('host_external_id', sa.String(length=100), nullable=True),
            sa.Column('check_in', sa.DateTime(timezone=True), nullable=True),
            sa.Column('check_out', sa.DateTime(timezone=True), nullable=True),
            sa.Column('nights', sa.Integer(), nullable=True),
            sa.Column('total_price', sa.Numeric(precision=10, scale=2), nullable=True),
            sa.Column('status', sa.String(length=20), nullable=True),
            sa.Column('cancellation_reason', sa.Text(), nullable=True),
            sa.Column('synced_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['listing_id'], ['listings.id']),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_bookings_external_id'), 'bookings', ['external_id'], unique=True)
        op.create_index(op.f('ix_bookings_id'), 'bookings', ['id'], unique=False)
        op.create_index(op.f('ix_bookings_status'), 'bookings', ['status'], unique=False)
        op.create_index('ix_bookings_status_created', 'bookings', ['status', 'created_at'], unique=False)

    if not table_exists('payments'):
        op.create_table('payments',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('external_id', sa.String(length=100), nullable=True),
            sa.Column('booking_id', sa.Integer(), nullable=True),
            sa.Column('booking_external_id', sa.String(length=100), nullable=True),
            sa.Column('payer_name', sa.String(length=100), nullable=True),
            sa.Column('payer_email', sa.String(length=100), nullable=True),
            sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
            sa.Column('currency', sa.String(length=10), nullable=True),
            sa.Column('method', sa.String(length=50), nullable=True),
            sa.Column('status', sa.String(length=20), nullable=True),
            sa.Column('refund_amount', sa.Numeric(precision=10, scale=2), nullable=True),
            sa.Column('refund_reason', sa.Text(), nullable=True),
            sa.Column('provider_refund_id', sa.String(length=100), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['booking_id'], ['bookings.id']),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_payments_external_id'), 'payments', ['external_id'], unique=True)
        op.create_index(op.f('ix_payments_id'), 'payments', ['id'], unique=False)
        op.create_index(op.f('ix_payments_status'), 'payments', ['status'], unique=False)

    if not table_exists('reviews'):
        op.create_table('reviews',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('external_id', sa.String(length=100), nullable=True),
            sa.Column('listing_id', sa.Integer(), nullable=True),
            sa.Column('listing_title', sa.String(length=255), nullable=True),
            sa.Column('guest_name', sa.String(length=100), nullable=True),
            sa.Column('guest_email', sa.String(length=100), nullable=True),
            sa.Column('rating', sa.Integer(), nullable=True),
            sa.Column('comment', sa.Text(), nullable=True),
            sa.Column('is_hidden', sa.Boolean(), nullable=True),
            sa.Column('synced_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
            sa.ForeignKeyConstraint(['listing_id'], ['listings.id']),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_reviews_external_id'), 'reviews', ['external_id'], unique=True)
        op.create_index(op.f('ix_reviews_id'), 'reviews', ['id'], unique=False)

    if not table_exists('withdrawals'):
        op.create_table('withdrawals',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('external_id', sa.String(length=100), nullable=True),
            sa.Column('host_external_id', sa.String(length=100), nullable=True),
            sa.Column('host_name', sa.String(length=100), nullable=True),
            sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
            sa.Column('method', sa.String(length=50), nullable=True),
            sa.Column('status', sa.String(length=20), nullable=True),
            sa.Column('rejection_reason', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_withdrawals_external_id'), 'withdrawals', ['external_id'], unique=True)
        op.create_index(op.f('ix_withdrawals_host_external_id'), 'withdrawals', ['host_external_id'], unique=False)
        op.create_index(op.f('ix_withdrawals_id'), 'withdrawals', ['id'], unique=False)
        op.create_index(op.f('ix_withdrawals_status'), 'withdrawals', ['status'], unique=False)
