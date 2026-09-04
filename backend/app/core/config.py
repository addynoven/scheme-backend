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
        "development_secret_key_change_in_production_super_secure_key_123456"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days matching Better Auth
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14

    # S3 / MinIO Object Storage
    S3_ENDPOINT_URL: str | None = "http://localhost:9000"
    S3_PUBLIC_ENDPOINT_URL: str | None = "http://localhost:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_BUCKET_NAME: str = "scheme-documents"
    S3_REGION: str = "us-east-1"
    S3_PRESIGNED_EXPIRY_SECONDS: int = 3600

    # Google Gemini Vision LLM / agy CLI provider
    GEMINI_API_KEY: str | None = None
    GEMINI_MODEL: str = "gemini-3.8-flash"
    LLM_PROVIDER: str = "gemini"  # "gemini" | "agy"
    AGY_MODEL: str = "gemini-3.8-flash-low"
    DEV_MODE: bool = False
    TESTING: bool = False
    FRONTEND_URL: str | None = None

    def validate_production_secrets(self) -> None:
        """Halt startup if DEV_MODE is False but insecure default development keys are configured."""
        if not self.DEV_MODE and not self.TESTING:
            default_secret = "development_secret_key_change_in_production_super_secure_key_123456"
            if self.SECRET_KEY == default_secret:
                raise RuntimeError(
                    "CRITICAL SECURITY CONFIG ERROR: Default SECRET_KEY used in production mode (DEV_MODE=False). "
                    "You MUST set a strong, unique SECRET_KEY in your environment!"
                )
            if self.S3_ACCESS_KEY == "minioadmin" or self.S3_SECRET_KEY == "minioadmin":
                raise RuntimeError(
                    "CRITICAL SECURITY CONFIG ERROR: Default MinIO/S3 credentials used in production mode (DEV_MODE=False). "
                    "You MUST configure non-default S3_ACCESS_KEY and S3_SECRET_KEY in production!"
                )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
