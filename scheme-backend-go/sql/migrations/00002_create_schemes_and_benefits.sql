-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS schemes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    state VARCHAR(100) NOT NULL DEFAULT 'ALL_INDIA',
    category VARCHAR(100) NOT NULL DEFAULT 'General',
    tags VARCHAR(500),
    ministry VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    publication_state VARCHAR(50) NOT NULL DEFAULT 'published',
    source_freshness VARCHAR(50) NOT NULL DEFAULT 'fresh',
    application_url VARCHAR(500),
    official_website VARCHAR(500),
    launch_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_schemes_state ON schemes(state);
CREATE INDEX IF NOT EXISTS ix_schemes_category ON schemes(category);
CREATE INDEX IF NOT EXISTS ix_schemes_status ON schemes(status);
CREATE INDEX IF NOT EXISTS ix_schemes_publication_state ON schemes(publication_state);
CREATE INDEX IF NOT EXISTS ix_schemes_source_freshness ON schemes(source_freshness);

CREATE TABLE IF NOT EXISTS benefits (
    id SERIAL PRIMARY KEY,
    scheme_id INTEGER NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_benefits_scheme_id ON benefits(scheme_id);

CREATE TABLE IF NOT EXISTS eligibility_rules (
    id SERIAL PRIMARY KEY,
    scheme_id INTEGER NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    operator VARCHAR(20) NOT NULL,
    rule_value VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_eligibility_rules_scheme_id ON eligibility_rules(scheme_id);

CREATE TABLE IF NOT EXISTS required_documents (
    id SERIAL PRIMARY KEY,
    scheme_id INTEGER NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_required_documents_scheme_id ON required_documents(scheme_id);

CREATE TABLE IF NOT EXISTS official_sources (
    id SERIAL PRIMARY KEY,
    scheme_id INTEGER NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    source_type VARCHAR(50) NOT NULL DEFAULT 'website',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_official_sources_scheme_id ON official_sources(scheme_id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS official_sources;
DROP TABLE IF EXISTS required_documents;
DROP TABLE IF EXISTS eligibility_rules;
DROP TABLE IF EXISTS benefits;
DROP TABLE IF EXISTS schemes;
-- +goose StatementEnd
