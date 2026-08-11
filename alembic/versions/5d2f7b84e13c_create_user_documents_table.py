"""create user documents table

Revision ID: 5d2f7b84e13c
Revises: 4c1e8a93d02b
Create Date: 2026-08-11 08:44:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '5d2f7b84e13c'
down_revision: str | None = '4c1e8a93d02b'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        'user_documents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('document_type', sa.String(length=100), nullable=False),
        sa.Column('document_number_masked', sa.String(length=100), nullable=True),
        sa.Column('file_key', sa.String(length=500), nullable=False),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_size_bytes', sa.Integer(), nullable=False),
        sa.Column('mime_type', sa.String(length=100), nullable=False),
        sa.Column('is_verified', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_documents_user_id'), 'user_documents', ['user_id'], unique=False)
    op.create_index(op.f('ix_user_documents_document_type'), 'user_documents', ['document_type'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_user_documents_document_type'), table_name='user_documents')
    op.drop_index(op.f('ix_user_documents_user_id'), table_name='user_documents')
    op.drop_table('user_documents')
