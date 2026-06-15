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
    use_local_content: bool = False
    local_content_path: Path = Path("../content")
    cache_ttl_seconds: int = 300
    signed_url_expiry_seconds: int = 3600

    stytch_project_domain: str = ""
    stytch_project_id: str = ""
    stytch_secret: str = ""
    database_url: str = ""
    cors_allowed_origins: str = "http://localhost:3000"
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_premium_price_id: str = ""
    stripe_pro_price_id: str = ""
    stripe_team_price_id: str = ""
    stripe_success_url: str = "http://localhost:3000/account?billing=success"
    stripe_cancel_url: str = "http://localhost:3000/account?billing=canceled"
    stripe_portal_return_url: str = "http://localhost:3000/account"

    @property
    def allowed_origins(self) -> list[str]:
        """Return normalized browser origins allowed by CORS."""
        return [
            origin.strip()
            for origin in self.cors_allowed_origins.split(",")
            if origin.strip()
        ]

    @property
    def resolved_local_content_path(self) -> Path:
        """Return the local content directory as an absolute path."""
        if self.local_content_path.is_absolute():
            return self.local_content_path
        return (ENV_FILE.parent / self.local_content_path).resolve()


settings = Settings()
