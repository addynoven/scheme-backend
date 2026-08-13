
from app.modules.eligibility.schemas import (
    CriterionVerdict,
    EligibilityCheckRequest,
    EligibilityReportResponse,
    SchemeExplanation,
)
from app.modules.eligibility.service import (
    build_profile_context,
    calculate_age,
    check_scheme_eligibility,
    evaluate_rule,
    explain_rule_verdict,
    explain_scheme_eligibility,
    generate_eligibility_report,
    match_schemes_for_context,
    match_schemes_for_profile,
)

__all__ = [
    "eligibility_router",
    "EligibilityCheckRequest",
    "CriterionVerdict",
    "SchemeExplanation",
    "EligibilityReportResponse",
    "calculate_age",
    "evaluate_rule",
    "explain_rule_verdict",
    "explain_scheme_eligibility",
    "generate_eligibility_report",
    "check_scheme_eligibility",
    "match_schemes_for_context",
    "match_schemes_for_profile",
    "build_profile_context",
]
