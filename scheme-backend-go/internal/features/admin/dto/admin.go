package dto

import "time"

type UpdateRoleRequest struct {
	Role   string  `json:"role" validate:"required"`
	Reason *string `json:"reason,omitempty"`
}

type RoleChangeAuditResponse struct {
	ID           int32     `json:"id"`
	TargetUserID int32     `json:"target_user_id"`
	ActorAdminID int32     `json:"actor_admin_id"`
	PreviousRole string    `json:"previous_role"`
	NewRole      string    `json:"new_role"`
	Reason       *string   `json:"reason,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}
