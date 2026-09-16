package admin_test

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
	delivery "scheme-backend-go/internal/features/admin/delivery/http"
	"scheme-backend-go/internal/features/admin/dto"
	"scheme-backend-go/internal/features/admin/service"
	"scheme-backend-go/internal/pkg/errors"
	"scheme-backend-go/internal/pkg/jwt"
)

type MockAdminRepo struct {
	mock.Mock
}

func (m *MockAdminRepo) CreateRoleChangeAudit(ctx context.Context, arg sqlc.CreateRoleChangeAuditParams) (sqlc.RoleChangeAudit, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(sqlc.RoleChangeAudit), args.Error(1)
}

func (m *MockAdminRepo) ListRoleChangeAudits(ctx context.Context) ([]sqlc.RoleChangeAudit, error) {
	args := m.Called(ctx)
	return args.Get(0).([]sqlc.RoleChangeAudit), args.Error(1)
}

func (m *MockAdminRepo) ListAllUsers(ctx context.Context) ([]sqlc.ListAllUsersRow, error) {
	args := m.Called(ctx)
	return args.Get(0).([]sqlc.ListAllUsersRow), args.Error(1)
}

func (m *MockAdminRepo) GetUserByID(ctx context.Context, id int32) (sqlc.User, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(sqlc.User), args.Error(1)
}

func (m *MockAdminRepo) UpdateUserRole(ctx context.Context, id int32, role string) error {
	args := m.Called(ctx, id, role)
	return args.Error(0)
}

func TestAdmin_RoleUpdate_Flow(t *testing.T) {
	repo := new(MockAdminRepo)
	jwtSvc := jwt.NewService(&config.Config{
		JWT: config.JWTConfig{
			Secret:               "test-secret-key-32-bytes-long!",
			AccessTokenDuration:  15 * time.Minute,
			RefreshTokenDuration: 24 * time.Hour,
		},
	})

	svc := service.NewAdminService(repo)
	handler := delivery.NewAdminHandler(svc, jwtSvc)

	app := fiber.New(fiber.Config{
		ErrorHandler: errors.FiberErrorHandler,
	})
	handler.RegisterRoutes(app)

	// Generate admin token
	adminTokens, _ := jwtSvc.GenerateTokenPair(99, "admin@gov.in", "admin")

	// Target user
	targetUser := sqlc.User{
		ID:         5,
		Email:      "officer@gov.in",
		Phone:      "+919999999999",
		Role:       "citizen",
		IsVerified: true,
		CreatedAt:  pgtype.Timestamptz{Time: time.Now(), Valid: true},
		UpdatedAt:  pgtype.Timestamptz{Time: time.Now(), Valid: true},
	}

	repo.On("GetUserByID", mock.Anything, int32(5)).Return(targetUser, nil).Once()
	repo.On("CreateRoleChangeAudit", mock.Anything, mock.Anything).Return(sqlc.RoleChangeAudit{}, nil).Once()
	repo.On("UpdateUserRole", mock.Anything, int32(5), "admin").Return(nil).Once()

	body, _ := json.Marshal(dto.UpdateRoleRequest{
		Role: "admin",
	})
	req := httptest.NewRequest(http.MethodPatch, "/admin/users/5/role", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+adminTokens.AccessToken)

	resp, err := app.Test(req, -1)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	// Test unauthorized access (citizen trying to access admin route)
	citizenTokens, _ := jwtSvc.GenerateTokenPair(12, "citizen@gov.in", "citizen")
	reqForbidden := httptest.NewRequest(http.MethodPatch, "/admin/users/5/role", bytes.NewReader(body))
	reqForbidden.Header.Set("Content-Type", "application/json")
	reqForbidden.Header.Set("Authorization", "Bearer "+citizenTokens.AccessToken)

	respForbidden, err := app.Test(reqForbidden, -1)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusForbidden, respForbidden.StatusCode)
}
