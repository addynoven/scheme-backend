package service

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"
	"scheme-backend-go/gen/sqlc"
	"scheme-backend-go/internal/features/admin/dto"
	"scheme-backend-go/internal/features/admin/repository"
	authDto "scheme-backend-go/internal/features/auth/dto"
	"scheme-backend-go/internal/pkg/errors"
)

type AdminService interface {
	ListUsers(ctx context.Context) ([]authDto.UserResponse, error)
	UpdateUserRole(ctx context.Context, targetUserID, actorAdminID int32, newRole string, reason *string) (*authDto.UserResponse, error)
	ListAudits(ctx context.Context) ([]dto.RoleChangeAuditResponse, error)
}

type adminService struct {
	repo repository.AdminRepository
}

func NewAdminService(repo repository.AdminRepository) AdminService {
	return &adminService{repo: repo}
}

func (s *adminService) ListUsers(ctx context.Context) ([]authDto.UserResponse, error) {
	users, err := s.repo.ListAllUsers(ctx)
	if err != nil {
		return nil, errors.Internal("Failed to list users")
	}

	res := make([]authDto.UserResponse, len(users))
	for i, u := range users {
		var citizenUID *string
		if u.CitizenUid.Valid {
			citizenUID = &u.CitizenUid.String
		}
		var householdUID *string
		if u.HouseholdUid.Valid {
			householdUID = &u.HouseholdUid.String
		}

		res[i] = authDto.UserResponse{
			ID:           u.ID,
			CitizenUID:   citizenUID,
			HouseholdUID: householdUID,
			Email:        u.Email,
			Phone:        u.Phone,
			PhoneNumber:  u.Phone,
			Role:         u.Role,
			IsVerified:   u.IsVerified,
			CreatedAt:    u.CreatedAt.Time,
			UpdatedAt:    u.UpdatedAt.Time,
		}
	}

	return res, nil
}

func (s *adminService) UpdateUserRole(ctx context.Context, targetUserID, actorAdminID int32, newRole string, reason *string) (*authDto.UserResponse, error) {
	user, err := s.repo.GetUserByID(ctx, targetUserID)
	if err != nil {
		return nil, errors.NotFound(fmt.Sprintf("User ID %d not found", targetUserID))
	}

	oldRole := user.Role
	newRole = cleanRole(newRole)

	if oldRole != newRole {
		var rText pgtype.Text
		if reason != nil {
			rText = pgtype.Text{String: *reason, Valid: true}
		} else {
			rText = pgtype.Text{String: fmt.Sprintf("Role updated from %s to %s by admin %d", oldRole, newRole, actorAdminID), Valid: true}
		}

		_, err = s.repo.CreateRoleChangeAudit(ctx, sqlc.CreateRoleChangeAuditParams{
			TargetUserID: targetUserID,
			ActorAdminID: actorAdminID,
			PreviousRole: oldRole,
			NewRole:      newRole,
			Reason:       rText,
		})
		if err != nil {
			return nil, errors.Internal("Failed to record role change audit")
		}

		if err := s.repo.UpdateUserRole(ctx, targetUserID, newRole); err != nil {
			return nil, errors.Internal("Failed to update user role")
		}
		user.Role = newRole
	}

	var citizenUID *string
	if user.CitizenUid.Valid {
		citizenUID = &user.CitizenUid.String
	}
	var householdUID *string
	if user.HouseholdUid.Valid {
		householdUID = &user.HouseholdUid.String
	}

	return &authDto.UserResponse{
		ID:           user.ID,
		CitizenUID:   citizenUID,
		HouseholdUID: householdUID,
		Email:        user.Email,
		Phone:        user.Phone,
		PhoneNumber:  user.Phone,
		Role:         user.Role,
		IsVerified:   user.IsVerified,
		CreatedAt:    user.CreatedAt.Time,
		UpdatedAt:    user.UpdatedAt.Time,
	}, nil
}

func (s *adminService) ListAudits(ctx context.Context) ([]dto.RoleChangeAuditResponse, error) {
	audits, err := s.repo.ListRoleChangeAudits(ctx)
	if err != nil {
		return nil, errors.Internal("Failed to list role change audits")
	}

	res := make([]dto.RoleChangeAuditResponse, len(audits))
	for i, a := range audits {
		var reason *string
		if a.Reason.Valid {
			reason = &a.Reason.String
		}
		res[i] = dto.RoleChangeAuditResponse{
			ID:           a.ID,
			TargetUserID: a.TargetUserID,
			ActorAdminID: a.ActorAdminID,
			PreviousRole: a.PreviousRole,
			NewRole:      a.NewRole,
			Reason:       reason,
			CreatedAt:    a.CreatedAt.Time,
		}
	}

	return res, nil
}

func cleanRole(r string) string {
	switch r {
	case "admin", "ADMIN":
		return "admin"
	case "officer", "OFFICER":
		return "officer"
	default:
		return "citizen"
	}
}
