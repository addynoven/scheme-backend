-- name: CreateUserDocument :one
INSERT INTO user_documents (
    user_id, household_member_id, citizen_uid, document_type, document_number_masked,
    file_key, file_name, file_size_bytes, mime_type, is_verified, uploaded_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()
)
RETURNING *;

-- name: GetUserDocumentByID :one
SELECT * FROM user_documents
WHERE id = $1 LIMIT 1;

-- name: ListUserDocumentsByUserID :many
SELECT * FROM user_documents
WHERE user_id = $1
ORDER BY uploaded_at DESC;

-- name: DeleteUserDocument :exec
DELETE FROM user_documents
WHERE id = $1 AND user_id = $2;

-- name: VerifyUserDocument :one
UPDATE user_documents
SET is_verified = TRUE, verified_at = NOW()
WHERE id = $1
RETURNING *;
