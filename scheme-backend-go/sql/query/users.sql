-- name: GetUserByID :one
SELECT * FROM users
WHERE id = $1 LIMIT 1;

-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = $1 LIMIT 1;

-- name: GetUserByPhone :one
SELECT * FROM users
WHERE phone = $1 LIMIT 1;

-- name: GetUserByCitizenUID :one
SELECT * FROM users
WHERE citizen_uid = $1 LIMIT 1;

-- name: CreateUser :one
INSERT INTO users (
    citizen_uid, household_uid, email, phone, hashed_password, role, is_verified, created_at, updated_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
)
RETURNING *;

-- name: UpdateUserRole :exec
UPDATE users
SET role = $2, updated_at = NOW()
WHERE id = $1;

-- name: UpdateUserVerification :exec
UPDATE users
SET is_verified = $2, updated_at = NOW()
WHERE id = $1;

-- name: CreateProfile :one
INSERT INTO profiles (
    user_id, full_name, date_of_birth, gender, state, district, annual_income, occupation,
    caste_category, is_differently_abled, marital_status, residence_area, has_land,
    created_at, updated_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()
)
RETURNING *;

-- name: GetProfileByUserID :one
SELECT * FROM profiles
WHERE user_id = $1 LIMIT 1;

-- name: UpdateProfile :one
UPDATE profiles
SET
    full_name = COALESCE($2, full_name),
    date_of_birth = COALESCE($3, date_of_birth),
    gender = COALESCE($4, gender),
    state = COALESCE($5, state),
    district = COALESCE($6, district),
    annual_income = COALESCE($7, annual_income),
    occupation = COALESCE($8, occupation),
    caste_category = COALESCE($9, caste_category),
    is_differently_abled = COALESCE($10, is_differently_abled),
    marital_status = COALESCE($11, marital_status),
    residence_area = COALESCE($12, residence_area),
    has_land = COALESCE($13, has_land),
    updated_at = NOW()
WHERE user_id = $1
RETURNING *;

-- name: CreateRefreshToken :one
INSERT INTO refresh_tokens (
    user_id, token_hash, family_id, is_revoked, expires_at, created_at
) VALUES (
    $1, $2, $3, $4, $5, NOW()
)
RETURNING *;

-- name: GetRefreshTokenByHash :one
SELECT * FROM refresh_tokens
WHERE token_hash = $1 LIMIT 1;

-- name: RevokeRefreshTokenFamily :exec
UPDATE refresh_tokens
SET is_revoked = TRUE
WHERE family_id = $1;

-- name: RevokeRefreshToken :exec
UPDATE refresh_tokens
SET is_revoked = TRUE
WHERE id = $1;

-- name: DeleteExpiredRefreshTokens :exec
DELETE FROM refresh_tokens
WHERE expires_at < NOW();

-- name: ListCitizenFactsByUserID :many
SELECT * FROM citizen_facts
WHERE user_id = $1
ORDER BY created_at DESC;

-- name: CreateCitizenFact :one
INSERT INTO citizen_facts (
    user_id, fact_key, fact_value, source_type, confidence_score, status,
    supersedes_fact_id, source_document_id, verified_by_user_id, verified_at, created_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
)
RETURNING *;
