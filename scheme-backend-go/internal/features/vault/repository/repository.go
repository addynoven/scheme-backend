package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"scheme-backend-go/gen/sqlc"
)

type VaultRepository interface {
	CreateUserDocument(ctx context.Context, arg sqlc.CreateUserDocumentParams) (sqlc.UserDocument, error)
	GetUserDocumentByID(ctx context.Context, id int32) (sqlc.UserDocument, error)
	ListUserDocumentsByUserID(ctx context.Context, userID int32) ([]sqlc.UserDocument, error)
	DeleteUserDocument(ctx context.Context, id, userID int32) error
	VerifyUserDocument(ctx context.Context, id int32) (sqlc.UserDocument, error)
}

type vaultRepository struct {
	queries *sqlc.Queries
	pool    *pgxpool.Pool
}

func NewVaultRepository(pool *pgxpool.Pool) VaultRepository {
	return &vaultRepository{
		queries: sqlc.New(pool),
		pool:    pool,
	}
}

func (r *vaultRepository) CreateUserDocument(ctx context.Context, arg sqlc.CreateUserDocumentParams) (sqlc.UserDocument, error) {
	return r.queries.CreateUserDocument(ctx, arg)
}

func (r *vaultRepository) GetUserDocumentByID(ctx context.Context, id int32) (sqlc.UserDocument, error) {
	return r.queries.GetUserDocumentByID(ctx, id)
}

func (r *vaultRepository) ListUserDocumentsByUserID(ctx context.Context, userID int32) ([]sqlc.UserDocument, error) {
	return r.queries.ListUserDocumentsByUserID(ctx, userID)
}

func (r *vaultRepository) DeleteUserDocument(ctx context.Context, id, userID int32) error {
	return r.queries.DeleteUserDocument(ctx, sqlc.DeleteUserDocumentParams{
		ID:     id,
		UserID: userID,
	})
}

func (r *vaultRepository) VerifyUserDocument(ctx context.Context, id int32) (sqlc.UserDocument, error) {
	return r.queries.VerifyUserDocument(ctx, id)
}
