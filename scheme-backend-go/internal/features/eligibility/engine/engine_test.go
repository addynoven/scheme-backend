package engine_test

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"scheme-backend-go/gen/sqlc"
	"scheme-backend-go/internal/features/eligibility/dto"
	"scheme-backend-go/internal/features/eligibility/engine"
)

func TestEvaluateRule_AnnualIncome(t *testing.T) {
	rule := sqlc.EligibilityRule{
		FieldName: "annual_income",
		Operator:  "lte",
		RuleValue: "200000",
	}

	// Case 1: Income <= 200,000 -> Passed
	income1 := int32(120000)
	ctx1 := engine.ProfileContext{AnnualIncome: &income1}
	passed, verdict := engine.EvaluateRule(rule, ctx1)
	assert.True(t, passed)
	assert.Equal(t, "passed", verdict.Status)
	assert.Contains(t, verdict.Reason, "within the allowable limit")

	// Case 2: Income > 200,000 -> Failed
	income2 := int32(250000)
	ctx2 := engine.ProfileContext{AnnualIncome: &income2}
	passed, verdict = engine.EvaluateRule(rule, ctx2)
	assert.False(t, passed)
	assert.Equal(t, "failed", verdict.Status)
	assert.Contains(t, verdict.Reason, "exceeds the maximum allowable limit")

	// Case 3: Missing income
	ctx3 := engine.ProfileContext{}
	passed, verdict = engine.EvaluateRule(rule, ctx3)
	assert.False(t, passed)
	assert.Equal(t, "missing_info", verdict.Status)
}

func TestEvaluateRule_AgeBetween(t *testing.T) {
	rule := sqlc.EligibilityRule{
		FieldName: "age",
		Operator:  "between",
		RuleValue: "18-40",
	}

	// Age 25 -> Passed
	age25 := 25
	ctx1 := engine.ProfileContext{Age: &age25}
	passed, verdict := engine.EvaluateRule(rule, ctx1)
	assert.True(t, passed)
	assert.Equal(t, "passed", verdict.Status)

	// Age 45 -> Failed
	age45 := 45
	ctx2 := engine.ProfileContext{Age: &age45}
	passed, verdict = engine.EvaluateRule(rule, ctx2)
	assert.False(t, passed)
	assert.Equal(t, "failed", verdict.Status)
}

func TestEvaluateRule_OccupationIn(t *testing.T) {
	rule := sqlc.EligibilityRule{
		FieldName: "occupation",
		Operator:  "in",
		RuleValue: "farmer,artisan,weaver",
	}

	// Farmer -> Passed
	occFarmer := "farmer"
	ctx1 := engine.ProfileContext{Occupation: &occFarmer}
	passed, verdict := engine.EvaluateRule(rule, ctx1)
	assert.True(t, passed)
	assert.Equal(t, "passed", verdict.Status)

	// Engineer -> Failed
	occEng := "engineer"
	ctx2 := engine.ProfileContext{Occupation: &occEng}
	passed, verdict = engine.EvaluateRule(rule, ctx2)
	assert.False(t, passed)
	assert.Equal(t, "failed", verdict.Status)
}

func TestEvaluateRule_BooleanLandholding(t *testing.T) {
	rule := sqlc.EligibilityRule{
		FieldName: "has_land",
		Operator:  "eq",
		RuleValue: "true",
	}

	hasLand := true
	ctx1 := engine.ProfileContext{HasLand: &hasLand}
	passed, verdict := engine.EvaluateRule(rule, ctx1)
	assert.True(t, passed)
	assert.Equal(t, "passed", verdict.Status)

	noLand := false
	ctx2 := engine.ProfileContext{HasLand: &noLand}
	passed, verdict = engine.EvaluateRule(rule, ctx2)
	assert.False(t, passed)
	assert.Equal(t, "failed", verdict.Status)
}

func TestBuildProfileContext_AgeFromDOB(t *testing.T) {
	dobStr := "1990-01-15"
	req := dto.EligibilityCheckRequest{
		DateOfBirth: &dobStr,
	}

	ctx := engine.BuildProfileContext(req)
	assert.NotNil(t, ctx.DateOfBirth)
	assert.NotNil(t, ctx.Age)
	assert.True(t, *ctx.Age >= 30)
}

func TestCalculateAge(t *testing.T) {
	dob := time.Now().AddDate(-25, 0, -10)
	age := engine.CalculateAge(dob)
	assert.Equal(t, 25, age)
}
