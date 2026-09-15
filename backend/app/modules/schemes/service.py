import json
import logging

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.cache import cache_delete, cache_get, cache_invalidate_pattern, cache_set
from app.core.exceptions import DuplicateEntityError, SchemeNotFoundError
from app.modules.schemes.models import Benefit
from app.modules.schemes.models import EligibilityRule
from app.modules.schemes.models import OfficialSource
from app.modules.schemes.models import RequiredDocument
from app.modules.schemes.models import Scheme
from app.modules.schemes.schemas import CategoryCount, SchemeCreate, SchemeUpdate

logger = logging.getLogger("app.schemes")

# ──────────────────────────────────────────────────────────────────────────────
# Cache key helpers
# ──────────────────────────────────────────────────────────────────────────────
# All scheme cache keys are prefixed with "scheme:" so
# cache_invalidate_pattern("scheme:*") flushes everything at once.

def _key_scheme_id(scheme_id: int) -> str:
    return f"scheme:id:{scheme_id}"

def _key_scheme_slug(slug: str) -> str:
    return f"scheme:slug:{slug}"

def _key_categories() -> str:
    return "scheme:categories"

def _key_list(**kwargs) -> str:
    # Stable, sorted query-param fingerprint
    parts = sorted(f"{k}={v}" for k, v in kwargs.items() if v is not None)
    return "scheme:list:" + ":".join(parts) if parts else "scheme:list:all"


def _scheme_to_dict(scheme: Scheme) -> dict:
    """Serialize a Scheme ORM object to a plain dict for JSON caching."""
    return {
        "id": scheme.id,
        "name": scheme.name,
        "slug": scheme.slug,
        "state": scheme.state,
        "category": scheme.category,
        "tags": scheme.tags,
        "ministry": scheme.ministry,
        "description": scheme.description,
        "status": scheme.status,
        "publication_state": scheme.publication_state,
        "source_freshness": scheme.source_freshness,
        "application_url": scheme.application_url,
        "official_website": scheme.official_website,
        "launch_date": str(scheme.launch_date) if scheme.launch_date else None,
        "created_at": str(scheme.created_at) if scheme.created_at else None,
        "updated_at": str(scheme.updated_at) if scheme.updated_at else None,
        "benefits": [
            {"id": b.id, "scheme_id": b.scheme_id, "title": b.title, "description": b.description}
            for b in (scheme.benefits or [])
        ],
        "eligibility_rules": [
            {"id": r.id, "scheme_id": r.scheme_id, "field_name": r.field_name,
             "operator": r.operator, "rule_value": r.rule_value}
            for r in (scheme.eligibility_rules or [])
        ],
        "required_documents": [
            {"id": d.id, "scheme_id": d.scheme_id, "document_name": d.document_name,
             "is_mandatory": d.is_mandatory, "description": d.description}
            for d in (scheme.required_documents or [])
        ],
        "official_sources": [
            {"id": s.id, "scheme_id": s.scheme_id, "title": s.title,
             "url": s.url, "source_type": s.source_type}
            for s in (scheme.official_sources or [])
        ],
    }


def _invalidate_all_scheme_caches() -> None:
    """Wipe every scheme-related Valkey key. Called after any mutation."""
    count = cache_invalidate_pattern("scheme:*")
    logger.debug("Invalidated %d scheme cache key(s)", count)


def get_scheme_by_id(db: Session, scheme_id: int) -> Scheme | None:
    # ── 1. Cache hit ──────────────────────────────────────────────────────────
    cached = cache_get(_key_scheme_id(scheme_id))
    if cached is not None:
        try:
            data = json.loads(cached)
            # Re-hydrate as a lightweight dict-backed Scheme-like object is
            # complex; instead we just skip and refresh from DB on cache miss.
            # For now we rely on list caches; per-scheme lookup stays DB-backed
            # unless the object is already in the identity map.
        except Exception:
            pass

    # ── 2. DB query ───────────────────────────────────────────────────────────
    stmt = (
        select(Scheme)
        .where(Scheme.id == scheme_id)
        .options(
            selectinload(Scheme.benefits),
            selectinload(Scheme.eligibility_rules),
            selectinload(Scheme.required_documents),
            selectinload(Scheme.official_sources),
        )
    )
    scheme = db.scalar(stmt)

    # ── 3. Populate cache ─────────────────────────────────────────────────────
    if scheme is not None:
        try:
            cache_set(_key_scheme_id(scheme_id), json.dumps(_scheme_to_dict(scheme)))
        except Exception:
            pass

    return scheme


