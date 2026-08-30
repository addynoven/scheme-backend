import hashlib
import json
from typing import Any


def canonicalize_scheme_payload(scheme: dict[str, Any]) -> dict[str, Any]:
    """
    Normalizes a scheme dictionary to a canonical form by stripping whitespace,
    standardizing keys, and sorting nested lists (rules, benefits, documents).
    """
    # Normalize rules
    rules = []
    for r in scheme.get("eligibility_rules", []):
        val = r.get("rule_value") or r.get("value_criteria") or ""
        rules.append({
            "field_name": str(r.get("field_name", "")).strip().lower(),
            "operator": str(r.get("operator", "")).strip().lower(),
            "rule_value": str(val).strip(),
        })
    rules.sort(key=lambda x: (x["field_name"], x["operator"], x["rule_value"]))

    # Normalize benefits
    benefits = []
    for b in scheme.get("benefits", []):
        title = b.get("title") or b.get("benefit_type") or ""
        benefits.append({
            "title": str(title).strip(),
            "description": str(b.get("description", "")).strip(),
        })
    benefits.sort(key=lambda x: (x["title"], x["description"]))

    # Normalize required documents
    documents = []
    for d in scheme.get("required_documents", []):
        documents.append({
            "document_name": str(d.get("document_name", "")).strip().lower(),
            "is_mandatory": bool(d.get("is_mandatory", True)),
            "description": str(d.get("description", "")).strip(),
        })
    documents.sort(key=lambda x: (x["document_name"], x["is_mandatory"]))

    return {
        "name": str(scheme.get("name", "")).strip(),
        "slug": str(scheme.get("slug", "")).strip().lower(),
        "ministry": str(scheme.get("ministry", "")).strip(),
        "state": str(scheme.get("state", "ALL_INDIA")).strip().upper(),
        "category": str(scheme.get("category", "General")).strip(),
        "description": str(scheme.get("description", "")).strip(),
        "status": str(scheme.get("status", "Active")).strip().lower(),
        "application_url": str(scheme.get("application_url", "")).strip(),
        "official_website": str(scheme.get("official_website", "")).strip(),
        "eligibility_rules": rules,
        "benefits": benefits,
        "required_documents": documents,
    }


def compute_semantic_hash(payload: list[dict[str, Any]] | dict[str, Any]) -> str:
    """
    Computes a deterministic SHA-256 hash across a list of schemes.
    Ignores non-business metadata (timestamps, IDs, random ordering).
    """
    if isinstance(payload, dict):
        schemes_list = payload.get("schemes") or payload.get("data") or [payload]
    elif isinstance(payload, list):
        schemes_list = payload
    else:
        schemes_list = []

    canonical_schemes = [canonicalize_scheme_payload(s) for s in schemes_list]
    canonical_schemes.sort(key=lambda x: (x["slug"], x["name"]))

    canonical_json = json.dumps(canonical_schemes, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()
