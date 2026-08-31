from collections import defaultdict
import logging
from typing import Any
from sqlalchemy.orm import Session, selectinload

from app.modules.schemes.models import Scheme, EligibilityRule

logger = logging.getLogger(__name__)


class BitmaskRuleEngine:
    """
    High-Performance In-Memory Bitmask Rule Engine (CQRS Read Replica).
    Pre-compiles all schemes and rules into in-memory integer bitmasks for microsecond CPU evaluations.
    """

    def __init__(self):
        self.scheme_ids: list[int] = []
        self.scheme_id_to_idx: dict[int, int] = {}
        self.idx_to_scheme: dict[int, dict[str, Any]] = {}
        self.idx_to_slug: dict[int, str] = {}

        # Inverted Bitsets (represented as Python arbitrary-precision bitmasks)
        self.state_masks: dict[str, int] = defaultdict(int)
        self.caste_masks: dict[str, int] = defaultdict(int)
        self.gender_masks: dict[str, int] = defaultdict(int)
        self.occupation_masks: dict[str, int] = defaultdict(int)

        # Pre-parsed numeric rules
        self.numeric_rules: list[dict[str, Any]] = []
        self.all_schemes_mask: int = 0
        self.is_warmed: bool = False

    def warm_up(self, db: Session):
        """Loads all schemes and pre-compiles bitmasks from PostgreSQL."""
        schemes = (
            db.query(Scheme)
            .options(
                selectinload(Scheme.eligibility_rules),
                selectinload(Scheme.benefits),
                selectinload(Scheme.required_documents),
            )
            .all()
        )

        self.scheme_ids = [s.id for s in schemes]
        self.scheme_id_to_idx = {s.id: i for i, s in enumerate(schemes)}
        self.idx_to_slug = {i: s.slug for i, s in enumerate(schemes)}
        self.idx_to_scheme = {
            i: {
                "id": s.id,
                "slug": s.slug,
                "name": s.name,
                "state": s.state or "ALL_INDIA",
                "category": s.category or "General Welfare",
                "ministry": s.ministry or "Government of India",
                "application_url": s.application_url,
                "benefit_title": s.benefits[0].title if s.benefits else "Government Welfare Assistance",
                "rules_count": len(s.eligibility_rules),
                "docs_count": len(s.required_documents),
            }
            for i, s in enumerate(schemes)
        }

        self.state_masks.clear()
        self.caste_masks.clear()
        self.gender_masks.clear()
        self.occupation_masks.clear()
        self.numeric_rules.clear()

        total = len(schemes)
        self.all_schemes_mask = (1 << total) - 1 if total > 0 else 0

        for i, s in enumerate(schemes):
            bit = 1 << i
            st = (s.state or "all_india").lower().strip()
            self.state_masks[st] |= bit

            for r in s.eligibility_rules:
                val = str(r.rule_value).lower().strip().strip("'\"")
                f_name = r.field_name.lower().strip()

                if f_name == "caste_category":
                    self.caste_masks[val] |= bit
                elif f_name == "gender":
                    self.gender_masks[val] |= bit
                elif f_name == "occupation":
                    self.occupation_masks[val] |= bit
                elif f_name in ["age", "annual_income", "land_hectares"]:
                    try:
                        num_val = float(val)
                        self.numeric_rules.append({
                            "idx": i,
                            "field": f_name,
                            "op": r.operator.lower().strip(),
                            "val": num_val,
                        })
                    except ValueError:
                        pass

        self.is_warmed = True
        logger.info(f"BitmaskRuleEngine warmed up successfully with {len(schemes)} schemes.")

    def evaluate(
        self, profile: dict[str, Any], include_diagnostics: bool = False
    ) -> list[dict[str, Any]] | tuple[list[dict[str, Any]], dict[str, Any]]:
        """
        Evaluates profile against all schemes in < 0.05ms using bitwise operations.
        Consistently enforces conservative matching: any restricted scheme requires confirmed user facts.
        Optionally returns detailed elimination breakdown diagnostics.
        """
        if not self.is_warmed or self.all_schemes_mask == 0:
            if include_diagnostics:
                return [], {"elimination_by_field": {}, "total_schemes_before_filtering": 0, "final_matched_count": 0}
            return []

        mask = self.all_schemes_mask
        total_before = mask.bit_count()
        elimination_by_field: dict[str, int] = {
            "state": 0,
            "gender": 0,
            "caste_category": 0,
            "occupation": 0,
            "age": 0,
            "annual_income": 0,
        }

        # 1. State / Jurisdiction Filter
        jurisdiction = str(profile.get("jurisdiction", "both")).lower().strip()
        raw_state = profile.get("state")
        user_state = str(raw_state).lower().strip() if raw_state else "all_india"

        if jurisdiction == "central_only":
            state_match_mask = (
                self.state_masks.get("all_india", 0)
                | self.state_masks.get("central", 0)
                | self.state_masks.get("all", 0)
            )
        elif jurisdiction == "state_only" and user_state and user_state != "all_india":
            state_match_mask = self.state_masks.get(user_state, 0)
        else:
            # "both" (default): state specific + central / all_india
            state_match_mask = (
                self.state_masks.get(user_state, 0)
                | self.state_masks.get("all_india", 0)
                | self.state_masks.get("central", 0)
                | self.state_masks.get("all", 0)
            )

        if state_match_mask > 0:
            before = mask.bit_count()
            mask &= state_match_mask
            elimination_by_field["state"] = before - mask.bit_count()

        # 2. Gender Filter: If scheme has gender restriction, user must match it. If missing/unspecified, only open schemes match.
        raw_gender = profile.get("gender")
        user_gender = str(raw_gender).lower().strip() if raw_gender else ""
        gender_restricted_mask = 0
        for g_mask in self.gender_masks.values():
            gender_restricted_mask |= g_mask
        unrestricted_gender_mask = self.all_schemes_mask & ~gender_restricted_mask

        if user_gender and user_gender not in ("all", "any", "unspecified", "all_genders"):
            allowed_gender_mask = self.gender_masks.get(user_gender, 0) | self.gender_masks.get("all", 0) | unrestricted_gender_mask
        else:
            allowed_gender_mask = unrestricted_gender_mask | self.gender_masks.get("all", 0)

        before = mask.bit_count()
        mask &= allowed_gender_mask
        elimination_by_field["gender"] = before - mask.bit_count()

        # 3. Caste Category Filter: Schemes with caste restriction must match, otherwise only open schemes match.
        raw_caste = profile.get("caste_category")
        user_caste = str(raw_caste).lower().strip() if raw_caste else ""
        caste_restricted_mask = 0
        for c_mask in self.caste_masks.values():
            caste_restricted_mask |= c_mask
        unrestricted_caste_mask = self.all_schemes_mask & ~caste_restricted_mask

        if user_caste and user_caste not in ("all", "any", "unspecified", "all_categories"):
            allowed_caste_mask = self.caste_masks.get(user_caste, 0) | self.caste_masks.get("all", 0) | unrestricted_caste_mask
        else:
            allowed_caste_mask = unrestricted_caste_mask | self.caste_masks.get("all", 0)

        before = mask.bit_count()
        mask &= allowed_caste_mask
        elimination_by_field["caste_category"] = before - mask.bit_count()

        # 4. Occupation Filter: Schemes with occupation restriction must match, otherwise only open schemes match.
        raw_occ = profile.get("occupation")
        user_occ = str(raw_occ).lower().strip() if raw_occ else ""
        occ_restricted_mask = 0
        for o_mask in self.occupation_masks.values():
            occ_restricted_mask |= o_mask
        unrestricted_occ_mask = self.all_schemes_mask & ~occ_restricted_mask

        if user_occ and user_occ not in ("all", "any", "general", "unspecified"):
            allowed_occ_mask = self.occupation_masks.get(user_occ, 0) | self.occupation_masks.get("all", 0) | unrestricted_occ_mask
        else:
            allowed_occ_mask = unrestricted_occ_mask | self.occupation_masks.get("all", 0)

        before = mask.bit_count()
        mask &= allowed_occ_mask
        elimination_by_field["occupation"] = before - mask.bit_count()

        # 5. Numeric Rules Filter (Age & Annual Income)
        user_age = float(profile["age"]) if profile.get("age") is not None and str(profile.get("age")).strip() != "" else None
        user_income = float(profile["annual_income"]) if profile.get("annual_income") is not None and str(profile.get("annual_income")).strip() != "" else None

        for rule in self.numeric_rules:
            idx = rule["idx"]
            f_name = rule["field"]
            val = rule["val"]
            op = rule["op"]

            current_val = user_age if f_name == "age" else user_income
            if current_val is None:
                # Conservative: If age/income is unknown and scheme has a strict rule on it, exclude scheme
                before = mask.bit_count()
                mask &= ~(1 << idx)
                diff = before - mask.bit_count()
                if diff > 0:
                    elimination_by_field[f_name] = elimination_by_field.get(f_name, 0) + diff
                continue

            passed = True
            if op == "lte" and current_val > val:
                passed = False
            elif op == "gte" and current_val < val:
                passed = False
            elif op == "eq" and current_val != val:
                passed = False

            if not passed:
                before = mask.bit_count()
                mask &= ~(1 << idx)
                diff = before - mask.bit_count()
                if diff > 0:
                    elimination_by_field[f_name] = elimination_by_field.get(f_name, 0) + diff

        # Extract matching scheme items
        matches = []
        for i in range(len(self.scheme_ids)):
            if (mask >> i) & 1:
                matches.append(self.idx_to_scheme[i])

        if include_diagnostics:
            diagnostics = {
                "elimination_by_field": elimination_by_field,
                "total_schemes_before_filtering": total_before,
                "final_matched_count": len(matches),
            }
            return matches, diagnostics

        return matches


# Global Engine Singleton
bitmask_engine = BitmaskRuleEngine()
