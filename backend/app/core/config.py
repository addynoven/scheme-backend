from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Scheme Management & Eligibility API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = ""

    DATABASE_URL: str = (
        "postgresql+psycopg://scheme_user:scheme_password@localhost:5432/scheme_db"
    )

    # Security & JWT
    SECRET_KEY: str = (
        "insecure_development_secret_key_must_override_in_production"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days matching Better Auth
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14

    # Storage Configuration (Cloudinary vs S3/MinIO)
    STORAGE_PROVIDER: str = "cloudinary"  # "cloudinary" | "s3"

    # Cloudinary Object Storage (Must be configured via environment variables)
    CLOUDINARY_CLOUD_NAME: str | None = None
    CLOUDINARY_API_KEY: str | None = None
    CLOUDINARY_API_SECRET: str | None = None
    CLOUDINARY_URL: str | None = None

    # S3 / MinIO Object Storage
    S3_ENDPOINT_URL: str | None = "http://localhost:9000"
    S3_PUBLIC_ENDPOINT_URL: str | None = "http://localhost:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_BUCKET_NAME: str = "scheme-documents"
    S3_REGION: str = "us-east-1"
    S3_PRESIGNED_EXPIRY_SECONDS: int = 3600

    # Google Gemini Vision LLM / Groq AI / agy CLI provider
    GEMINI_API_KEY: str | None = None
    GEMINI_MODEL: str = "gemini-3.6-flash"
    GROQ_API_KEY: str | None = None
    GROQ_MODEL: str = "qwen/qwen3.8-27b"
    LLM_PROVIDER: str = "gemini"  # "gemini" | "groq" | "agy"
    AGY_MODEL: str = "gemini-3.6-flash"
    DEV_MODE: bool = False
    TESTING: bool = False
    FRONTEND_URL: str | None = None

    # Valkey / Redis caching (set VALKEY_URL in .env to enable)
    # Schemes change rarely — default TTL is 24 hours, tune via CACHE_TTL_SECONDS in .env
    VALKEY_URL: str | None = None
    CACHE_TTL_SECONDS: int = 86400  # 24 hours — change via CACHE_TTL_SECONDS in .env

    # LangSmith Observability & Tracing (supports modern LANGSMITH_* and legacy LANGCHAIN_* vars)
    LANGSMITH_TRACING: bool | None = None
    LANGSMITH_API_KEY: str | None = None
    LANGSMITH_PROJECT: str | None = None
    LANGSMITH_ENDPOINT: str | None = None

    LANGCHAIN_TRACING_V2: bool = False
    LANGCHAIN_API_KEY: str | None = None
    LANGCHAIN_PROJECT: str = "schemex"
    LANGCHAIN_ENDPOINT: str = "https://eu.api.smith.langchain.com"

    def setup_langsmith_env(self) -> None:
        """Propagate LangSmith configuration to os.environ so the official SDK automatically ingests traces."""
        tracing_enabled = self.LANGSMITH_TRACING if self.LANGSMITH_TRACING is not None else self.LANGCHAIN_TRACING_V2
        api_key = self.LANGSMITH_API_KEY or self.LANGCHAIN_API_KEY
        project = self.LANGSMITH_PROJECT or self.LANGCHAIN_PROJECT or "schemex"
        endpoint = self.LANGSMITH_ENDPOINT or self.LANGCHAIN_ENDPOINT

        if tracing_enabled and api_key:
            import os
            os.environ["LANGSMITH_TRACING"] = "true"
            os.environ["LANGCHAIN_TRACING_V2"] = "true"
            os.environ["LANGSMITH_API_KEY"] = api_key
            os.environ["LANGCHAIN_API_KEY"] = api_key
            os.environ["LANGSMITH_PROJECT"] = project
            os.environ["LANGCHAIN_PROJECT"] = project
            if endpoint:
                os.environ["LANGSMITH_ENDPOINT"] = endpoint
                os.environ["LANGCHAIN_ENDPOINT"] = endpoint

    def validate_production_secrets(self) -> None:
        """Halt startup if DEV_MODE is False but insecure default development keys are configured."""
        if not self.DEV_MODE and not self.TESTING:
            insecure_defaults = (
                "insecure_development_secret_key_must_override_in_production",
                "development_secret_key_change_in_production_super_secure_key_123456",
            )
            if self.SECRET_KEY in insecure_defaults or len(self.SECRET_KEY) < 32:
                raise RuntimeError(
                    "CRITICAL SECURITY CONFIG ERROR: Default or weak SECRET_KEY used in production mode (DEV_MODE=False). "
                    "You MUST set a strong, unique SECRET_KEY (minimum 32 characters) in your environment!"
                )
            if self.STORAGE_PROVIDER == "s3" and (self.S3_ACCESS_KEY == "minioadmin" or self.S3_SECRET_KEY == "minioadmin"):
                raise RuntimeError(
                    "CRITICAL SECURITY CONFIG ERROR: Default MinIO/S3 credentials used in production mode (DEV_MODE=False). "
                    "You MUST configure non-default S3_ACCESS_KEY and S3_SECRET_KEY in production!"
                )
            if self.STORAGE_PROVIDER == "cloudinary" and not (
                self.CLOUDINARY_URL
                or (self.CLOUDINARY_CLOUD_NAME and self.CLOUDINARY_API_KEY and self.CLOUDINARY_API_SECRET)
            ):
                raise RuntimeError(
                    "CRITICAL SECURITY CONFIG ERROR: Cloudinary credentials missing in production mode (DEV_MODE=False). "
                    "You MUST configure CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET!"
                )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
settings.setup_langsmith_env()
