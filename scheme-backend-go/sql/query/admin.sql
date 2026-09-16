-- name: CreateRoleChangeAudit :one
INSERT INTO role_change_audits (
    target_user_id, actor_admin_id, previous_role, new_role, reason, created_at
) VALUES (
    $1, $2, $3, $4, $5, NOW()
)
RETURNING *;

-- name: ListRoleChangeAudits :many
SELECT * FROM role_change_audits
ORDER BY created_at DESC;

-- name: ListAllUsers :many
SELECT id, citizen_uid, household_uid, email, phone, role, is_verified, created_at, updated_at
FROM users
ORDER BY id ASC;
