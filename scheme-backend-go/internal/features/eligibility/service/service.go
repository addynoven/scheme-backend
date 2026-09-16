package service

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"strings"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"scheme-backend-go/gen/sqlc"
	"scheme-backend-go/internal/features/eligibility/dto"
	"scheme-backend-go/internal/features/eligibility/engine"
	schemesRepo "scheme-backend-go/internal/features/schemes/repository"
	"scheme-backend-go/internal/pkg/errors"
)

type EligibilityService interface {
	CheckEligibility(ctx context.Context, userID *int32, req dto.EligibilityCheckRequest) (*dto.EligibilityReportResponse, error)
	ExplainScheme(ctx context.Context, schemeSlug string, req dto.EligibilityCheckRequest) (*dto.SchemeExplanation, error)
}

type eligibilityService struct {
	schemesRepo schemesRepo.SchemesRepository
	queries     *sqlc.Queries
	pool        *pgxpool.Pool
}

func NewEligibilityService(schemesRepo schemesRepo.SchemesRepository, pool *pgxpool.Pool) EligibilityService {
	return &eligibilityService{
		schemesRepo: schemesRepo,
		queries:     sqlc.New(pool),
		pool:        pool,
	}
}

func (s *eligibilityService) CheckEligibility(ctx context.Context, userID *int32, req dto.EligibilityCheckRequest) (*dto.EligibilityReportResponse, error) {
	schemes, err := s.schemesRepo.ListPublishedSchemes(ctx)
	if err != nil {
		return nil, errors.Internal(fmt.Sprintf("Failed to fetch schemes: %v", err))
	}

	profileCtx := engine.BuildProfileContext(req)

	allRules, _ := s.schemesRepo.ListAllEligibilityRules(ctx)
	rulesByScheme := make(map[int32][]sqlc.EligibilityRule)
	for _, r := range allRules {
		rulesByScheme[r.SchemeID] = append(rulesByScheme[r.SchemeID], r)
	}

	allBenefits, _ := s.schemesRepo.ListAllBenefitsSummary(ctx)
	benefitsByScheme := make(map[int32][]string)
	for _, b := range allBenefits {
		benefitsByScheme[b.SchemeID] = append(benefitsByScheme[b.SchemeID], b.Title)
	}

	var eligible []dto.SchemeExplanation
	var nearlyEligible []dto.SchemeExplanation
	var ineligible []dto.SchemeExplanation

	for _, sc := range schemes {
		explanation := s.evaluateSchemeFast(sc, rulesByScheme[sc.ID], benefitsByScheme[sc.ID], profileCtx)

		switch explanation.Status {
		case "eligible":
			eligible = append(eligible, *explanation)
		case "nearly_eligible":
			nearlyEligible = append(nearlyEligible, *explanation)
		default:
			ineligible = append(ineligible, *explanation)
		}

		// Optionally persist decision record if user authenticated
		if userID != nil {
			snapshotBytes, _ := json.Marshal(req)
			var uID pgtype.Int4
			if userID != nil {
				uID = pgtype.Int4{Int32: *userID, Valid: true}
			}
			_, _ = s.queries.CreateEligibilityDecision(ctx, sqlc.CreateEligibilityDecisionParams{
				UserID:             uID,
				SchemeID:           pgtype.Int4{Int32: sc.ID, Valid: true},
				SchemeVersionID:    pgtype.Int4{Valid: false},
				SchemeSlug:         sc.Slug,
				ProfileSnapshot:    snapshotBytes,
				Decision:           explanation.Status,
				MatchPercentage:    explanation.MatchPercentage,
				MatchedRulesCount:  int32(explanation.CriteriaPassed),
				FailedRulesCount:   int32(explanation.CriteriaTotal - explanation.CriteriaPassed),
			})
		}
	}

	return &dto.EligibilityReportResponse{
		TotalEvaluated:        len(schemes),
		EligibleCount:         len(eligible),
		NearlyEligibleCount:   len(nearlyEligible),
		IneligibleCount:       len(ineligible),
		EligibleSchemes:       eligible,
		NearlyEligibleSchemes: nearlyEligible,
		IneligibleSchemes:     ineligible,
	}, nil
}

