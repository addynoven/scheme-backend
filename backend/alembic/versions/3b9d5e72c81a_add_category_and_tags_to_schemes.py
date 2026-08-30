"""add category and tags to schemes

Revision ID: 3b9d5e72c81a
Revises: 2a8c4f91b7d2
Create Date: 2026-08-11 08:24:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '3b9d5e72c81a'
down_revision: str | None = '2a8c4f91b7d2'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        'schemes',
        sa.Column('category', sa.String(length=100), server_default='General', nullable=False)
    )
    op.create_index(op.f('ix_schemes_category'), 'schemes', ['category'], unique=False)
    op.add_column(
        'schemes',
        sa.Column('tags', sa.String(length=500), nullable=True)
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_schemes_category'), table_name='schemes')
    op.drop_column('schemes', 'tags')
    op.drop_column('schemes', 'category')