def get_scheme_by_slug(db: Session, slug: str) -> Scheme | None:
    # ── 1. Cache hit ──────────────────────────────────────────────────────────
    cached = cache_get(_key_scheme_slug(slug))
    if cached is not None:
        try:
            _ = json.loads(cached)  # validates JSON; actual ORM re-hydration skipped (see get_scheme_by_id)
        except Exception:
            pass

    # ── 2. DB query ───────────────────────────────────────────────────────────
    stmt = (
        select(Scheme)
        .where(Scheme.slug == slug)
        .options(
            selectinload(Scheme.benefits),
            selectinload(Scheme.eligibility_rules),
            selectinload(Scheme.required_documents),
            selectinload(Scheme.official_sources),
        )
    )
    scheme = db.scalar(stmt)

    # ── 3. Populate cache ─────────────────────────────────────────────────────
    if scheme is not None:
        try:
            payload = json.dumps(_scheme_to_dict(scheme))
            cache_set(_key_scheme_slug(slug), payload)
            cache_set(_key_scheme_id(scheme.id), payload)  # dual-index
        except Exception:
            pass

    return scheme


def get_scheme_by_name(db: Session, name: str) -> Scheme | None:
    stmt = (
        select(Scheme)
        .where(Scheme.name == name)
        .options(
            selectinload(Scheme.benefits),
            selectinload(Scheme.eligibility_rules),
            selectinload(Scheme.required_documents),
            selectinload(Scheme.official_sources),
        )
    )
    return db.scalar(stmt)


def create_scheme(db: Session, payload: SchemeCreate) -> Scheme:
    existing_slug = get_scheme_by_slug(db, payload.slug)
    if existing_slug:
        raise DuplicateEntityError(
            f"Scheme with slug '{payload.slug}' already exists"
        )

    existing_name = get_scheme_by_name(db, payload.name)
    if existing_name:
        raise DuplicateEntityError(
            f"Scheme with name '{payload.name}' already exists"
        )

    data = payload.model_dump(
        exclude={
            "benefits",
            "eligibility_rules",
            "required_documents",
            "official_sources",
        }
    )

    scheme = Scheme(**data)
    db.add(scheme)
    db.flush()

    for item in payload.benefits:
        db.add(Benefit(scheme_id=scheme.id, **item.model_dump()))

    for item in payload.eligibility_rules:
        db.add(EligibilityRule(scheme_id=scheme.id, **item.model_dump()))

    for item in payload.required_documents:
        db.add(RequiredDocument(scheme_id=scheme.id, **item.model_dump()))

    for item in payload.official_sources:
        db.add(OfficialSource(scheme_id=scheme.id, **item.model_dump()))

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(scheme)
    create_scheme_version_snapshot(db, scheme.id)
    from app.modules.eligibility.bitmask_engine import bitmask_engine
    bitmask_engine.warm_up(db)
    return scheme


def create_scheme_version_snapshot(db: Session, scheme_id: int, source_hash: str | None = None):
    from app.modules.schemes.models import EligibilityRuleVersion, SchemeVersion
    scheme = get_scheme_by_id(db, scheme_id)
    if not scheme:
        return None

    max_ver_stmt = select(func.max(SchemeVersion.version_number)).where(SchemeVersion.scheme_id == scheme_id)
    current_max = db.scalar(max_ver_stmt) or 0
    next_ver = current_max + 1

    sv = SchemeVersion(
        scheme_id=scheme_id,
        version_number=next_ver,
        name=scheme.name,
        description=scheme.description,
        status=scheme.status,
        source_hash=source_hash,
    )
    db.add(sv)
    db.flush()

    for rule in scheme.eligibility_rules:
        rv = EligibilityRuleVersion(
            scheme_version_id=sv.id,
            field_name=rule.field_name,
            operator=rule.operator,
            rule_value=rule.rule_value,
        )
        db.add(rv)

    try:
        db.commit()
        db.refresh(sv)
    except Exception:
        db.rollback()

    return sv


