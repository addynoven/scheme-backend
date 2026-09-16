package eligibility_test

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
	delivery "scheme-backend-go/internal/features/eligibility/delivery/http"
	"scheme-backend-go/internal/features/eligibility/dto"
	"scheme-backend-go/internal/features/eligibility/service"
	schemesRepo "scheme-backend-go/internal/features/schemes/repository"
	"scheme-backend-go/internal/pkg/errors"
	"scheme-backend-go/internal/pkg/jwt"
)

type MockSchemesRepo struct {
	schemesRepo.SchemesRepository
	mock.Mock
}

func (m *MockSchemesRepo) ListPublishedSchemes(ctx context.Context) ([]sqlc.Scheme, error) {
	args := m.Called(ctx)
	return args.Get(0).([]sqlc.Scheme), args.Error(1)
}

func (m *MockSchemesRepo) GetSchemeBySlug(ctx context.Context, slug string) (sqlc.Scheme, error) {
	args := m.Called(ctx, slug)
	return args.Get(0).(sqlc.Scheme), args.Error(1)
}

func (m *MockSchemesRepo) GetEligibilityRulesBySchemeID(ctx context.Context, schemeID int32) ([]sqlc.EligibilityRule, error) {
	args := m.Called(ctx, schemeID)
	return args.Get(0).([]sqlc.EligibilityRule), args.Error(1)
}

func (m *MockSchemesRepo) GetBenefitsBySchemeID(ctx context.Context, schemeID int32) ([]sqlc.Benefit, error) {
	args := m.Called(ctx, schemeID)
	return args.Get(0).([]sqlc.Benefit), args.Error(1)
}

func (m *MockSchemesRepo) ListAllEligibilityRules(ctx context.Context) ([]sqlc.EligibilityRule, error) {
	args := m.Called(ctx)
	return args.Get(0).([]sqlc.EligibilityRule), args.Error(1)
}

func (m *MockSchemesRepo) ListAllBenefitsSummary(ctx context.Context) ([]sqlc.ListAllBenefitsSummaryRow, error) {
	args := m.Called(ctx)
	return args.Get(0).([]sqlc.ListAllBenefitsSummaryRow), args.Error(1)
}

func TestEligibility_Check_Flow(t *testing.T) {
	mockRepo := new(MockSchemesRepo)

	jwtSvc := jwt.NewService(&config.Config{
		JWT: config.JWTConfig{
			Secret:               "test-secret-key-32-bytes-long!",
			AccessTokenDuration:  15 * time.Minute,
			RefreshTokenDuration: 24 * time.Hour,
		},
	})

	// No real DB pool needed when testing unauthenticated check
	eligSvc := service.NewEligibilityService(mockRepo, nil)
	handler := delivery.NewEligibilityHandler(eligSvc, jwtSvc)

	app := fiber.New(fiber.Config{
		ErrorHandler: errors.FiberErrorHandler,
	})
	handler.RegisterRoutes(app)

	// Setup mock schemes
	sampleScheme := sqlc.Scheme{
		ID:          1,
		Name:        "PM Kisan",
		Slug:        "pm-kisan",
		State:       "ALL_INDIA",
		Ministry:    "Agriculture",
		Description: "Direct income support",
		Status:      "active",
		CreatedAt:   pgtype.Timestamptz{Time: time.Now(), Valid: true},
	}

	rule := sqlc.EligibilityRule{
		ID:        1,
		SchemeID:  1,
		FieldName: "annual_income",
		Operator:  "lte",
		RuleValue: "200000",
	}

	mockRepo.On("ListPublishedSchemes", mock.Anything).Return([]sqlc.Scheme{sampleScheme}, nil).Once()
	mockRepo.On("ListAllEligibilityRules", mock.Anything).Return([]sqlc.EligibilityRule{rule}, nil).Once()
	mockRepo.On("ListAllBenefitsSummary", mock.Anything).Return([]sqlc.ListAllBenefitsSummaryRow{}, nil).Once()

	// Send check request
	income := int32(150000)
	checkReq := dto.EligibilityCheckRequest{
		AnnualIncome: &income,
	}
	body, _ := json.Marshal(checkReq)

	req := httptest.NewRequest(http.MethodPost, "/eligibility/check", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req, -1)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var report dto.EligibilityReportResponse
	_ = json.NewDecoder(resp.Body).Decode(&report)
	assert.Equal(t, 1, report.TotalEvaluated)
	assert.Equal(t, 1, report.EligibleCount)
	assert.Equal(t, "pm-kisan", report.EligibleSchemes[0].SchemeSlug)
	assert.True(t, report.EligibleSchemes[0].IsEligible)
}
