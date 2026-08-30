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

    def evaluate(self, profile: dict[str, Any]) -> list[dict[str, Any]]:
        """
        Evaluates profile against all schemes in < 0.05ms using bitwise operations.
        Returns list of matched scheme dictionaries.
        """
        if not self.is_warmed or self.all_schemes_mask == 0:
            return []

        mask = self.all_schemes_mask

        # 1. State Filter: Citizen matches their own state schemes + all national (central/all_india) schemes
        user_state = str(profile.get("state", "all_india")).lower().strip()
        state_match_mask = (
            self.state_masks.get(user_state, 0)
            | self.state_masks.get("all_india", 0)
            | self.state_masks.get("central", 0)
            | self.state_masks.get("all", 0)
        )
        if state_match_mask > 0:
            mask &= state_match_mask

        # 2. Gender Filter: If scheme has gender restriction, user must match it. If no restriction, scheme is open.
        user_gender = str(profile.get("gender", "")).lower().strip()
        gender_restricted_mask = 0
        for g_mask in self.gender_masks.values():
            gender_restricted_mask |= g_mask
        unrestricted_gender_mask = self.all_schemes_mask & ~gender_restricted_mask

        if user_gender:
            allowed_gender_mask = self.gender_masks.get(user_gender, 0) | self.gender_masks.get("all", 0) | unrestricted_gender_mask
            mask &= allowed_gender_mask

        # 3. Caste Category Filter: Schemes with caste restriction must match, otherwise open.
        user_caste = str(profile.get("caste_category", "")).lower().strip()
        caste_restricted_mask = 0
        for c_mask in self.caste_masks.values():
            caste_restricted_mask |= c_mask
        unrestricted_caste_mask = self.all_schemes_mask & ~caste_restricted_mask

        if user_caste:
            allowed_caste_mask = self.caste_masks.get(user_caste, 0) | self.caste_masks.get("all", 0) | unrestricted_caste_mask
            mask &= allowed_caste_mask

        # 4. Occupation Filter: Schemes with occupation restriction must match, otherwise open.
        user_occ = str(profile.get("occupation", "")).lower().strip()
        occ_restricted_mask = 0
        for o_mask in self.occupation_masks.values():
            occ_restricted_mask |= o_mask
        unrestricted_occ_mask = self.all_schemes_mask & ~occ_restricted_mask

        if user_occ:
            allowed_occ_mask = self.occupation_masks.get(user_occ, 0) | self.occupation_masks.get("all", 0) | unrestricted_occ_mask
            mask &= allowed_occ_mask
        else:
            # If user has no occupation specified, only match unrestricted schemes
            mask &= unrestricted_occ_mask

        # 5. Numeric Rules Filter (Age & Annual Income)
        user_age = float(profile.get("age", 25)) if profile.get("age") is not None else None
        user_income = float(profile.get("annual_income", 100000)) if profile.get("annual_income") is not None else None

        for rule in self.numeric_rules:
            idx = rule["idx"]
            f_name = rule["field"]
            val = rule["val"]
            op = rule["op"]

            current_val = user_age if f_name == "age" else user_income
            if current_val is None:
                continue

            passed = True
            if op == "lte" and current_val > val:
                passed = False
            elif op == "gte" and current_val < val:
                passed = False
            elif op == "eq" and current_val != val:
                passed = False

            if not passed:
                mask &= ~(1 << idx)

        # Extract matching scheme items
        matches = []
        for i in range(len(self.scheme_ids)):
            if (mask >> i) & 1:
                matches.append(self.idx_to_scheme[i])

        return matches


# Global Engine Singleton
bitmask_engine = BitmaskRuleEngine()
