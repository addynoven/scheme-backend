from datetime import date
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.eligibility_rule import EligibilityRule
from app.models.profile import Profile
from app.models.scheme import Scheme
from app.schemas.eligibility import (
    CriterionVerdict,
    EligibilityReportResponse,
    SchemeExplanation,
)


def calculate_age(birth_date: date) -> int:
    today = date.today()
    return (
        today.year
        - birth_date.year
        - ((today.month, today.day) < (birth_date.month, birth_date.day))
    )


def _to_comparable_number(val: Any) -> float | None:
    if isinstance(val, bool):
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def _normalize_boolean(val: Any) -> bool | None:
    if isinstance(val, bool):
        return val
    if isinstance(val, (int, float)):
        if val == 1:
            return True
        if val == 0:
            return False
    s = str(val).strip().lower()
    if s in ("true", "yes", "1", "y", "t"):
        return True
    if s in ("false", "no", "0", "n", "f"):
        return False
    return None


def evaluate_rule(rule: EligibilityRule, profile_context: dict[str, Any]) -> bool:
    field = rule.field_name.lower().strip()
    op = rule.operator.lower().strip()
    target = rule.rule_value.strip()

    if field not in profile_context:
        return False

    actual = profile_context[field]
    if actual is None:
        return False

    # Boolean normalization & comparison
    actual_bool = _normalize_boolean(actual)
    target_bool = _normalize_boolean(target)
    if actual_bool is not None and target_bool is not None:
        if op in ("eq", "=="):
            return actual_bool == target_bool
        if op in ("neq", "!="):
            return actual_bool != target_bool

    # Numeric comparisons
    actual_num = _to_comparable_number(actual)
    target_num = _to_comparable_number(target)

    if op == "between":
        clean_target = target.replace("to", "-").replace(",", "-")
        parts = clean_target.split("-")
        if len(parts) == 2:
            low = _to_comparable_number(parts[0].strip())
            high = _to_comparable_number(parts[1].strip())
            if actual_num is not None and low is not None and high is not None:
                return low <= actual_num <= high

    if actual_num is not None and target_num is not None:
        if op in ("eq", "=="):
            return actual_num == target_num
        if op in ("neq", "!="):
            return actual_num != target_num
        if op in ("gt", ">"):
            return actual_num > target_num
        if op in ("gte", ">="):
            return actual_num >= target_num
        if op in ("lt", "<"):
            return actual_num < target_num
        if op in ("lte", "<="):
            return actual_num <= target_num

    # String / collection comparisons
    actual_str = str(actual).strip().lower()
    target_str = target.lower()

    if op in ("eq", "=="):
        return actual_str == target_str or target_str in ("all", "all_india", "all india")
    if op in ("neq", "!="):
        return actual_str != target_str
    if op == "in":
        allowed = [x.strip().lower() for x in target.split(",")]
        return actual_str in allowed or "all" in allowed or "all_india" in allowed
    if op in ("not_in", "nin"):
        disallowed = [x.strip().lower() for x in target.split(",")]
        return actual_str not in disallowed
    if op == "contains":
        return target_str in actual_str

    return False


def build_profile_context(profile: Profile) -> dict[str, Any]:
    return {
        "full_name": profile.full_name,
        "date_of_birth": profile.date_of_birth,
        "age": calculate_age(profile.date_of_birth),
        "gender": profile.gender,
        "state": profile.state,
        "district": profile.district,
        "annual_income": profile.annual_income,
        "occupation": profile.occupation,
    }


def _get_criterion_title(field: str) -> str:
    titles = {
        "annual_income": "Annual Family Income",
        "income": "Annual Family Income",
        "age": "Age Requirement",
        "gender": "Gender Requirement",
        "occupation": "Occupation / Livelihood",
        "state": "State Residency",
        "district": "District Residency",
        "is_bpl": "Below Poverty Line (BPL)",
    }
    return titles.get(field.lower().strip(), field.replace("_", " ").title())


def _format_value(field: str, val: Any) -> str:
    if val is None:
        return "Not Provided"
    field_lower = field.lower().strip()
    if "income" in field_lower:
        num = _to_comparable_number(val)
        if num is not None:
            return f"₹{int(num):,}"
    if field_lower == "age":
        return f"{val} years old"
    if isinstance(val, str):
        return val.strip().title()
    return str(val)


