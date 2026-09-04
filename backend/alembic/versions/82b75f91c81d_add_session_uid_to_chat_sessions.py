"""add session_uid to chat_sessions

Revision ID: 82b75f91c81d
Revises: 71a656b0a5b9
Create Date: 2026-09-04 03:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '82b75f91c81d'
down_revision: Union[str, None] = '71a656b0a5b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('chat_sessions', sa.Column('session_uid', sa.String(length=100), nullable=True))
    op.create_index(op.f('ix_chat_sessions_session_uid'), 'chat_sessions', ['session_uid'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_chat_sessions_session_uid'), table_name='chat_sessions')
    op.drop_column('chat_sessions', 'session_uid')
