"""add_provider_refund_id_to_payments

Revision ID: a1b2c3d4e5f6
Revises: c36ccff3b0b5
Create Date: 2026-06-26 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'c36ccff3b0b5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def table_exists(table_name: str) -> bool:
    bind = op.get_bind()
    return sa.inspect(bind).has_table(table_name)


def column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    columns = [col['name'] for col in insp.get_columns(table_name)]
    return column_name in columns


def upgrade() -> None:
    if table_exists('payments') and not column_exists('payments', 'provider_refund_id'):
        op.add_column(
            'payments',
            sa.Column('provider_refund_id', sa.String(length=100), nullable=True),
        )


def downgrade() -> None:
    if table_exists('payments') and column_exists('payments', 'provider_refund_id'):
        op.drop_column('payments', 'provider_refund_id')