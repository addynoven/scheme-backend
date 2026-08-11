from datetime import date

from app.models.eligibility_rule import EligibilityRule
from app.services.eligibility import (
    calculate_age,
    check_scheme_eligibility,
    evaluate_rule,
    explain_rule_verdict,
    explain_scheme_eligibility,
)


def test_calculate_age():
    today = date.today()
    birth_date = date(today.year - 25, today.month, today.day)
    assert calculate_age(birth_date) == 25


def test_evaluate_rule_numeric_operators():
    rule_gt = EligibilityRule(field_name="age", operator="gt", rule_value="18")
    assert evaluate_rule(rule_gt, {"age": 25}) is True
    assert evaluate_rule(rule_gt, {"age": 18}) is False

    rule_gte = EligibilityRule(
        field_name="annual_income", operator="gte", rule_value="100000"
    )
    assert evaluate_rule(rule_gte, {"annual_income": 100000}) is True
    assert evaluate_rule(rule_gte, {"annual_income": 99999}) is False

    rule_lt = EligibilityRule(
        field_name="annual_income", operator="lt", rule_value="200000"
    )
    assert evaluate_rule(rule_lt, {"annual_income": 150000}) is True
    assert evaluate_rule(rule_lt, {"annual_income": 200000}) is False

    rule_lte = EligibilityRule(
        field_name="annual_income", operator="lte", rule_value="200000"
    )
    assert evaluate_rule(rule_lte, {"annual_income": 200000}) is True
    assert evaluate_rule(rule_lte, {"annual_income": 250000}) is False


def test_evaluate_rule_exact_boundaries():
    # Age <= 10 boundary
    rule_child_age = EligibilityRule(
        field_name="age", operator="lte", rule_value="10"
    )
    assert evaluate_rule(rule_child_age, {"age": 9}) is True
    assert evaluate_rule(rule_child_age, {"age": 10}) is True
    assert evaluate_rule(rule_child_age, {"age": 11}) is False

    # Age >= 60 boundary
    rule_senior_age = EligibilityRule(
        field_name="age", operator="gte", rule_value="60"
    )
    assert evaluate_rule(rule_senior_age, {"age": 59}) is False
    assert evaluate_rule(rule_senior_age, {"age": 60}) is True
    assert evaluate_rule(rule_senior_age, {"age": 61}) is True

    # Income <= 200,000 exact boundary
    rule_income = EligibilityRule(
        field_name="annual_income", operator="lte", rule_value="200000"
    )
    assert evaluate_rule(rule_income, {"annual_income": 199999}) is True
    assert evaluate_rule(rule_income, {"annual_income": 200000}) is True
    assert evaluate_rule(rule_income, {"annual_income": 200001}) is False


def test_evaluate_rule_between_operator():
    rule_between = EligibilityRule(
        field_name="age", operator="between", rule_value="15-30"
    )
    # Lower bound
    assert evaluate_rule(rule_between, {"age": 14}) is False
    assert evaluate_rule(rule_between, {"age": 15}) is True
    # Inside range
    assert evaluate_rule(rule_between, {"age": 22}) is True
    # Upper bound
    assert evaluate_rule(rule_between, {"age": 30}) is True
    assert evaluate_rule(rule_between, {"age": 31}) is False

    # Alternative syntax: "18 to 60"
    rule_between_alt = EligibilityRule(
        field_name="age", operator="between", rule_value="18 to 60"
    )
    assert evaluate_rule(rule_between_alt, {"age": 18}) is True
    assert evaluate_rule(rule_between_alt, {"age": 60}) is True
    assert evaluate_rule(rule_between_alt, {"age": 61}) is False


def test_evaluate_rule_string_operators():
    rule_eq = EligibilityRule(
        field_name="occupation", operator="eq", rule_value="farmer"
    )
    assert evaluate_rule(rule_eq, {"occupation": "farmer"}) is True
    assert evaluate_rule(rule_eq, {"occupation": "FARMER"}) is True
    assert evaluate_rule(rule_eq, {"occupation": "teacher"}) is False

    rule_all = EligibilityRule(
        field_name="gender", operator="eq", rule_value="all"
    )
    assert evaluate_rule(rule_all, {"gender": "female"}) is True
    assert evaluate_rule(rule_all, {"gender": "male"}) is True

    rule_in = EligibilityRule(
        field_name="state", operator="in", rule_value="Maharashtra, Delhi, Punjab"
    )
    assert evaluate_rule(rule_in, {"state": "Delhi"}) is True
    assert evaluate_rule(rule_in, {"state": "delhi"}) is True
    assert evaluate_rule(rule_in, {"state": "Karnataka"}) is False

    rule_not_in = EligibilityRule(
        field_name="state", operator="not_in", rule_value="Delhi, Punjab"
    )
    assert evaluate_rule(rule_not_in, {"state": "Maharashtra"}) is True
    assert evaluate_rule(rule_not_in, {"state": "Delhi"}) is False

    rule_contains = EligibilityRule(
        field_name="occupation", operator="contains", rule_value="farm"
    )
    assert evaluate_rule(rule_contains, {"occupation": "farmer"}) is True
    assert evaluate_rule(rule_contains, {"occupation": "poultry farming"}) is True
    assert evaluate_rule(rule_contains, {"occupation": "carpenter"}) is False


def test_evaluate_rule_boolean_normalization():
    rule_bpl = EligibilityRule(
        field_name="is_bpl", operator="eq", rule_value="true"
    )
    assert evaluate_rule(rule_bpl, {"is_bpl": True}) is True
    assert evaluate_rule(rule_bpl, {"is_bpl": "yes"}) is True
    assert evaluate_rule(rule_bpl, {"is_bpl": "1"}) is True
    assert evaluate_rule(rule_bpl, {"is_bpl": False}) is False
    assert evaluate_rule(rule_bpl, {"is_bpl": "no"}) is False


def test_evaluate_rule_missing_field():
    rule = EligibilityRule(field_name="state", operator="eq", rule_value="MP")
    # Missing required field should fail strict evaluation
    assert evaluate_rule(rule, {"age": 25}) is False
