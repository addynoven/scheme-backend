from dataclasses import dataclass
from typing import Any


@dataclass
class SchemeDiff:
    scheme_slug: str
    scheme_name: str
    is_new: bool
    is_breaking: bool
    change_type: str
    impact_level: str
    summary: str
    before_state: dict[str, Any]
    after_state: dict[str, Any]


def classify_scheme_diff(
    existing_scheme_data: dict[str, Any] | None,
    incoming_scheme_data: dict[str, Any],
) -> SchemeDiff | None:
    slug = incoming_scheme_data.get("slug") or incoming_scheme_data.get("name", "").lower().replace(" ", "-")
    name = incoming_scheme_data.get("name", "")

    # 1. New Scheme -> Non-breaking
    if existing_scheme_data is None:
        return SchemeDiff(
            scheme_slug=slug,
            scheme_name=name,
            is_new=True,
            is_breaking=False,
            change_type="new_scheme",
            impact_level="non_breaking",
            summary=f"New government scheme '{name}' published in official feed.",
            before_state={},
            after_state=incoming_scheme_data,
        )

    # 2. Check for Discontinuation / Status change
    old_status = existing_scheme_data.get("status", "Active").lower()
    new_status = incoming_scheme_data.get("status", "Active").lower()
    if old_status == "active" and new_status in ("archived", "discontinued", "inactive"):
        return SchemeDiff(
            scheme_slug=slug,
            scheme_name=name,
            is_new=False,
            is_breaking=True,
            change_type="scheme_archived",
            impact_level="breaking",
            summary=f"Scheme '{name}' marked as {new_status.upper()} in government feed.",
            before_state={"status": existing_scheme_data.get("status")},
            after_state={"status": incoming_scheme_data.get("status")},
        )

    # 3. Check Eligibility Rules
    old_rules = {
        (r.get("field_name", "").lower(), r.get("operator", "").lower()): r
        for r in existing_scheme_data.get("eligibility_rules", [])
    }
    new_rules = {
        (r.get("field_name", "").lower(), r.get("operator", "").lower()): r
        for r in incoming_scheme_data.get("eligibility_rules", [])
    }

    # Detect tightened rules or new rules
    for key, new_rule in new_rules.items():
        field_name, op = key
        new_val = str(new_rule.get("rule_value") or new_rule.get("value_criteria") or "").strip()

        if key in old_rules:
            old_rule = old_rules[key]
            old_val = str(old_rule.get("rule_value") or old_rule.get("value_criteria") or "").strip()

            if old_val != new_val:
                try:
                    old_num = float(old_val.replace(",", ""))
                    new_num = float(new_val.replace(",", ""))
                    # If operator is <= and new limit is lower (e.g. income limit lowered), it is breaking!
                    if op in ("<=", "<") and new_num < old_num:
                        return SchemeDiff(
                            scheme_slug=slug,
                            scheme_name=name,
                            is_new=False,
                            is_breaking=True,
                            change_type="rule_tightened",
                            impact_level="breaking",
                            summary=f"Eligibility cutoff for '{field_name}' lowered from {old_val} to {new_val} (tightened threshold).",
                            before_state={"rule": old_rule},
                            after_state={"rule": new_rule},
                        )
                    # If operator is >= and new limit is higher (e.g. min age raised), it is breaking!
                    if op in (">=", ">") and new_num > old_num:
                        return SchemeDiff(
                            scheme_slug=slug,
                            scheme_name=name,
                            is_new=False,
                            is_breaking=True,
                            change_type="rule_tightened",
                            impact_level="breaking",
                            summary=f"Minimum threshold for '{field_name}' increased from {old_val} to {new_val}.",
                            before_state={"rule": old_rule},
                            after_state={"rule": new_rule},
                        )
                except ValueError:
                    return SchemeDiff(
                        scheme_slug=slug,
                        scheme_name=name,
                        is_new=False,
                        is_breaking=True,
                        change_type="rule_modified",
                        impact_level="breaking",
                        summary=f"Eligibility rule '{field_name} {op}' criteria changed from '{old_val}' to '{new_val}'.",
                        before_state={"rule": old_rule},
                        after_state={"rule": new_rule},
                    )
        else:
            return SchemeDiff(
                scheme_slug=slug,
                scheme_name=name,
                is_new=False,
                is_breaking=True,
                change_type="mandatory_rule_added",
                impact_level="breaking",
                summary=f"New eligibility rule added: '{field_name} {op} {new_val}'.",
                before_state={},
                after_state={"rule": new_rule},
            )

    # 4. Check Mandatory Documents Added
    old_docs = {
        d.get("document_name", "").lower(): d
        for d in existing_scheme_data.get("required_documents", [])
    }
    for new_doc in incoming_scheme_data.get("required_documents", []):
        doc_name = new_doc.get("document_name", "").lower()
        if doc_name not in old_docs and new_doc.get("is_mandatory", True):
            return SchemeDiff(
                scheme_slug=slug,
                scheme_name=name,
                is_new=False,
                is_breaking=True,
                change_type="mandatory_doc_added",
                impact_level="breaking",
                summary=f"New mandatory document requirement added: '{new_doc.get('document_name')}'.",
                before_state={},
                after_state={"document": new_doc},
            )

    # 5. Non-breaking updates
    return SchemeDiff(
        scheme_slug=slug,
        scheme_name=name,
        is_new=False,
        is_breaking=False,
        change_type="non_breaking_update",
        impact_level="non_breaking",
        summary=f"Routine metadata or benefit updates for '{name}'.",
        before_state=existing_scheme_data,
        after_state=incoming_scheme_data,
    )
