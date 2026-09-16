package service

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
	"scheme-backend-go/gen/sqlc"
	"scheme-backend-go/internal/features/schemes/dto"
	"scheme-backend-go/internal/features/schemes/repository"
	"scheme-backend-go/internal/pkg/errors"
)

type SchemesService interface {
	ListSchemes(ctx context.Context, skip, limit int, category, state, search string) (*dto.PaginatedSchemesResponse, error)
	GetSchemeBySlug(ctx context.Context, slug string) (*dto.SchemeDetailResponse, error)
	GetSchemeByID(ctx context.Context, id int32) (*dto.SchemeDetailResponse, error)
	ListCategories(ctx context.Context) (*dto.CategoryListResponse, error)
	ListStates(ctx context.Context) ([]string, error)
}

type schemesService struct {
	repo  repository.SchemesRepository
	redis *redis.Client
}

func NewSchemesService(repo repository.SchemesRepository, rdb *redis.Client) SchemesService {
	return &schemesService{
		repo:  repo,
		redis: rdb,
	}
}

func (s *schemesService) ListSchemes(ctx context.Context, skip, limit int, category, state, search string) (*dto.PaginatedSchemesResponse, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	cacheKey := fmt.Sprintf("schemes:list:%d:%d:%s:%s:%s", skip, limit, category, state, search)
	if s.redis != nil {
		if val, err := s.redis.Get(ctx, cacheKey).Result(); err == nil {
			var cached dto.PaginatedSchemesResponse
			if err := json.Unmarshal([]byte(val), &cached); err == nil {
				return &cached, nil
			}
		}
	}

	schemes, err := s.repo.ListPublishedSchemes(ctx)
	if err != nil {
		return nil, errors.Internal(fmt.Sprintf("Failed to list schemes: %v", err))
	}

	// Filter in memory for maximum flexibility (category, state, search)
	var filtered []sqlc.Scheme
	searchLower := strings.ToLower(search)
	categoryLower := strings.ToLower(category)
	stateLower := strings.ToLower(state)

	for _, sc := range schemes {
		if category != "" && !strings.EqualFold(sc.Category, categoryLower) {
			continue
		}
		if state != "" && !strings.EqualFold(sc.State, "ALL_INDIA") && !strings.EqualFold(sc.State, stateLower) {
			continue
		}
		if search != "" {
			match := strings.Contains(strings.ToLower(sc.Name), searchLower) ||
				strings.Contains(strings.ToLower(sc.Description), searchLower) ||
				strings.Contains(strings.ToLower(sc.Ministry), searchLower)
			if !match {
				continue
			}
		}
		filtered = append(filtered, sc)
	}

	total := len(filtered)
	start := skip
	if start > total {
		start = total
	}
	end := start + limit
	if end > total {
		end = total
	}

	paged := filtered[start:end]
	items := make([]dto.SchemeDetailResponse, 0, len(paged))
	for _, sc := range paged {
		detail, err := s.enrichScheme(ctx, sc)
		if err == nil {
			items = append(items, *detail)
		}
	}

	resp := &dto.PaginatedSchemesResponse{
		Items: items,
		Total: total,
		Skip:  skip,
		Limit: limit,
	}

	if s.redis != nil {
		if data, err := json.Marshal(resp); err == nil {
			_ = s.redis.Set(ctx, cacheKey, data, 5*time.Minute).Err()
		}
	}

	return resp, nil
}

func (s *schemesService) GetSchemeBySlug(ctx context.Context, slug string) (*dto.SchemeDetailResponse, error) {
	cacheKey := fmt.Sprintf("schemes:slug:%s", slug)
	if s.redis != nil {
		if val, err := s.redis.Get(ctx, cacheKey).Result(); err == nil {
			var cached dto.SchemeDetailResponse
			if err := json.Unmarshal([]byte(val), &cached); err == nil {
				return &cached, nil
			}
		}
	}

	sc, err := s.repo.GetSchemeBySlug(ctx, slug)
	if err != nil {
		return nil, errors.NotFound(fmt.Sprintf("Scheme '%s' not found", slug))
	}

	detail, err := s.enrichScheme(ctx, sc)
	if err != nil {
		return nil, errors.Internal(fmt.Sprintf("Failed to load scheme details: %v", err))
	}

	if s.redis != nil {
		if data, err := json.Marshal(detail); err == nil {
			_ = s.redis.Set(ctx, cacheKey, data, 10*time.Minute).Err()
		}
	}

	return detail, nil
}

