from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import DuplicateEntityError, SchemeNotFoundError
from app.models.benefit import Benefit
from app.models.eligibility_rule import EligibilityRule
from app.models.official_source import OfficialSource
from app.models.required_document import RequiredDocument
from app.models.scheme import Scheme
from app.schemas.scheme import CategoryCount, SchemeCreate, SchemeUpdate


def get_scheme_by_id(db: Session, scheme_id: int) -> Scheme | None:
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
    return db.scalar(stmt)


def get_scheme_by_slug(db: Session, slug: str) -> Scheme | None:
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
    return db.scalar(stmt)


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
    return scheme


def list_schemes(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    ministry: str | None = None,
    category: str | None = None,
    state: str | None = None,
    status: str | None = None,
    search: str | None = None,
) -> tuple[list[Scheme], int]:
    query = select(Scheme)

    if ministry:
        query = query.where(Scheme.ministry.ilike(f"%{ministry}%"))
    if category:
        query = query.where(Scheme.category.ilike(f"%{category}%"))
    if state:
        if state.upper() in ("ALL_INDIA", "NATIONAL"):
            query = query.where(Scheme.state == "ALL_INDIA")
        else:
            query = query.where((Scheme.state == "ALL_INDIA") | (Scheme.state.ilike(f"%{state}%")))
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

    stmt = (
        query.offset(skip)
        .limit(limit)
        .order_by(Scheme.id.desc())
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
) -> tuple[list[Scheme], int]:
    return list_schemes(
        db=db,
        skip=skip,
        limit=limit,
        category=category,
        state=state,
        status=status,
        search=q,
    )


def get_scheme_categories(db: Session) -> list[CategoryCount]:
    stmt = (
        select(Scheme.category, func.count(Scheme.id))
        .where(Scheme.status == "active")
        .group_by(Scheme.category)
        .order_by(func.count(Scheme.id).desc(), Scheme.category.asc())
    )
    rows = db.execute(stmt).all()
    return [CategoryCount(category=cat, count=cnt) for cat, cnt in rows]


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
    return True