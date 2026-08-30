"""add role to users

Revision ID: 4c1e8a93d02b
Revises: 3b9d5e72c81a
Create Date: 2026-08-11 08:35:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '4c1e8a93d02b'
down_revision: str | None = '3b9d5e72c81a'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('role', sa.String(length=50), server_default='citizen', nullable=False)
    )
    op.create_index(op.f('ix_users_role'), 'users', ['role'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_users_role'), table_name='users')
    op.drop_column('users', 'role')
