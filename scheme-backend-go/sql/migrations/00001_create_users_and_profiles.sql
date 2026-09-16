-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    citizen_uid VARCHAR(50) UNIQUE,
    household_uid VARCHAR(50),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'citizen',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_users_citizen_uid ON users(citizen_uid);
CREATE INDEX IF NOT EXISTS ix_users_household_uid ON users(household_uid);
CREATE INDEX IF NOT EXISTS ix_users_role ON users(role);

CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(50) NOT NULL,
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    annual_income INTEGER NOT NULL DEFAULT 0,
    occupation VARCHAR(100) NOT NULL,
    caste_category VARCHAR(100),
    is_differently_abled BOOLEAN,
    marital_status VARCHAR(50),
    residence_area VARCHAR(50),
    has_land BOOLEAN,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    family_id VARCHAR(100) NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS ix_refresh_tokens_family_id ON refresh_tokens(family_id);
CREATE INDEX IF NOT EXISTS ix_refresh_tokens_token_hash ON refresh_tokens(token_hash);

CREATE TABLE IF NOT EXISTS household_members (
    id SERIAL PRIMARY KEY,
    primary_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    citizen_uid VARCHAR(50) UNIQUE NOT NULL,
    member_uid VARCHAR(50) UNIQUE NOT NULL,
    household_uid VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    age INTEGER NOT NULL,
    gender VARCHAR(20) NOT NULL,
    occupation VARCHAR(100),
    life_stage VARCHAR(20) NOT NULL DEFAULT 'ADULT',
    date_of_birth DATE,
    caste_category VARCHAR(50),
    annual_income DOUBLE PRECISION,
    is_student BOOLEAN NOT NULL DEFAULT FALSE,
    is_disabled BOOLEAN NOT NULL DEFAULT FALSE,
    verification_status VARCHAR(50) NOT NULL DEFAULT 'UNVERIFIED',
    aadhaar_last_four VARCHAR(4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_household_members_primary_user_id ON household_members(primary_user_id);
CREATE INDEX IF NOT EXISTS ix_household_members_household_uid ON household_members(household_uid);
CREATE INDEX IF NOT EXISTS ix_household_members_citizen_uid ON household_members(citizen_uid);
CREATE INDEX IF NOT EXISTS ix_household_members_member_uid ON household_members(member_uid);
CREATE INDEX IF NOT EXISTS ix_household_members_life_stage ON household_members(life_stage);
CREATE INDEX IF NOT EXISTS ix_household_members_verification_status ON household_members(verification_status);

CREATE TABLE IF NOT EXISTS user_documents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    household_member_id INTEGER REFERENCES household_members(id) ON DELETE SET NULL,
    citizen_uid VARCHAR(50),
    document_type VARCHAR(100) NOT NULL,
    document_number_masked VARCHAR(100),
    file_key VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_user_documents_user_id ON user_documents(user_id);
CREATE INDEX IF NOT EXISTS ix_user_documents_household_member_id ON user_documents(household_member_id);
CREATE INDEX IF NOT EXISTS ix_user_documents_citizen_uid ON user_documents(citizen_uid);
CREATE INDEX IF NOT EXISTS ix_user_documents_document_type ON user_documents(document_type);

CREATE TABLE IF NOT EXISTS citizen_facts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fact_key VARCHAR(100) NOT NULL,
    fact_value VARCHAR(500) NOT NULL,
    source_type VARCHAR(50) NOT NULL DEFAULT 'self_attested',
    confidence_score DOUBLE PRECISION,
    status VARCHAR(50) NOT NULL DEFAULT 'unverified',
    supersedes_fact_id INTEGER REFERENCES citizen_facts(id) ON DELETE SET NULL,
    source_document_id INTEGER REFERENCES user_documents(id) ON DELETE SET NULL,
    verified_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_citizen_facts_user_id ON citizen_facts(user_id);
CREATE INDEX IF NOT EXISTS ix_citizen_facts_fact_key ON citizen_facts(fact_key);
CREATE INDEX IF NOT EXISTS ix_citizen_facts_source_document_id ON citizen_facts(source_document_id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS citizen_facts;
DROP TABLE IF EXISTS user_documents;
DROP TABLE IF EXISTS household_members;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS users;
-- +goose StatementEnd
