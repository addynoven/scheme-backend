-- name: CreateEligibilityDecision :one
INSERT INTO eligibility_decisions (
    user_id, scheme_id, scheme_version_id, scheme_slug, profile_snapshot,
    decision, match_percentage, matched_rules_count, failed_rules_count, created_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()
)
RETURNING *;

-- name: ListEligibilityDecisionsByUserID :many
SELECT * FROM eligibility_decisions
WHERE user_id = $1
ORDER BY created_at DESC;
