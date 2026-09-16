package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"scheme-backend-go/gen/sqlc"
)

type AdminRepository interface {
	CreateRoleChangeAudit(ctx context.Context, arg sqlc.CreateRoleChangeAuditParams) (sqlc.RoleChangeAudit, error)
	ListRoleChangeAudits(ctx context.Context) ([]sqlc.RoleChangeAudit, error)
	ListAllUsers(ctx context.Context) ([]sqlc.ListAllUsersRow, error)
	GetUserByID(ctx context.Context, id int32) (sqlc.User, error)
	UpdateUserRole(ctx context.Context, id int32, role string) error
}

type adminRepository struct {
	queries *sqlc.Queries
	pool    *pgxpool.Pool
}

func NewAdminRepository(pool *pgxpool.Pool) AdminRepository {
	return &adminRepository{
		queries: sqlc.New(pool),
		pool:    pool,
	}
}

func (r *adminRepository) CreateRoleChangeAudit(ctx context.Context, arg sqlc.CreateRoleChangeAuditParams) (sqlc.RoleChangeAudit, error) {
	return r.queries.CreateRoleChangeAudit(ctx, arg)
}

func (r *adminRepository) ListRoleChangeAudits(ctx context.Context) ([]sqlc.RoleChangeAudit, error) {
	return r.queries.ListRoleChangeAudits(ctx)
}

func (r *adminRepository) ListAllUsers(ctx context.Context) ([]sqlc.ListAllUsersRow, error) {
	return r.queries.ListAllUsers(ctx)
}

func (r *adminRepository) GetUserByID(ctx context.Context, id int32) (sqlc.User, error) {
	return r.queries.GetUserByID(ctx, id)
}

func (r *adminRepository) UpdateUserRole(ctx context.Context, id int32, role string) error {
	return r.queries.UpdateUserRole(ctx, sqlc.UpdateUserRoleParams{
		ID:   id,
		Role: role,
	})
}
