"""create ingestion and triage tables

Revision ID: c19d45e67890
Revises: b08d40047bc5
Create Date: 2026-08-14 00:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c19d45e67890'
down_revision: Union[str, Sequence[str], None] = 'b08d40047bc5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create ingestion_sources table
    op.create_table(
        'ingestion_sources',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('source_key', sa.String(length=100), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('endpoint_url', sa.String(length=500), nullable=False),
        sa.Column('source_type', sa.String(length=50), server_default='json_feed', nullable=False),
        sa.Column('etag', sa.String(length=255), nullable=True),
        sa.Column('last_modified_header', sa.String(length=255), nullable=True),
        sa.Column('content_hash', sa.String(length=64), nullable=True),
        sa.Column('status', sa.String(length=50), server_default='active', nullable=False),
        sa.Column('failure_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('last_checked_at', sa.DateTime(), nullable=True),
        sa.Column('last_synced_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_ingestion_sources_source_key'), 'ingestion_sources', ['source_key'], unique=True)

    # 2. Create ingestion_triage_items table
    op.create_table(
        'ingestion_triage_items',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('source_id', sa.Integer(), nullable=False),
        sa.Column('scheme_slug', sa.String(length=255), nullable=False),
        sa.Column('scheme_name', sa.String(length=255), nullable=False),
        sa.Column('change_type', sa.String(length=100), nullable=False),
        sa.Column('impact_level', sa.String(length=50), server_default='breaking', nullable=False),
        sa.Column('diff_summary', sa.Text(), nullable=False),
        sa.Column('diff_payload', sa.JSON(), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='pending_review', nullable=False),
        sa.Column('reviewed_by', sa.String(length=255), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['source_id'], ['ingestion_sources.id'], ondelete='CASCADE'),
    )
    op.create_index(op.f('ix_ingestion_triage_items_source_id'), 'ingestion_triage_items', ['source_id'], unique=False)
    op.create_index(op.f('ix_ingestion_triage_items_scheme_slug'), 'ingestion_triage_items', ['scheme_slug'], unique=False)
    op.create_index(op.f('ix_ingestion_triage_items_status'), 'ingestion_triage_items', ['status'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_ingestion_triage_items_status'), table_name='ingestion_triage_items')
    op.drop_index(op.f('ix_ingestion_triage_items_scheme_slug'), table_name='ingestion_triage_items')
    op.drop_index(op.f('ix_ingestion_triage_items_source_id'), table_name='ingestion_triage_items')
    op.drop_table('ingestion_triage_items')
    op.drop_index(op.f('ix_ingestion_sources_source_key'), table_name='ingestion_sources')
    op.drop_table('ingestion_sources')