def _build_required_condition(rule: EligibilityRule) -> str:
    field = rule.field_name.lower().strip()
    op = rule.operator.lower().strip()
    target = rule.rule_value.strip()

    if "income" in field:
        num = _to_comparable_number(target)
        val_str = f"₹{int(num):,}" if num is not None else target
        if op in ("lte", "<="):
            return f"Maximum {val_str} per year"
        if op in ("lt", "<"):
            return f"Less than {val_str} per year"
        if op in ("gte", ">="):
            return f"Minimum {val_str} per year"
        if op in ("gt", ">"):
            return f"More than {val_str} per year"

    if field == "age":
        if op == "between":
            parts = target.replace("to", "-").replace(",", "-").split("-")
            if len(parts) == 2:
                return f"Between {parts[0].strip()} and {parts[1].strip()} years"
        if op in ("lte", "<="):
            return f"Maximum {target} years old"
        if op in ("gte", ">="):
            return f"Minimum {target} years old"

    if op == "in":
        formatted = ", ".join(x.strip().title() for x in target.split(","))
        return f"Must be one of: {formatted}"

    if op in ("eq", "=="):
        if target.lower() in ("all", "all_india", "all india"):
            return "Open to all residents across India"
        return f"Must be {target.title()}"

    return f"{op.upper()} {target}"


def explain_rule_verdict(
    rule: EligibilityRule, profile_context: dict[str, Any]
) -> CriterionVerdict:
    field = rule.field_name.lower().strip()
    title = _get_criterion_title(field)
    req_cond = _build_required_condition(rule)

    if field not in profile_context or profile_context[field] is None:
        return CriterionVerdict(
            field=field,
            criterion_title=title,
            status="missing_info",
            your_value="Not Provided",
            required_condition=req_cond,
            reason=f"Information for '{title}' was not provided in your profile.",
        )

    actual = profile_context[field]
    your_val_str = _format_value(field, actual)
    passed = evaluate_rule(rule, profile_context)

    actual_num = _to_comparable_number(actual)
    target_num = _to_comparable_number(rule.rule_value)

    if passed:
        if "income" in field and actual_num is not None and target_num is not None:
            reason = f"Your annual income ({your_val_str}) is within the allowable limit ({req_cond})."
        elif field == "age":
            reason = f"Your age ({actual}) satisfies the requirement ({req_cond})."
        elif field == "occupation":
            reason = f"Your occupation ({your_val_str}) matches the required criteria."
        elif field == "gender":
            reason = f"Your gender ({your_val_str}) meets the scheme criteria."
        elif field == "state":
            reason = f"Your state of residence ({your_val_str}) meets the state residency criteria ({req_cond})."
        else:
            reason = f"Your {title} ({your_val_str}) meets the requirement ({req_cond})."
        status_str = "passed"
    else:
        status_str = "failed"
        if "income" in field and actual_num is not None and target_num is not None:
            if rule.operator in ("lte", "<="):
                reason = f"Your annual income of {your_val_str} exceeds the maximum allowable limit of ₹{int(target_num):,}."
            else:
                reason = f"Your annual income of {your_val_str} does not meet the income criteria ({req_cond})."
        elif field == "age":
            if rule.operator == "between":
                reason = f"Your age ({actual}) is outside the required range ({req_cond})."
            elif rule.operator in ("lte", "<="):
                reason = f"Your age ({actual}) exceeds the maximum eligible age ({rule.rule_value} years)."
            elif rule.operator in ("gte", ">="):
                reason = f"Your age ({actual}) is below the minimum required age ({rule.rule_value} years)."
            else:
                reason = f"Your age ({actual}) does not satisfy {req_cond}."
        elif field == "occupation":
            reason = f"Your occupation ({your_val_str}) is not eligible for this scheme ({req_cond})."
        elif field == "gender":
            reason = f"This scheme is exclusively for {rule.rule_value.title()} applicants."
        elif field == "state":
            reason = f"This scheme is exclusively for residents of {rule.rule_value.title()} (your state: {your_val_str})."
        else:
            reason = f"Your {title} ({your_val_str}) does not meet the requirement ({req_cond})."

    return CriterionVerdict(
        field=field,
        criterion_title=title,
        status=status_str,
        your_value=your_val_str,
        required_condition=req_cond,
        reason=reason,
    )


