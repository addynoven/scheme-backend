package engine

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"scheme-backend-go/gen/sqlc"
	"scheme-backend-go/internal/features/eligibility/dto"
)

type ProfileContext struct {
	Age                *int
	DateOfBirth        *time.Time
	Gender             *string
	State              *string
	District           *string
	AnnualIncome       *int32
	Occupation         *string
	CasteCategory      *string
	IsDifferentlyAbled *bool
	MaritalStatus      *string
	ResidenceArea      *string
	HasLand            *bool
}

func BuildProfileContext(req dto.EligibilityCheckRequest) ProfileContext {
	ctx := ProfileContext{
		Age:                req.Age,
		Gender:             req.Gender,
		State:              req.State,
		District:           req.District,
		AnnualIncome:       req.AnnualIncome,
		Occupation:         req.Occupation,
		CasteCategory:      req.CasteCategory,
		IsDifferentlyAbled: req.IsDifferentlyAbled,
		MaritalStatus:      req.MaritalStatus,
		ResidenceArea:      req.ResidenceArea,
		HasLand:            req.HasLand,
	}

	if req.DateOfBirth != nil && *req.DateOfBirth != "" {
		if dob, err := time.Parse("2006-01-02", *req.DateOfBirth); err == nil {
			ctx.DateOfBirth = &dob
			if ctx.Age == nil {
				age := CalculateAge(dob)
				ctx.Age = &age
			}
		}
	}

	return ctx
}

func CalculateAge(dob time.Time) int {
	now := time.Now()
	years := now.Year() - dob.Year()
	if now.YearDay() < dob.YearDay() {
		years--
	}
	return years
}

func EvaluateRule(rule sqlc.EligibilityRule, ctx ProfileContext) (bool, dto.CriterionVerdict) {
	field := strings.ToLower(strings.TrimSpace(rule.FieldName))
	op := strings.ToLower(strings.TrimSpace(rule.Operator))
	target := strings.TrimSpace(rule.RuleValue)
	title := getCriterionTitle(field)
	requiredCond := buildRequiredCondition(field, op, target)

	actualValStr, isMissing, passed, reason := evaluateField(field, op, target, requiredCond, ctx)

	status := "failed"
	if isMissing {
		status = "missing_info"
	} else if passed {
		status = "passed"
	}

	verdict := dto.CriterionVerdict{
		Field:             field,
		CriterionTitle:    title,
		Status:            status,
		YourValue:         actualValStr,
		RequiredCondition: requiredCond,
		Reason:            reason,
	}

	return passed, verdict
}

