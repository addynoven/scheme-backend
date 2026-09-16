-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS role_change_audits (
    id SERIAL PRIMARY KEY,
    target_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    previous_role VARCHAR(50) NOT NULL,
    new_role VARCHAR(50) NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_role_change_audits_target_user_id ON role_change_audits(target_user_id);
CREATE INDEX IF NOT EXISTS ix_role_change_audits_actor_admin_id ON role_change_audits(actor_admin_id);

CREATE TABLE IF NOT EXISTS ingestion_sources (
    id SERIAL PRIMARY KEY,
    source_key VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    endpoint_url VARCHAR(500) NOT NULL,
    source_type VARCHAR(50) NOT NULL DEFAULT 'json_feed',
    etag VARCHAR(255),
    last_modified_header VARCHAR(255),
    content_hash VARCHAR(64),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    failure_count INTEGER NOT NULL DEFAULT 0,
    last_checked_at TIMESTAMPTZ,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_ingestion_sources_source_key ON ingestion_sources(source_key);

CREATE TABLE IF NOT EXISTS ingestion_triage_items (
    id SERIAL PRIMARY KEY,
    source_id INTEGER NOT NULL REFERENCES ingestion_sources(id) ON DELETE CASCADE,
    scheme_slug VARCHAR(255) NOT NULL,
    scheme_name VARCHAR(255) NOT NULL,
    change_type VARCHAR(100) NOT NULL,
    impact_level VARCHAR(50) NOT NULL DEFAULT 'breaking',
    diff_summary TEXT NOT NULL,
    diff_payload JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending_review',
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_ingestion_triage_items_source_id ON ingestion_triage_items(source_id);
CREATE INDEX IF NOT EXISTS ix_ingestion_triage_items_scheme_slug ON ingestion_triage_items(scheme_slug);
CREATE INDEX IF NOT EXISTS ix_ingestion_triage_items_status ON ingestion_triage_items(status);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS ingestion_triage_items;
DROP TABLE IF EXISTS ingestion_sources;
DROP TABLE IF EXISTS role_change_audits;
-- +goose StatementEnd
