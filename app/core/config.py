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
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # S3 / MinIO Object Storage
    S3_ENDPOINT_URL: str | None = "http://localhost:9000"
    S3_PUBLIC_ENDPOINT_URL: str | None = "http://localhost:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_BUCKET_NAME: str = "scheme-documents"
    S3_REGION: str = "us-east-1"
    S3_PRESIGNED_EXPIRY_SECONDS: int = 3600

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