func evaluateField(field, op, target, requiredCond string, ctx ProfileContext) (valStr string, isMissing bool, passed bool, reason string) {
	switch field {
	case "annual_income", "income":
		if ctx.AnnualIncome == nil {
			return "Not Provided", true, false, "Annual income was not provided in your profile."
		}
		val := float64(*ctx.AnnualIncome)
		valStr = fmt.Sprintf("₹%d", *ctx.AnnualIncome)
		targetNum, err := strconv.ParseFloat(target, 64)
		if err != nil {
			return valStr, false, false, "Invalid target condition in rule."
		}
		passed = compareNumbers(val, targetNum, op)
		if passed {
			reason = fmt.Sprintf("Your annual income (%s) is within the allowable limit (%s).", valStr, requiredCond)
		} else {
			reason = fmt.Sprintf("Your annual income of %s exceeds the maximum allowable limit of ₹%d.", valStr, int64(targetNum))
		}
		return

	case "age":
		if ctx.Age == nil {
			return "Not Provided", true, false, "Age was not provided in your profile."
		}
		val := float64(*ctx.Age)
		valStr = fmt.Sprintf("%d years old", *ctx.Age)

		if op == "between" {
			clean := strings.ReplaceAll(strings.ReplaceAll(target, "to", "-"), ",", "-")
			parts := strings.Split(clean, "-")
			if len(parts) == 2 {
				low, err1 := strconv.ParseFloat(strings.TrimSpace(parts[0]), 64)
				high, err2 := strconv.ParseFloat(strings.TrimSpace(parts[1]), 64)
				if err1 == nil && err2 == nil {
					passed = val >= low && val <= high
					if passed {
						reason = fmt.Sprintf("Your age (%s) satisfies the requirement (%s).", valStr, requiredCond)
					} else {
						reason = fmt.Sprintf("Your age (%s) is outside the required range (%s).", valStr, requiredCond)
					}
					return
				}
			}
		}

		targetNum, err := strconv.ParseFloat(target, 64)
		if err != nil {
			return valStr, false, false, "Invalid target condition in rule."
		}
		passed = compareNumbers(val, targetNum, op)
		if passed {
			reason = fmt.Sprintf("Your age (%s) satisfies the requirement (%s).", valStr, requiredCond)
		} else {
			reason = fmt.Sprintf("Your age (%s) does not meet the requirement (%s).", valStr, requiredCond)
		}
		return

	case "gender":
		if ctx.Gender == nil || *ctx.Gender == "" {
			return "Not Provided", true, false, "Gender was not provided in your profile."
		}
		valStr = strings.Title(strings.ToLower(*ctx.Gender))
		passed = matchString(strings.ToLower(*ctx.Gender), op, strings.ToLower(target))
		if passed {
			reason = fmt.Sprintf("Your gender (%s) meets the scheme criteria.", valStr)
		} else {
			reason = fmt.Sprintf("This scheme is exclusively for %s applicants.", strings.Title(target))
		}
		return

	case "state":
		if ctx.State == nil || *ctx.State == "" {
			return "Not Provided", true, false, "State was not provided in your profile."
		}
		valStr = strings.Title(strings.ToLower(*ctx.State))
		passed = matchString(strings.ToLower(*ctx.State), op, strings.ToLower(target))
		if passed {
			reason = fmt.Sprintf("Your state of residence (%s) meets the residency criteria (%s).", valStr, requiredCond)
		} else {
			reason = fmt.Sprintf("This scheme is exclusively for residents of %s (your state: %s).", strings.Title(target), valStr)
		}
		return

	case "occupation":
		if ctx.Occupation == nil || *ctx.Occupation == "" {
			return "Not Provided", true, false, "Occupation was not provided in your profile."
		}
		valStr = strings.Title(strings.ToLower(*ctx.Occupation))
		passed = matchString(strings.ToLower(*ctx.Occupation), op, strings.ToLower(target))
		if passed {
			reason = fmt.Sprintf("Your occupation (%s) matches the required criteria.", valStr)
		} else {
			reason = fmt.Sprintf("Your occupation (%s) is not eligible for this scheme (%s).", valStr, requiredCond)
		}
		return

	case "caste_category", "caste":
		if ctx.CasteCategory == nil || *ctx.CasteCategory == "" {
			return "Not Provided", true, false, "Caste category was not provided."
		}
		valStr = *ctx.CasteCategory
		passed = matchString(strings.ToLower(*ctx.CasteCategory), op, strings.ToLower(target))
		if passed {
			reason = fmt.Sprintf("Your caste category (%s) meets the required criteria.", valStr)
		} else {
			reason = fmt.Sprintf("This scheme is for %s applicants (your category: %s).", target, valStr)
		}
		return

	case "has_land":
		if ctx.HasLand == nil {
			return "Not Provided", true, false, "Landholding status was not provided."
		}
		valStr = fmt.Sprintf("%v", *ctx.HasLand)
		targetBool := parseBool(target)
		passed = *ctx.HasLand == targetBool
		if passed {
			reason = "Your landholding status meets the scheme requirements."
		} else {
			reason = "Your landholding status does not meet the scheme requirements."
		}
		return

	case "is_differently_abled":
		if ctx.IsDifferentlyAbled == nil {
			return "Not Provided", true, false, "Disability status was not provided."
		}
		valStr = fmt.Sprintf("%v", *ctx.IsDifferentlyAbled)
		targetBool := parseBool(target)
		passed = *ctx.IsDifferentlyAbled == targetBool
		if passed {
			reason = "Your disability status meets the criteria."
		} else {
			reason = "Your disability status does not meet the criteria."
		}
		return

	default:
		return "Not Provided", true, false, fmt.Sprintf("Criterion '%s' not recognized.", field)
	}
}

