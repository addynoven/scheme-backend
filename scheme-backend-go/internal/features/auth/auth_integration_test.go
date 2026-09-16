package auth_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"

	"scheme-backend-go/gen/sqlc"
	"scheme-backend-go/internal/config"
	delivery "scheme-backend-go/internal/features/auth/delivery/http"
	"scheme-backend-go/internal/features/auth/dto"
	"scheme-backend-go/internal/features/auth/service"
	"scheme-backend-go/internal/pkg/errors"
	"scheme-backend-go/internal/pkg/jwt"
	"scheme-backend-go/internal/pkg/password"
)

type MockAuthRepo struct {
	mock.Mock
}

func (m *MockAuthRepo) CreateUser(ctx context.Context, arg sqlc.CreateUserParams) (sqlc.User, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(sqlc.User), args.Error(1)
}

func (m *MockAuthRepo) GetUserByID(ctx context.Context, id int32) (sqlc.User, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(sqlc.User), args.Error(1)
}

func (m *MockAuthRepo) GetUserByEmail(ctx context.Context, email string) (sqlc.User, error) {
	args := m.Called(ctx, email)
	return args.Get(0).(sqlc.User), args.Error(1)
}

func (m *MockAuthRepo) GetUserByPhone(ctx context.Context, phone string) (sqlc.User, error) {
	args := m.Called(ctx, phone)
	return args.Get(0).(sqlc.User), args.Error(1)
}

func (m *MockAuthRepo) CreateProfile(ctx context.Context, arg sqlc.CreateProfileParams) (sqlc.Profile, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(sqlc.Profile), args.Error(1)
}

func (m *MockAuthRepo) GetProfileByUserID(ctx context.Context, userID int32) (sqlc.Profile, error) {
	args := m.Called(ctx, userID)
	return args.Get(0).(sqlc.Profile), args.Error(1)
}

func (m *MockAuthRepo) UpdateProfile(ctx context.Context, arg sqlc.UpdateProfileParams) (sqlc.Profile, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(sqlc.Profile), args.Error(1)
}

func (m *MockAuthRepo) CreateRefreshToken(ctx context.Context, arg sqlc.CreateRefreshTokenParams) (sqlc.RefreshToken, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(sqlc.RefreshToken), args.Error(1)
}

func (m *MockAuthRepo) GetRefreshTokenByHash(ctx context.Context, hash string) (sqlc.RefreshToken, error) {
	args := m.Called(ctx, hash)
	return args.Get(0).(sqlc.RefreshToken), args.Error(1)
}

func (m *MockAuthRepo) RevokeRefreshTokenFamily(ctx context.Context, familyID string) error {
	args := m.Called(ctx, familyID)
	return args.Error(0)
}

func (m *MockAuthRepo) RevokeRefreshToken(ctx context.Context, id int32) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockAuthRepo) ListCitizenFactsByUserID(ctx context.Context, userID int32) ([]sqlc.CitizenFact, error) {
	args := m.Called(ctx, userID)
	return args.Get(0).([]sqlc.CitizenFact), args.Error(1)
}

func (m *MockAuthRepo) CreateCitizenFact(ctx context.Context, arg sqlc.CreateCitizenFactParams) (sqlc.CitizenFact, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(sqlc.CitizenFact), args.Error(1)
}

func setupTestApp(t *testing.T, repo *MockAuthRepo) (*fiber.App, *jwt.Service) {
	app := fiber.New(fiber.Config{
		ErrorHandler: errors.FiberErrorHandler,
	})

	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret:               "test-jwt-secret-key-32-chars-long",
			AccessTokenDuration:  15 * time.Minute,
			RefreshTokenDuration: 24 * time.Hour,
		},
	}
	jwtSvc := jwt.NewService(cfg)
	authSvc := service.NewAuthService(repo, jwtSvc)
	handler := delivery.NewAuthHandler(authSvc, jwtSvc)
	handler.RegisterRoutes(app)

	return app, jwtSvc
}

func TestAuth_RegisterAndLogin_Flow(t *testing.T) {
	repo := new(MockAuthRepo)
	app, _ := setupTestApp(t, repo)

	// Mock register calls
	hashed, _ := password.Hash("Secret123!")
	userRecord := sqlc.User{
		ID:             1,
		CitizenUid:     pgtype.Text{String: "CIT-ABC12345", Valid: true},
		HouseholdUid:   pgtype.Text{String: "HH-XYZ98765", Valid: true},
		Email:          "test@example.com",
		Phone:          "+919876543210",
		HashedPassword: hashed,
		Role:           "citizen",
		IsVerified:     false,
		CreatedAt:      pgtype.Timestamptz{Time: time.Now(), Valid: true},
		UpdatedAt:      pgtype.Timestamptz{Time: time.Now(), Valid: true},
	}

	repo.On("GetUserByEmail", mock.Anything, "test@example.com").Return(sqlc.User{}, assert.AnError).Once()
	repo.On("GetUserByPhone", mock.Anything, "+919876543210").Return(sqlc.User{}, assert.AnError).Once()
	repo.On("CreateUser", mock.Anything, mock.Anything).Return(userRecord, nil).Once()

	// 1. Send Register request
	regReq := dto.RegisterRequest{
		Email:    "test@example.com",
		Phone:    "+919876543210",
		Password: "Secret123!",
	}
	body, _ := json.Marshal(regReq)
	req := httptest.NewRequest(http.MethodPost, "/auth/register", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req, -1)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	var regResp dto.UserResponse
	_ = json.NewDecoder(resp.Body).Decode(&regResp)
	assert.Equal(t, int32(1), regResp.ID)
	assert.Equal(t, "test@example.com", regResp.Email)

	// 2. Send Login request
	repo.On("GetUserByEmail", mock.Anything, "test@example.com").Return(userRecord, nil).Once()
	repo.On("CreateRefreshToken", mock.Anything, mock.Anything).Return(sqlc.RefreshToken{
		ID:        1,
		UserID:    1,
		TokenHash: "dummyhash",
		FamilyID:  "family1",
		IsRevoked: false,
		ExpiresAt: pgtype.Timestamptz{Time: time.Now().Add(24 * time.Hour), Valid: true},
		CreatedAt: pgtype.Timestamptz{Time: time.Now(), Valid: true},
	}, nil).Once()
	repo.On("GetProfileByUserID", mock.Anything, int32(1)).Return(sqlc.Profile{}, assert.AnError).Once()

	loginReq := dto.LoginRequest{
		Email:    "test@example.com",
		Password: "Secret123!",
	}
	loginBody, _ := json.Marshal(loginReq)
	req2 := httptest.NewRequest(http.MethodPost, "/auth/login", bytes.NewReader(loginBody))
	req2.Header.Set("Content-Type", "application/json")

	resp2, err := app.Test(req2, -1)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp2.StatusCode)

	var tokenResp dto.TokenResponse
	_ = json.NewDecoder(resp2.Body).Decode(&tokenResp)
	assert.NotEmpty(t, tokenResp.AccessToken)
	assert.NotEmpty(t, tokenResp.RefreshToken)
	assert.Equal(t, "bearer", tokenResp.TokenType)
}
