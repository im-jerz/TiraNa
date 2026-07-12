"""add_synced_at_and_user_external_id

Revision ID: b2c3d4e5f6g7
Revises: a1b2c3d4e5f6
Create Date: 2026-06-26 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6g7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def table_exists(table_name: str) -> bool:
    bind = op.get_bind()
    return bind.dialect.has_table(bind, table_name)


def column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    columns = [col['name'] for col in insp.get_columns(table_name)]
    return column_name in columns


def upgrade() -> None:
    # Add external_id + synced_at to users
    if table_exists('users'):
        if not column_exists('users', 'external_id'):
            op.add_column('users', sa.Column('external_id', sa.String(length=100), nullable=True))
            op.create_index(op.f('ix_users_external_id'), 'users', ['external_id'], unique=True)
        if not column_exists('users', 'synced_at'):
            op.add_column('users', sa.Column('synced_at', sa.DateTime(timezone=True), nullable=True))

    # Add synced_at to bookings
    if table_exists('bookings') and not column_exists('bookings', 'synced_at'):
        op.add_column('bookings', sa.Column('synced_at', sa.DateTime(timezone=True), nullable=True))

    # Add synced_at to reviews
    if table_exists('reviews') and not column_exists('reviews', 'synced_at'):
        op.add_column('reviews', sa.Column('synced_at', sa.DateTime(timezone=True), nullable=True))

    # Add synced_at to listings
    if table_exists('listings') and not column_exists('listings', 'synced_at'):
        op.add_column('listings', sa.Column('synced_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    if table_exists('listings') and column_exists('listings', 'synced_at'):
        op.drop_column('listings', 'synced_at')

    if table_exists('reviews') and column_exists('reviews', 'synced_at'):
        op.drop_column('reviews', 'synced_at')

    if table_exists('bookings') and column_exists('bookings', 'synced_at'):
        op.drop_column('bookings', 'synced_at')

    if table_exists('users'):
        if column_exists('users', 'synced_at'):
            op.drop_column('users', 'synced_at')
        if column_exists('users', 'external_id'):
            op.drop_index(op.f('ix_users_external_id'), table_name='users')
            op.drop_column('users', 'external_id')