def explain_scheme_eligibility(
    scheme: Scheme, profile_context: dict[str, Any]
) -> SchemeExplanation:
    rules = scheme.eligibility_rules or []
    passed_criteria: list[CriterionVerdict] = []
    failed_criteria: list[CriterionVerdict] = []

    for rule in rules:
        verdict = explain_rule_verdict(rule, profile_context)
        if verdict.status == "passed":
            passed_criteria.append(verdict)
        else:
            failed_criteria.append(verdict)

    total_rules = len(rules)
    passed_count = len(passed_criteria)

    if total_rules == 0:
        is_eligible = True
        match_percentage = 100.0
        status_category = "eligible"
        summary_reason = "This scheme has no restrictive criteria and is open to all citizens."
    else:
        is_eligible = len(failed_criteria) == 0
        match_percentage = round((passed_count / total_rules) * 100.0, 1)

        if is_eligible:
            status_category = "eligible"
            summary_reason = f"You meet all {total_rules} eligibility criteria for this scheme."
        elif match_percentage >= 50.0:
            status_category = "nearly_eligible"
            failed_reasons = "; ".join(c.reason for c in failed_criteria)
            summary_reason = f"Nearly eligible ({passed_count}/{total_rules} criteria met). Unmet criteria: {failed_reasons}"
        else:
            status_category = "ineligible"
            failed_reasons = "; ".join(c.reason for c in failed_criteria)
            summary_reason = f"Ineligible ({passed_count}/{total_rules} criteria met). {failed_reasons}"

    benefits_summary = [b.title for b in (scheme.benefits or [])]

    return SchemeExplanation(
        scheme_id=scheme.id,
        scheme_name=scheme.name,
        scheme_slug=scheme.slug,
        ministry=scheme.ministry,
        description=scheme.description,
        status=status_category,
        is_eligible=is_eligible,
        match_percentage=match_percentage,
        criteria_passed=passed_count,
        criteria_total=total_rules,
        summary_reason=summary_reason,
        passed_criteria=passed_criteria,
        failed_criteria=failed_criteria,
        benefits_summary=benefits_summary,
        application_url=scheme.application_url,
    )


def generate_eligibility_report(
    db: Session, profile_context: dict[str, Any]
) -> EligibilityReportResponse:
    stmt = (
        select(Scheme)
        .where(Scheme.status == "active")
        .options(
            selectinload(Scheme.benefits),
            selectinload(Scheme.eligibility_rules),
            selectinload(Scheme.required_documents),
            selectinload(Scheme.official_sources),
        )
    )
    schemes = list(db.scalars(stmt).all())

    eligible: list[SchemeExplanation] = []
    nearly_eligible: list[SchemeExplanation] = []
    ineligible: list[SchemeExplanation] = []

    for scheme in schemes:
        explanation = explain_scheme_eligibility(scheme, profile_context)
        if explanation.status == "eligible":
            eligible.append(explanation)
        elif explanation.status == "nearly_eligible":
            nearly_eligible.append(explanation)
        else:
            ineligible.append(explanation)

    eligible_count = len(eligible)
    nearly_eligible_count = len(nearly_eligible)
    ineligible_count = len(ineligible)

    # Sort nearly eligible by match percentage descending
    nearly_eligible.sort(key=lambda x: x.match_percentage, reverse=True)

    return EligibilityReportResponse(
        total_evaluated=len(schemes),
        eligible_count=eligible_count,
        nearly_eligible_count=nearly_eligible_count,
        ineligible_count=ineligible_count,
        eligible_schemes=eligible[:150],
        nearly_eligible_schemes=nearly_eligible[:60],
        ineligible_schemes=ineligible[:20],
    )


def check_scheme_eligibility(
    scheme: Scheme, profile_context: dict[str, Any]
) -> bool:
    if not scheme.eligibility_rules:
        return True

    return all(
        evaluate_rule(rule, profile_context)
        for rule in scheme.eligibility_rules
    )


def match_schemes_for_context(
    db: Session, profile_context: dict[str, Any]
) -> list[Scheme]:
    stmt = (
        select(Scheme)
        .where(Scheme.status == "active")
        .options(
            selectinload(Scheme.benefits),
            selectinload(Scheme.eligibility_rules),
            selectinload(Scheme.required_documents),
            selectinload(Scheme.official_sources),
        )
    )
    active_schemes = db.scalars(stmt).all()

    return [
        scheme
        for scheme in active_schemes
        if check_scheme_eligibility(scheme, profile_context)
    ]


def match_schemes_for_profile(db: Session, profile: Profile) -> list[Scheme]:
    context = build_profile_context(profile)
    return match_schemes_for_context(db, context)
