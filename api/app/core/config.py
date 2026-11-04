from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    environment: str = "development"
    frontend_origin: str = "http://localhost:3000"
    # Extra browser origins, comma-separated. Used with FRONTEND_ORIGIN.
    cors_origins: str = ""

    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = ""
    r2_public_base_url: str = ""
    insight_image_max_bytes: int = 5_000_000

    next_revalidate_url: str = ""
    next_revalidate_secret: str = ""
    next_revalidate_timeout_seconds: float = 5.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


def get_settings() -> Settings:
    return Settings()


settings = get_settings()
