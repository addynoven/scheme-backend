package dto

type EligibilityCheckRequest struct {
	DateOfBirth        *string `json:"date_of_birth,omitempty"` // YYYY-MM-DD
	Age                *int    `json:"age,omitempty"`
	Gender             *string `json:"gender,omitempty"`
	State              *string `json:"state,omitempty"`
	District           *string `json:"district,omitempty"`
	AnnualIncome       *int32  `json:"annual_income,omitempty"`
	Occupation         *string `json:"occupation,omitempty"`
	CasteCategory      *string `json:"caste_category,omitempty"`
	IsDifferentlyAbled *bool   `json:"is_differently_abled,omitempty"`
	MaritalStatus      *string `json:"marital_status,omitempty"`
	ResidenceArea      *string `json:"residence_area,omitempty"`
	HasLand            *bool   `json:"has_land,omitempty"`
}

type CriterionVerdict struct {
	Field             string `json:"field"`
	CriterionTitle    string `json:"criterion_title"`
	Status            string `json:"status"` // "passed" | "failed" | "missing_info"
	YourValue         string `json:"your_value"`
	RequiredCondition string `json:"required_condition"`
	Reason            string `json:"reason"`
}

type SchemeExplanation struct {
	SchemeID         int32              `json:"scheme_id"`
	SchemeName       string             `json:"scheme_name"`
	SchemeSlug       string             `json:"scheme_slug"`
	State            string             `json:"state"`
	Ministry         string             `json:"ministry"`
	Description      string             `json:"description"`
	Status           string             `json:"status"` // "eligible" | "nearly_eligible" | "ineligible"
	IsEligible       bool               `json:"is_eligible"`
	MatchPercentage  float64            `json:"match_percentage"`
	CriteriaPassed   int                `json:"criteria_passed"`
	CriteriaTotal    int                `json:"criteria_total"`
	SummaryReason    string             `json:"summary_reason"`
	PassedCriteria   []CriterionVerdict `json:"passed_criteria"`
	FailedCriteria   []CriterionVerdict `json:"failed_criteria"`
	BenefitsSummary  []string           `json:"benefits_summary"`
	ApplicationURL   *string            `json:"application_url,omitempty"`
}

type EligibilityReportResponse struct {
	TotalEvaluated        int                 `json:"total_evaluated"`
	EligibleCount         int                 `json:"eligible_count"`
	NearlyEligibleCount   int                 `json:"nearly_eligible_count"`
	IneligibleCount       int                 `json:"ineligible_count"`
	EligibleSchemes       []SchemeExplanation `json:"eligible_schemes"`
	NearlyEligibleSchemes []SchemeExplanation `json:"nearly_eligible_schemes"`
	IneligibleSchemes     []SchemeExplanation `json:"ineligible_schemes"`
}