func (s *schemesService) GetSchemeByID(ctx context.Context, id int32) (*dto.SchemeDetailResponse, error) {
	sc, err := s.repo.GetSchemeByID(ctx, id)
	if err != nil {
		return nil, errors.NotFound(fmt.Sprintf("Scheme ID %d not found", id))
	}
	return s.enrichScheme(ctx, sc)
}

func (s *schemesService) ListCategories(ctx context.Context) (*dto.CategoryListResponse, error) {
	categories, err := s.repo.ListCategories(ctx)
	if err != nil {
		return nil, errors.Internal("Failed to list categories")
	}

	items := make([]dto.CategoryItem, len(categories))
	for i, c := range categories {
		items[i] = dto.CategoryItem{
			Category: c,
			Count:    1, // Default count
		}
	}

	return &dto.CategoryListResponse{Categories: items}, nil
}

func (s *schemesService) ListStates(ctx context.Context) ([]string, error) {
	return s.repo.ListStates(ctx)
}

func (s *schemesService) enrichScheme(ctx context.Context, sc sqlc.Scheme) (*dto.SchemeDetailResponse, error) {
	benefits, _ := s.repo.GetBenefitsBySchemeID(ctx, sc.ID)
	rules, _ := s.repo.GetEligibilityRulesBySchemeID(ctx, sc.ID)
	docs, _ := s.repo.GetRequiredDocumentsBySchemeID(ctx, sc.ID)
	sources, _ := s.repo.GetOfficialSourcesBySchemeID(ctx, sc.ID)

	bDTOs := make([]dto.BenefitDTO, len(benefits))
	for i, b := range benefits {
		bDTOs[i] = dto.BenefitDTO{
			ID:          b.ID,
			SchemeID:    b.SchemeID,
			Title:       b.Title,
			Description: b.Description,
		}
	}

	rDTOs := make([]dto.EligibilityRuleDTO, len(rules))
	for i, r := range rules {
		rDTOs[i] = dto.EligibilityRuleDTO{
			ID:        r.ID,
			SchemeID:  r.SchemeID,
			FieldName: r.FieldName,
			Operator:  r.Operator,
			RuleValue: r.RuleValue,
		}
	}

	dDTOs := make([]dto.RequiredDocumentDTO, len(docs))
	for i, d := range docs {
		var desc *string
		if d.Description.Valid {
			desc = &d.Description.String
		}
		dDTOs[i] = dto.RequiredDocumentDTO{
			ID:           d.ID,
			SchemeID:     d.SchemeID,
			DocumentName: d.DocumentName,
			IsMandatory:  d.IsMandatory,
			Description:  desc,
		}
	}

	sDTOs := make([]dto.OfficialSourceDTO, len(sources))
	for i, src := range sources {
		sDTOs[i] = dto.OfficialSourceDTO{
			ID:         src.ID,
			SchemeID:   src.SchemeID,
			Title:      src.Title,
			URL:        src.Url,
			SourceType: src.SourceType,
		}
	}

	var tags *string
	if sc.Tags.Valid {
		tags = &sc.Tags.String
	}
	var appURL *string
	if sc.ApplicationUrl.Valid {
		appURL = &sc.ApplicationUrl.String
	}
	var website *string
	if sc.OfficialWebsite.Valid {
		website = &sc.OfficialWebsite.String
	}
	var launchDate *string
	if sc.LaunchDate.Valid {
		s := sc.LaunchDate.Time.Format("2006-01-02")
		launchDate = &s
	}

	return &dto.SchemeDetailResponse{
		ID:                sc.ID,
		Name:              sc.Name,
		Slug:              sc.Slug,
		State:             sc.State,
		Category:          sc.Category,
		Tags:              tags,
		Ministry:          sc.Ministry,
		Description:       sc.Description,
		Status:            sc.Status,
		PublicationState:  sc.PublicationState,
		SourceFreshness:   sc.SourceFreshness,
		ApplicationURL:    appURL,
		OfficialWebsite:   website,
		LaunchDate:        launchDate,
		CreatedAt:         sc.CreatedAt.Time,
		UpdatedAt:         sc.UpdatedAt.Time,
		Benefits:          bDTOs,
		EligibilityRules:  rDTOs,
		RequiredDocuments: dDTOs,
		OfficialSources:   sDTOs,
	}, nil
}