func compareNumbers(val, target float64, op string) bool {
	switch op {
	case "eq", "==":
		return val == target
	case "neq", "!=":
		return val != target
	case "gt", ">":
		return val > target
	case "gte", ">=":
		return val >= target
	case "lt", "<":
		return val < target
	case "lte", "<=":
		return val <= target
	default:
		return false
	}
}

func matchString(actual, op, target string) bool {
	if target == "all" || target == "all_india" || target == "all india" {
		return true
	}

	switch op {
	case "eq", "==":
		return actual == target
	case "neq", "!=":
		return actual != target
	case "in":
		parts := strings.Split(target, ",")
		for _, p := range parts {
			clean := strings.TrimSpace(p)
			if clean == "all" || clean == "all_india" || clean == actual {
				return true
			}
		}
		return false
	case "not_in", "nin":
		parts := strings.Split(target, ",")
		for _, p := range parts {
			if strings.TrimSpace(p) == actual {
				return false
			}
		}
		return true
	case "contains":
		return strings.Contains(actual, target)
	default:
		return false
	}
}

func parseBool(s string) bool {
	s = strings.ToLower(strings.TrimSpace(s))
	return s == "true" || s == "yes" || s == "1" || s == "y" || s == "t"
}

func getCriterionTitle(field string) string {
	switch field {
	case "annual_income", "income":
		return "Annual Family Income"
	case "age":
		return "Age Requirement"
	case "gender":
		return "Gender Requirement"
	case "occupation":
		return "Occupation / Livelihood"
	case "state":
		return "State Residency"
	case "district":
		return "District Residency"
	case "caste_category", "caste":
		return "Caste Category"
	case "has_land":
		return "Landholding Requirement"
	case "is_differently_abled":
		return "Disability Status"
	default:
		return strings.Title(strings.ReplaceAll(field, "_", " "))
	}
}

func buildRequiredCondition(field, op, target string) string {
	if strings.Contains(field, "income") {
		if num, err := strconv.ParseInt(target, 10, 64); err == nil {
			valStr := fmt.Sprintf("₹%d", num)
			switch op {
			case "lte", "<=":
				return fmt.Sprintf("Maximum %s per year", valStr)
			case "lt", "<":
				return fmt.Sprintf("Less than %s per year", valStr)
			case "gte", ">=":
				return fmt.Sprintf("Minimum %s per year", valStr)
			case "gt", ">":
				return fmt.Sprintf("More than %s per year", valStr)
			}
		}
	}

	if field == "age" {
		if op == "between" {
			clean := strings.ReplaceAll(strings.ReplaceAll(target, "to", "-"), ",", "-")
			parts := strings.Split(clean, "-")
			if len(parts) == 2 {
				return fmt.Sprintf("Between %s and %s years", strings.TrimSpace(parts[0]), strings.TrimSpace(parts[1]))
			}
		}
		switch op {
		case "lte", "<=":
			return fmt.Sprintf("Maximum %s years old", target)
		case "gte", ">=":
			return fmt.Sprintf("Minimum %s years old", target)
		}
	}

	if op == "in" {
		parts := strings.Split(target, ",")
		var titles []string
		for _, p := range parts {
			titles = append(titles, strings.Title(strings.TrimSpace(p)))
		}
		return fmt.Sprintf("Must be one of: %s", strings.Join(titles, ", "))
	}

	if op == "eq" || op == "==" {
		if strings.ToLower(target) == "all" || strings.ToLower(target) == "all_india" {
			return "Open to all residents across India"
		}
		return fmt.Sprintf("Must be %s", strings.Title(target))
	}

	return fmt.Sprintf("%s %s", strings.ToUpper(op), target)
}