def list_schemes(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    ministry: str | None = None,
    category: str | None = None,
    state: str | None = None,
    status: str | None = None,
    benefit_type: str | None = None,
    search: str | None = None,
    sort_by: str | None = None,
) -> tuple[list[Scheme], int]:
    query = select(Scheme)

    if ministry:
        query = query.where(Scheme.ministry.ilike(f"%{ministry}%"))
    if category:
        from sqlalchemy import or_
        cat_lower = category.lower().strip()
        synonyms = {
            "msme": ["Business & Finance", "MSME", "Enterprise"],
            "business": ["Business & Finance"],
            "finance": ["Business & Finance"],
            "health": ["Healthcare", "Health"],
            "women": ["Women & Child", "Women"],
            "farmer": ["Agriculture", "Kisan"],
            "farming": ["Agriculture"],
            "senior": ["Social Welfare"],
            "skills": ["Employment & Skills"],
            "employment": ["Employment & Skills"],
        }
        terms = [t.strip() for t in category.replace("&", " ").split() if len(t.strip()) > 2]
        cat_filters = [Scheme.category.ilike(f"%{category}%")]
        for t in terms:
            cat_filters.append(Scheme.category.ilike(f"%{t}%"))
        if cat_lower in synonyms:
            for syn in synonyms[cat_lower]:
                cat_filters.append(Scheme.category.ilike(f"%{syn}%"))
        query = query.where(or_(*cat_filters))
    if state:
        if state.upper() in ("ALL_INDIA", "NATIONAL", "CENTRAL", "CENTRAL ONLY"):
            query = query.where(Scheme.state == "ALL_INDIA")
        else:
            query = query.where(Scheme.state.ilike(f"%{state}%"))
    if benefit_type:
        from sqlalchemy import or_
        from app.modules.schemes.models import Benefit
        bt = benefit_type.lower().strip()
        if bt in ("loan", "loans"):
            query = query.join(Scheme.benefits).where(
                or_(
                    Benefit.title.ilike("%loan%"),
                    Benefit.title.ilike("%credit%"),
                    Benefit.title.ilike("%mudra%"),
                    Benefit.description.ilike("%loan%"),
                    Benefit.description.ilike("%collateral-free%"),
                    Scheme.tags.ilike("%loan%"),
                )
            ).distinct()
        elif bt in ("subsidy", "subsidies"):
            query = query.join(Scheme.benefits).where(
                or_(
                    Benefit.title.ilike("%subsidy%"),
                    Benefit.title.ilike("%subsidized%"),
                    Benefit.description.ilike("%subsidy%"),
                    Benefit.description.ilike("%subsidized%"),
                    Scheme.tags.ilike("%subsidy%"),
                )
            ).distinct()
        elif bt in ("cash_grant", "grant", "cash_grants"):
            query = query.join(Scheme.benefits).where(
                or_(
                    Benefit.title.ilike("%grant%"),
                    Benefit.title.ilike("%cash%"),
                    Benefit.title.ilike("%dbt%"),
                    Benefit.title.ilike("%pension%"),
                    Benefit.title.ilike("%scholarship%"),
                    Benefit.description.ilike("%dbt%"),
                    Benefit.description.ilike("%pension%"),
                    Benefit.description.ilike("%grant%"),
                )
            ).distinct()
    if status:
        query = query.where(Scheme.status == status)
    if search:
        search_term = f"%{search}%"
        search_filter = (
            Scheme.name.ilike(search_term)
            | Scheme.description.ilike(search_term)
            | Scheme.ministry.ilike(search_term)
            | Scheme.category.ilike(search_term)
            | Scheme.tags.ilike(search_term)
        )
        query = query.where(search_filter)

    count_stmt = select(func.count()).select_from(query.subquery())
    total = db.scalar(count_stmt) or 0

    order_clauses = []
    if sort_by == "name_asc":
        order_clauses.append(Scheme.name.asc())
    elif sort_by == "name_desc":
        order_clauses.append(Scheme.name.desc())
    elif sort_by == "id_asc":
        order_clauses.append(Scheme.id.asc())
    elif sort_by == "category_asc":
        order_clauses.append(Scheme.category.asc())
        order_clauses.append(Scheme.name.asc())
    else:
        order_clauses.append(Scheme.id.desc())

    stmt = (
        query.offset(skip)
        .limit(limit)
        .order_by(*order_clauses)
        .options(
            selectinload(Scheme.benefits),
            selectinload(Scheme.eligibility_rules),
            selectinload(Scheme.required_documents),
            selectinload(Scheme.official_sources),
        )
    )
    items = list(db.scalars(stmt).all())
    return items, total


def search_schemes(
    db: Session,
    q: str | None = None,
    category: str | None = None,
    state: str | None = None,
    status: str = "active",
    skip: int = 0,
    limit: int = 20,
    sort_by: str | None = None,
) -> tuple[list[Scheme], int]:
    return list_schemes(
        db=db,
        skip=skip,
        limit=limit,
        category=category,
        state=state,
        status=status,
        search=q,
        sort_by=sort_by,
    )


_cached_categories: list[CategoryCount] | None = None


def get_scheme_categories(db: Session, force_reload: bool = False) -> list[CategoryCount]:
    global _cached_categories
    from app.core.config import settings
    is_testing = getattr(settings, "TESTING", False)
    if not is_testing and _cached_categories is not None and not force_reload:
        return _cached_categories

    stmt = (
        select(Scheme.category, func.count(Scheme.id))
        .where(Scheme.status == "active")
        .group_by(Scheme.category)
        .order_by(func.count(Scheme.id).desc(), Scheme.category.asc())
    )
    rows = db.execute(stmt).all()
    res = [CategoryCount(category=cat, count=cnt) for cat, cnt in rows]
    if not is_testing:
        _cached_categories = res
    return res


