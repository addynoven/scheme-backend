package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"scheme-backend-go/gen/sqlc"
)

type AuthRepository interface {
	CreateUser(ctx context.Context, arg sqlc.CreateUserParams) (sqlc.User, error)
	GetUserByID(ctx context.Context, id int32) (sqlc.User, error)
	GetUserByEmail(ctx context.Context, email string) (sqlc.User, error)
	GetUserByPhone(ctx context.Context, phone string) (sqlc.User, error)
	CreateProfile(ctx context.Context, arg sqlc.CreateProfileParams) (sqlc.Profile, error)
	GetProfileByUserID(ctx context.Context, userID int32) (sqlc.Profile, error)
	UpdateProfile(ctx context.Context, arg sqlc.UpdateProfileParams) (sqlc.Profile, error)
	CreateRefreshToken(ctx context.Context, arg sqlc.CreateRefreshTokenParams) (sqlc.RefreshToken, error)
	GetRefreshTokenByHash(ctx context.Context, hash string) (sqlc.RefreshToken, error)
	RevokeRefreshTokenFamily(ctx context.Context, familyID string) error
	RevokeRefreshToken(ctx context.Context, id int32) error
	ListCitizenFactsByUserID(ctx context.Context, userID int32) ([]sqlc.CitizenFact, error)
	CreateCitizenFact(ctx context.Context, arg sqlc.CreateCitizenFactParams) (sqlc.CitizenFact, error)
}

type authRepository struct {
	queries *sqlc.Queries
	pool    *pgxpool.Pool
}

func NewAuthRepository(pool *pgxpool.Pool) AuthRepository {
	return &authRepository{
		queries: sqlc.New(pool),
		pool:    pool,
	}
}

func (r *authRepository) CreateUser(ctx context.Context, arg sqlc.CreateUserParams) (sqlc.User, error) {
	return r.queries.CreateUser(ctx, arg)
}

func (r *authRepository) GetUserByID(ctx context.Context, id int32) (sqlc.User, error) {
	return r.queries.GetUserByID(ctx, id)
}

func (r *authRepository) GetUserByEmail(ctx context.Context, email string) (sqlc.User, error) {
	return r.queries.GetUserByEmail(ctx, email)
}

func (r *authRepository) GetUserByPhone(ctx context.Context, phone string) (sqlc.User, error) {
	return r.queries.GetUserByPhone(ctx, phone)
}

func (r *authRepository) CreateProfile(ctx context.Context, arg sqlc.CreateProfileParams) (sqlc.Profile, error) {
	return r.queries.CreateProfile(ctx, arg)
}

func (r *authRepository) GetProfileByUserID(ctx context.Context, userID int32) (sqlc.Profile, error) {
	return r.queries.GetProfileByUserID(ctx, userID)
}

func (r *authRepository) UpdateProfile(ctx context.Context, arg sqlc.UpdateProfileParams) (sqlc.Profile, error) {
	return r.queries.UpdateProfile(ctx, arg)
}

func (r *authRepository) CreateRefreshToken(ctx context.Context, arg sqlc.CreateRefreshTokenParams) (sqlc.RefreshToken, error) {
	return r.queries.CreateRefreshToken(ctx, arg)
}

func (r *authRepository) GetRefreshTokenByHash(ctx context.Context, hash string) (sqlc.RefreshToken, error) {
	return r.queries.GetRefreshTokenByHash(ctx, hash)
}

func (r *authRepository) RevokeRefreshTokenFamily(ctx context.Context, familyID string) error {
	return r.queries.RevokeRefreshTokenFamily(ctx, familyID)
}

func (r *authRepository) RevokeRefreshToken(ctx context.Context, id int32) error {
	return r.queries.RevokeRefreshToken(ctx, id)
}

func (r *authRepository) ListCitizenFactsByUserID(ctx context.Context, userID int32) ([]sqlc.CitizenFact, error) {
	return r.queries.ListCitizenFactsByUserID(ctx, userID)
}

func (r *authRepository) CreateCitizenFact(ctx context.Context, arg sqlc.CreateCitizenFactParams) (sqlc.CitizenFact, error) {
	return r.queries.CreateCitizenFact(ctx, arg)
}
