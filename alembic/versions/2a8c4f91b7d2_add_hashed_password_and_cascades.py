"""add hashed_password and cascades

Revision ID: 2a8c4f91b7d2
Revises: 1e2f631bea9a
Create Date: 2026-08-11 08:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '2a8c4f91b7d2'
down_revision: Union[str, Sequence[str], None] = '1e2f631bea9a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column(
            'hashed_password',
            sa.String(length=255),
            nullable=False,
            server_default='',
        ),
    )


def downgrade() -> None:
    op.drop_column('users', 'hashed_password')
