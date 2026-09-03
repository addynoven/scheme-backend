import logging
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.exceptions import (
    AppException,
    AuthenticationError,
    BusinessRuleError,
    DuplicateEntityError,
    EntityNotFoundError,
    InvalidTokenError,
    PermissionDeniedError,
)

logger = logging.getLogger("app.errors")


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(EntityNotFoundError)
    async def entity_not_found_handler(
        request: Request, exc: EntityNotFoundError
    ):
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "error": exc.error_code,
                "message": exc.message,
                "detail": exc.message,
                "status_code": status.HTTP_404_NOT_FOUND,
            },
        )

    @app.exception_handler(DuplicateEntityError)
    async def duplicate_entity_handler(
        request: Request, exc: DuplicateEntityError
    ):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "error": exc.error_code,
                "message": exc.message,
                "detail": exc.message,
                "status_code": status.HTTP_400_BAD_REQUEST,
            },
        )

    @app.exception_handler(AuthenticationError)
    async def authentication_error_handler(
        request: Request, exc: AuthenticationError
    ):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            headers={"WWW-Authenticate": "Bearer"},
            content={
                "error": exc.error_code,
                "message": exc.message,
                "detail": exc.message,
                "status_code": status.HTTP_401_UNAUTHORIZED,
            },
        )

    @app.exception_handler(InvalidTokenError)
    async def invalid_token_handler(request: Request, exc: InvalidTokenError):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            headers={"WWW-Authenticate": "Bearer"},
            content={
                "error": exc.error_code,
                "message": exc.message,
                "detail": exc.message,
                "status_code": status.HTTP_401_UNAUTHORIZED,
            },
        )

    @app.exception_handler(PermissionDeniedError)
    async def permission_denied_handler(
        request: Request, exc: PermissionDeniedError
    ):
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={
                "error": exc.error_code,
                "message": exc.message,
                "detail": exc.message,
                "status_code": status.HTTP_403_FORBIDDEN,
            },
        )

    @app.exception_handler(BusinessRuleError)
    async def business_rule_handler(request: Request, exc: BusinessRuleError):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "error": exc.error_code,
                "message": exc.message,
                "detail": exc.message,
                "status_code": status.HTTP_400_BAD_REQUEST,
            },
        )

    @app.exception_handler(AppException)
    async def generic_app_exception_handler(
        request: Request, exc: AppException
    ):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "error": exc.error_code,
                "message": exc.message,
                "detail": exc.message,
                "status_code": status.HTTP_400_BAD_REQUEST,
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ):
        details = []
        for error in exc.errors():
            loc = " -> ".join(str(x) for x in error.get("loc", []))
            details.append(f"{loc}: {error.get('msg')}")

        msg = "; ".join(details)
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": "VALIDATION_ERROR",
                "message": msg,
                "detail": msg,
                "status_code": status.HTTP_422_UNPROCESSABLE_ENTITY,
            },
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request, exc: StarletteHTTPException
    ):
        detail_obj = exc.detail
        msg = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
        return JSONResponse(
            status_code=exc.status_code,
            headers=exc.headers,
            content={
                "error": "HTTP_ERROR",
                "message": msg,
                "detail": detail_obj,
                "status_code": exc.status_code,
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled server error: {exc}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred. Please try again later.",
                "detail": "An unexpected error occurred. Please try again later.",
                "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
            },
        )
