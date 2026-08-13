from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.exceptions import SchemeNotFoundError
from app.database import get_db
from app.schemas.pagination import PaginatedResponse
from app.modules.schemes.schemas import (
    CategoryListResponse,
    SchemeCreate,
    SchemeDetailResponse,
    SchemeUpdate,
)
from app.modules.schemes.service import (
    create_scheme,
    delete_scheme,
    get_scheme_by_id,
    get_scheme_by_slug,
    get_scheme_categories,
    list_schemes,
    search_schemes,
    update_scheme,
)

router = APIRouter(prefix="/schemes", tags=["Schemes"])


@router.post(
    "",
    response_model=SchemeDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new government scheme",
    description="Creates a new scheme with nested benefits, eligibility rules, required documents, and official sources.",
    response_description="Created scheme details with full relations",
)
def create_scheme_endpoint(
    payload: SchemeCreate,
    db: Session = Depends(get_db),
):
    return create_scheme(db=db, payload=payload)


@router.get(
    "",
    response_model=PaginatedResponse[SchemeDetailResponse],
    summary="List government schemes",
    description="Returns a paginated list of schemes with optional filtering by ministry, category, state, status, or search query.",
    response_description="Paginated list of schemes with child collections",
)
def list_schemes_endpoint(
    skip: int = Query(0, ge=0, description="Number of items to skip for pagination"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of items to return"),
    ministry: str | None = Query(None, description="Filter by ministry name"),
    category: str | None = Query(None, description="Filter by sector category (e.g. 'Agriculture', 'Healthcare')"),
    state: str | None = Query(None, description="Filter by state (e.g. 'Madhya Pradesh', 'Maharashtra', 'Karnataka', 'ALL_INDIA')"),
    status_filter: str | None = Query(None, alias="status", description="Filter by status ('active', 'draft', 'archived')"),
    search: str | None = Query(None, description="Search across scheme name, description, category, and tags"),
    db: Session = Depends(get_db),
):
    items, total = list_schemes(
        db=db,
        skip=skip,
        limit=limit,
        ministry=ministry,
        category=category,
        state=state,
        status=status_filter,
        search=search,
    )
    return PaginatedResponse(
        items=items,
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/search",
    response_model=PaginatedResponse[SchemeDetailResponse],
    summary="Problem & Need-based scheme discovery",
    description="High-relevance discovery endpoint for citizens searching by problems, life events, and keywords (e.g. 'fertilizer', 'pension', 'hospital').",
    response_description="Matching active schemes",
)
def search_schemes_endpoint(
    q: str | None = Query(None, description="Problem or keyword search e.g. 'farmer', 'pension', 'scholarship'"),
    category: str | None = Query(None, description="Sector category filter e.g. 'Agriculture', 'Healthcare'"),
    state: str | None = Query(None, description="Filter by state jurisdiction e.g. 'Madhya Pradesh'"),
    status_filter: str = Query("active", alias="status", description="Scheme status filter"),
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(20, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db),
):
    items, total = search_schemes(
        db=db,
        q=q,
        category=category,
        state=state,
        status=status_filter,
        skip=skip,
        limit=limit,
    )
    return PaginatedResponse(
        items=items,
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/categories",
    response_model=CategoryListResponse,
    summary="List scheme categories with counts",
    description="Returns all unique scheme sector categories along with the count of active schemes in each category.",
    response_description="List of categories and counts",
)
def get_categories_endpoint(
    db: Session = Depends(get_db),
):
    categories = get_scheme_categories(db=db)
    return CategoryListResponse(categories=categories)


@router.get(
    "/slug/{slug}",
    response_model=SchemeDetailResponse,
    summary="Get scheme by unique slug",
    description="Returns full scheme details, benefits, eligibility rules, and required documents using a human-readable slug.",
    response_description="Scheme details",
)
def get_scheme_by_slug_endpoint(
    slug: str,
    db: Session = Depends(get_db),
):
    scheme = get_scheme_by_slug(db=db, slug=slug)
    if not scheme:
        raise SchemeNotFoundError(slug)
    return scheme


@router.get(
    "/{scheme_id}",
    response_model=SchemeDetailResponse,
    summary="Get scheme by numeric ID",
    description="Returns complete details for a specific scheme by ID.",
    response_description="Scheme details",
)
def get_scheme_by_id_endpoint(
    scheme_id: int,
    db: Session = Depends(get_db),
):
    scheme = get_scheme_by_id(db=db, scheme_id=scheme_id)
    if not scheme:
        raise SchemeNotFoundError(scheme_id)
    return scheme


@router.patch(
    "/{scheme_id}",
    response_model=SchemeDetailResponse,
    summary="Update scheme details",
    description="Updates top-level fields of a scheme (name, description, status, category, tags, URLs).",
    response_description="Updated scheme",
)
def update_scheme_endpoint(
    scheme_id: int,
    payload: SchemeUpdate,
    db: Session = Depends(get_db),
):
    return update_scheme(db=db, scheme_id=scheme_id, payload=payload)


@router.delete(
    "/{scheme_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete scheme",
    description="Deletes a scheme and cascades deletion to all child relations.",
)
def delete_scheme_endpoint(
    scheme_id: int,
    db: Session = Depends(get_db),
):
    delete_scheme(db=db, scheme_id=scheme_id)
    return None