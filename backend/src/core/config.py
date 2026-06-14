from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = "course-companion-content"
    cache_ttl_seconds: int = 300
    signed_url_expiry_seconds: int = 3600

    stytch_project_domain: str = ""
    stytch_project_id: str = ""
    stytch_secret: str = ""
    database_url: str = ""
    cors_allowed_origins: str = "http://localhost:3000"

    @property
    def allowed_origins(self) -> list[str]:
        """Return normalized browser origins allowed by CORS."""
        return [
            origin.strip()
            for origin in self.cors_allowed_origins.split(",")
            if origin.strip()
        ]


settings = Settings()
