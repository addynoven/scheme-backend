-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS scheme_versions (
    id SERIAL PRIMARY KEY,
    scheme_id INTEGER NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    source_hash VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_scheme_versions_scheme_id ON scheme_versions(scheme_id);

CREATE TABLE IF NOT EXISTS eligibility_rule_versions (
    id SERIAL PRIMARY KEY,
    scheme_version_id INTEGER NOT NULL REFERENCES scheme_versions(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    operator VARCHAR(20) NOT NULL,
    rule_value VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_eligibility_rule_versions_scheme_version_id ON eligibility_rule_versions(scheme_version_id);

CREATE TABLE IF NOT EXISTS eligibility_decisions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    scheme_id INTEGER REFERENCES schemes(id) ON DELETE SET NULL,
    scheme_version_id INTEGER,
    scheme_slug VARCHAR(255) NOT NULL,
    profile_snapshot JSONB NOT NULL DEFAULT '{}',
    decision VARCHAR(50) NOT NULL,
    match_percentage DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    matched_rules_count INTEGER NOT NULL DEFAULT 0,
    failed_rules_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_eligibility_decisions_user_id ON eligibility_decisions(user_id);
CREATE INDEX IF NOT EXISTS ix_eligibility_decisions_scheme_id ON eligibility_decisions(scheme_id);
CREATE INDEX IF NOT EXISTS ix_eligibility_decisions_scheme_slug ON eligibility_decisions(scheme_slug);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS eligibility_decisions;
DROP TABLE IF EXISTS eligibility_rule_versions;
DROP TABLE IF EXISTS scheme_versions;
-- +goose StatementEnd
