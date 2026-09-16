-- name: ListSchemes :many
SELECT * FROM schemes
ORDER BY id ASC;

-- name: ListPublishedSchemes :many
SELECT * FROM schemes
WHERE status = 'active' AND publication_state = 'published'
ORDER BY id ASC;

-- name: GetSchemeByID :one
SELECT * FROM schemes
WHERE id = $1 LIMIT 1;

-- name: GetSchemeBySlug :one
SELECT * FROM schemes
WHERE slug = $1 LIMIT 1;

-- name: CreateScheme :one
INSERT INTO schemes (
    name, slug, state, category, tags, ministry, description, status,
    publication_state, source_freshness, application_url, official_website, launch_date,
    created_at, updated_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()
)
RETURNING *;

-- name: UpdateScheme :one
UPDATE schemes
SET
    name = COALESCE($2, name),
    slug = COALESCE($3, slug),
    state = COALESCE($4, state),
    category = COALESCE($5, category),
    tags = COALESCE($6, tags),
    ministry = COALESCE($7, ministry),
    description = COALESCE($8, description),
    status = COALESCE($9, status),
    publication_state = COALESCE($10, publication_state),
    source_freshness = COALESCE($11, source_freshness),
    application_url = COALESCE($12, application_url),
    official_website = COALESCE($13, official_website),
    launch_date = COALESCE($14, launch_date),
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteScheme :exec
DELETE FROM schemes
WHERE id = $1;

-- name: ListCategories :many
SELECT DISTINCT category FROM schemes
WHERE status = 'active'
ORDER BY category ASC;

-- name: ListStates :many
SELECT DISTINCT state FROM schemes
WHERE status = 'active'
ORDER BY state ASC;

-- name: GetBenefitsBySchemeID :many
SELECT * FROM benefits
WHERE scheme_id = $1
ORDER BY id ASC;

-- name: CreateBenefit :one
INSERT INTO benefits (
    scheme_id, title, description, created_at, updated_at
) VALUES (
    $1, $2, $3, NOW(), NOW()
)
RETURNING *;

-- name: DeleteBenefitsBySchemeID :exec
DELETE FROM benefits
WHERE scheme_id = $1;

-- name: GetEligibilityRulesBySchemeID :many
SELECT * FROM eligibility_rules
WHERE scheme_id = $1
ORDER BY id ASC;

-- name: CreateEligibilityRule :one
INSERT INTO eligibility_rules (
    scheme_id, field_name, operator, rule_value, created_at, updated_at
) VALUES (
    $1, $2, $3, $4, NOW(), NOW()
)
RETURNING *;

-- name: DeleteEligibilityRulesBySchemeID :exec
DELETE FROM eligibility_rules
WHERE scheme_id = $1;

-- name: GetRequiredDocumentsBySchemeID :many
SELECT * FROM required_documents
WHERE scheme_id = $1
ORDER BY id ASC;

-- name: CreateRequiredDocument :one
INSERT INTO required_documents (
    scheme_id, document_name, is_mandatory, description, created_at, updated_at
) VALUES (
    $1, $2, $3, $4, NOW(), NOW()
)
RETURNING *;

-- name: DeleteRequiredDocumentsBySchemeID :exec
DELETE FROM required_documents
WHERE scheme_id = $1;

-- name: GetOfficialSourcesBySchemeID :many
SELECT * FROM official_sources
WHERE scheme_id = $1
ORDER BY id ASC;

-- name: CreateOfficialSource :one
INSERT INTO official_sources (
    scheme_id, title, url, source_type, created_at, updated_at
) VALUES (
    $1, $2, $3, $4, NOW(), NOW()
)
RETURNING *;

-- name: ListAllEligibilityRules :many
SELECT * FROM eligibility_rules
ORDER BY id ASC;

-- name: ListAllBenefitsSummary :many
SELECT scheme_id, title FROM benefits
ORDER BY id ASC;
