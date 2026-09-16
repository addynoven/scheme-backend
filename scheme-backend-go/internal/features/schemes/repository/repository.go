package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"scheme-backend-go/gen/sqlc"
)

type SchemesRepository interface {
	ListPublishedSchemes(ctx context.Context) ([]sqlc.Scheme, error)
	ListAllSchemes(ctx context.Context) ([]sqlc.Scheme, error)
	GetSchemeByID(ctx context.Context, id int32) (sqlc.Scheme, error)
	GetSchemeBySlug(ctx context.Context, slug string) (sqlc.Scheme, error)
	ListCategories(ctx context.Context) ([]string, error)
	ListStates(ctx context.Context) ([]string, error)
	GetBenefitsBySchemeID(ctx context.Context, schemeID int32) ([]sqlc.Benefit, error)
	GetEligibilityRulesBySchemeID(ctx context.Context, schemeID int32) ([]sqlc.EligibilityRule, error)
	GetRequiredDocumentsBySchemeID(ctx context.Context, schemeID int32) ([]sqlc.RequiredDocument, error)
	GetOfficialSourcesBySchemeID(ctx context.Context, schemeID int32) ([]sqlc.OfficialSource, error)
	ListAllEligibilityRules(ctx context.Context) ([]sqlc.EligibilityRule, error)
	ListAllBenefitsSummary(ctx context.Context) ([]sqlc.ListAllBenefitsSummaryRow, error)
	CreateScheme(ctx context.Context, arg sqlc.CreateSchemeParams) (sqlc.Scheme, error)
	DeleteScheme(ctx context.Context, id int32) error
}

type schemesRepository struct {
	queries *sqlc.Queries
	pool    *pgxpool.Pool
}

func NewSchemesRepository(pool *pgxpool.Pool) SchemesRepository {
	return &schemesRepository{
		queries: sqlc.New(pool),
		pool:    pool,
	}
}

func (r *schemesRepository) ListPublishedSchemes(ctx context.Context) ([]sqlc.Scheme, error) {
	return r.queries.ListPublishedSchemes(ctx)
}

func (r *schemesRepository) ListAllSchemes(ctx context.Context) ([]sqlc.Scheme, error) {
	return r.queries.ListSchemes(ctx)
}

func (r *schemesRepository) GetSchemeByID(ctx context.Context, id int32) (sqlc.Scheme, error) {
	return r.queries.GetSchemeByID(ctx, id)
}

func (r *schemesRepository) GetSchemeBySlug(ctx context.Context, slug string) (sqlc.Scheme, error) {
	return r.queries.GetSchemeBySlug(ctx, slug)
}

func (r *schemesRepository) ListCategories(ctx context.Context) ([]string, error) {
	return r.queries.ListCategories(ctx)
}

func (r *schemesRepository) ListStates(ctx context.Context) ([]string, error) {
	return r.queries.ListStates(ctx)
}

func (r *schemesRepository) GetBenefitsBySchemeID(ctx context.Context, schemeID int32) ([]sqlc.Benefit, error) {
	return r.queries.GetBenefitsBySchemeID(ctx, schemeID)
}

func (r *schemesRepository) GetEligibilityRulesBySchemeID(ctx context.Context, schemeID int32) ([]sqlc.EligibilityRule, error) {
	return r.queries.GetEligibilityRulesBySchemeID(ctx, schemeID)
}

func (r *schemesRepository) GetRequiredDocumentsBySchemeID(ctx context.Context, schemeID int32) ([]sqlc.RequiredDocument, error) {
	return r.queries.GetRequiredDocumentsBySchemeID(ctx, schemeID)
}

func (r *schemesRepository) GetOfficialSourcesBySchemeID(ctx context.Context, schemeID int32) ([]sqlc.OfficialSource, error) {
	return r.queries.GetOfficialSourcesBySchemeID(ctx, schemeID)
}

func (r *schemesRepository) ListAllEligibilityRules(ctx context.Context) ([]sqlc.EligibilityRule, error) {
	return r.queries.ListAllEligibilityRules(ctx)
}

func (r *schemesRepository) ListAllBenefitsSummary(ctx context.Context) ([]sqlc.ListAllBenefitsSummaryRow, error) {
	return r.queries.ListAllBenefitsSummary(ctx)
}

func (r *schemesRepository) CreateScheme(ctx context.Context, arg sqlc.CreateSchemeParams) (sqlc.Scheme, error) {
	return r.queries.CreateScheme(ctx, arg)
}

func (r *schemesRepository) DeleteScheme(ctx context.Context, id int32) error {
	return r.queries.DeleteScheme(ctx, id)
}
