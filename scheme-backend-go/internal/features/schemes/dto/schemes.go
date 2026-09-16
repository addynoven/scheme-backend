package dto

import "time"

type BenefitDTO struct {
	ID          int32  `json:"id"`
	SchemeID    int32  `json:"scheme_id"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

type EligibilityRuleDTO struct {
	ID         int32  `json:"id"`
	SchemeID   int32  `json:"scheme_id"`
	FieldName  string `json:"field_name"`
	Operator   string `json:"operator"`
	RuleValue  string `json:"rule_value"`
}

type RequiredDocumentDTO struct {
	ID           int32   `json:"id"`
	SchemeID     int32   `json:"scheme_id"`
	DocumentName string  `json:"document_name"`
	IsMandatory  bool    `json:"is_mandatory"`
	Description  *string `json:"description,omitempty"`
}

type OfficialSourceDTO struct {
	ID         int32  `json:"id"`
	SchemeID   int32  `json:"scheme_id"`
	Title      string `json:"title"`
	URL        string `json:"url"`
	SourceType string `json:"source_type"`
}

type SchemeDetailResponse struct {
	ID                int32                 `json:"id"`
	Name              string                `json:"name"`
	Slug              string                `json:"slug"`
	State             string                `json:"state"`
	Category          string                `json:"category"`
	Tags              *string               `json:"tags,omitempty"`
	Ministry          string                `json:"ministry"`
	Description       string                `json:"description"`
	Status            string                `json:"status"`
	PublicationState  string                `json:"publication_state"`
	SourceFreshness   string                `json:"source_freshness"`
	ApplicationURL    *string               `json:"application_url,omitempty"`
	OfficialWebsite   *string               `json:"official_website,omitempty"`
	LaunchDate        *string               `json:"launch_date,omitempty"`
	CreatedAt         time.Time             `json:"created_at"`
	UpdatedAt         time.Time             `json:"updated_at"`
	Benefits          []BenefitDTO          `json:"benefits"`
	EligibilityRules  []EligibilityRuleDTO  `json:"eligibility_rules"`
	RequiredDocuments []RequiredDocumentDTO `json:"required_documents"`
	OfficialSources   []OfficialSourceDTO   `json:"official_sources"`
}

type PaginatedSchemesResponse struct {
	Items []SchemeDetailResponse `json:"items"`
	Total int                    `json:"total"`
	Skip  int                    `json:"skip"`
	Limit int                    `json:"limit"`
}

type CategoryItem struct {
	Category string `json:"category"`
	Count    int    `json:"count"`
}

type CategoryListResponse struct {
	Categories []CategoryItem `json:"categories"`
}
