-- name: CreateChatSession :one
INSERT INTO chat_sessions (
    session_uid, user_id, title, language_code, created_at, updated_at
) VALUES (
    $1, $2, $3, $4, NOW(), NOW()
)
RETURNING *;

-- name: GetChatSessionByID :one
SELECT * FROM chat_sessions
WHERE id = $1 LIMIT 1;

-- name: GetChatSessionByUID :one
SELECT * FROM chat_sessions
WHERE session_uid = $1 LIMIT 1;

-- name: ListChatSessionsByUserID :many
SELECT * FROM chat_sessions
WHERE user_id = $1
ORDER BY updated_at DESC;

-- name: UpdateChatSessionTitle :one
UPDATE chat_sessions
SET title = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteChatSession :exec
DELETE FROM chat_sessions
WHERE id = $1 AND user_id = $2;

-- name: CreateChatMessage :one
INSERT INTO chat_messages (
    session_id, sender, content, intent, citations, created_at
) VALUES (
    $1, $2, $3, $4, $5, NOW()
)
RETURNING *;

-- name: ListChatMessagesBySessionID :many
SELECT * FROM chat_messages
WHERE session_id = $1
ORDER BY id ASC;