def invalidate_categories_cache() -> None:
    global _cached_categories
    _cached_categories = None


def update_scheme(
    db: Session, scheme_id: int, payload: SchemeUpdate
) -> Scheme:
    scheme = get_scheme_by_id(db, scheme_id)
    if not scheme:
        raise SchemeNotFoundError(scheme_id)

    update_data = payload.model_dump(exclude_unset=True)

    if "slug" in update_data and update_data["slug"] != scheme.slug:
        existing_slug = get_scheme_by_slug(db, update_data["slug"])
        if existing_slug and existing_slug.id != scheme_id:
            raise DuplicateEntityError(
                f"Scheme with slug '{update_data['slug']}' already exists"
            )

    if "name" in update_data and update_data["name"] != scheme.name:
        existing_name = get_scheme_by_name(db, update_data["name"])
        if existing_name and existing_name.id != scheme_id:
            raise DuplicateEntityError(
                f"Scheme with name '{update_data['name']}' already exists"
            )

    for field, value in update_data.items():
        setattr(scheme, field, value)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(scheme)
    create_scheme_version_snapshot(db, scheme.id)
    from app.modules.eligibility.bitmask_engine import bitmask_engine
    bitmask_engine.warm_up(db)
    return scheme


def delete_scheme(db: Session, scheme_id: int) -> bool:
    scheme = db.scalar(select(Scheme).where(Scheme.id == scheme_id))
    if not scheme:
        raise SchemeNotFoundError(scheme_id)

    db.delete(scheme)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    from app.modules.eligibility.bitmask_engine import bitmask_engine
    bitmask_engine.warm_up(db)
    return True


from pathlib import Path

KNOWLEDGE_SCHEMES_DIR = Path(__file__).resolve().parent.parent.parent.parent / "knowledge" / "schemes"


def browse_schemes_with_filters(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    search: str | None = None,
    state: str | None = None,
    category: str | None = None,
    ministry: str | None = None,
    status: str | None = None,
    publication_state: str | None = None,
    occupation: str | None = None,
    gender: str | None = None,
    caste_category: str | None = None,
    age: int | None = None,
    annual_income: float | None = None,
    has_land: bool | None = None,
    include_knowledge_md: bool = False,
) -> tuple[list[dict], int, dict]:
    filters_applied = {}
    if search: filters_applied["search"] = search
    if state: filters_applied["state"] = state
    if category: filters_applied["category"] = category
    if ministry: filters_applied["ministry"] = ministry
    if status: filters_applied["status"] = status
    if publication_state: filters_applied["publication_state"] = publication_state
    if occupation: filters_applied["occupation"] = occupation
    if gender: filters_applied["gender"] = gender
    if caste_category: filters_applied["caste_category"] = caste_category
    if age is not None: filters_applied["age"] = age
    if annual_income is not None: filters_applied["annual_income"] = annual_income
    if has_land is not None: filters_applied["has_land"] = has_land

    items, total = list_schemes(
        db=db,
        skip=skip,
        limit=limit,
        ministry=ministry,
        category=category,
        state=state,
        status=status,
        search=search,
    )

    enriched_items = []
    for s in items:
        item_dict = {
            "id": s.id,
            "name": s.name,
            "slug": s.slug,
            "state": s.state,
            "category": s.category,
            "tags": s.tags,
            "ministry": s.ministry,
            "description": s.description,
            "status": s.status,
            "publication_state": s.publication_state,
            "source_freshness": s.source_freshness,
            "application_url": s.application_url,
            "official_website": s.official_website,
            "launch_date": s.launch_date,
            "created_at": s.created_at,
            "updated_at": s.updated_at,
            "benefits": s.benefits,
            "eligibility_rules": s.eligibility_rules,
            "required_documents": s.required_documents,
            "official_sources": s.official_sources,
            "knowledge_md": None,
            "verification_status": "DATABASE_RECORD_ONLY",
        }

        if include_knowledge_md and KNOWLEDGE_SCHEMES_DIR.exists():
            kb_path = KNOWLEDGE_SCHEMES_DIR / f"{s.slug}.md"
            if not kb_path.exists():
                kb_path = next(KNOWLEDGE_SCHEMES_DIR.glob(f"**/{s.slug}.md"), None)

            if kb_path and kb_path.exists():
                try:
                    item_dict["knowledge_md"] = kb_path.read_text(encoding="utf-8")
                    item_dict["verification_status"] = "VERIFIED_CANONICAL_RECORD"
                except Exception:
                    pass

        enriched_items.append(item_dict)

    return enriched_items, total, filters_applied