func (s *eligibilityService) ExplainScheme(ctx context.Context, schemeSlug string, req dto.EligibilityCheckRequest) (*dto.SchemeExplanation, error) {
	sc, err := s.schemesRepo.GetSchemeBySlug(ctx, schemeSlug)
	if err != nil {
		return nil, errors.NotFound(fmt.Sprintf("Scheme '%s' not found", schemeSlug))
	}

	profileCtx := engine.BuildProfileContext(req)
	return s.evaluateSingleScheme(ctx, sc, profileCtx)
}

func (s *eligibilityService) evaluateSingleScheme(ctx context.Context, sc sqlc.Scheme, profileCtx engine.ProfileContext) (*dto.SchemeExplanation, error) {
	rules, err := s.schemesRepo.GetEligibilityRulesBySchemeID(ctx, sc.ID)
	if err != nil {
		return nil, err
	}

	benefits, _ := s.schemesRepo.GetBenefitsBySchemeID(ctx, sc.ID)
	benefitTitles := make([]string, len(benefits))
	for i, b := range benefits {
		benefitTitles[i] = b.Title
	}

	return s.evaluateSchemeFast(sc, rules, benefitTitles, profileCtx), nil
}

func (s *eligibilityService) evaluateSchemeFast(sc sqlc.Scheme, rules []sqlc.EligibilityRule, benefitTitles []string, profileCtx engine.ProfileContext) *dto.SchemeExplanation {
	var passedCriteria []dto.CriterionVerdict
	var failedCriteria []dto.CriterionVerdict

	// 1. Check scheme jurisdiction / state
	if !strings.EqualFold(sc.State, "ALL_INDIA") {
		stateRule := sqlc.EligibilityRule{
			ID:        0,
			SchemeID:  sc.ID,
			FieldName: "state",
			Operator:  "eq",
			RuleValue: sc.State,
		}
		passed, verdict := engine.EvaluateRule(stateRule, profileCtx)
		if passed {
			passedCriteria = append(passedCriteria, verdict)
		} else {
			failedCriteria = append(failedCriteria, verdict)
		}
	}

	// 2. Evaluate each rule
	for _, r := range rules {
		passed, verdict := engine.EvaluateRule(r, profileCtx)
		if passed {
			passedCriteria = append(passedCriteria, verdict)
		} else {
			failedCriteria = append(failedCriteria, verdict)
		}
	}

	totalRules := len(passedCriteria) + len(failedCriteria)
	passedCount := len(passedCriteria)

	var isEligible bool
	var matchPercentage float64
	var statusCategory string
	var summaryReason string

	if totalRules == 0 {
		isEligible = true
		matchPercentage = 100.0
		statusCategory = "eligible"
		summaryReason = "This scheme has no restrictive criteria and is open to all citizens."
	} else {
		isEligible = len(failedCriteria) == 0
		matchPercentage = math.Round((float64(passedCount)/float64(totalRules))*1000) / 10

		if isEligible {
			statusCategory = "eligible"
			summaryReason = fmt.Sprintf("You meet all %d eligibility criteria for this scheme.", totalRules)
		} else if matchPercentage >= 50.0 {
			statusCategory = "nearly_eligible"
			var reasons []string
			for _, f := range failedCriteria {
				reasons = append(reasons, f.Reason)
			}
			summaryReason = fmt.Sprintf("Nearly eligible (%d/%d criteria met). Unmet: %s", passedCount, totalRules, strings.Join(reasons, "; "))
		} else {
			statusCategory = "ineligible"
			var reasons []string
			for _, f := range failedCriteria {
				reasons = append(reasons, f.Reason)
			}
			summaryReason = fmt.Sprintf("Ineligible (%d/%d criteria met). %s", passedCount, totalRules, strings.Join(reasons, "; "))
		}
	}

	var appURL *string
	if sc.ApplicationUrl.Valid {
		appURL = &sc.ApplicationUrl.String
	}

	return &dto.SchemeExplanation{
		SchemeID:         sc.ID,
		SchemeName:       sc.Name,
		SchemeSlug:       sc.Slug,
		State:            sc.State,
		Ministry:         sc.Ministry,
		Description:      sc.Description,
		Status:           statusCategory,
		IsEligible:       isEligible,
		MatchPercentage:  matchPercentage,
		CriteriaPassed:   passedCount,
		CriteriaTotal:    totalRules,
		SummaryReason:    summaryReason,
		PassedCriteria:   passedCriteria,
		FailedCriteria:   failedCriteria,
		BenefitsSummary:  benefitTitles,
		ApplicationURL:   appURL,
	}
}
