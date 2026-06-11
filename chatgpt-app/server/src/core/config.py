from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    backend_url: str
    stytch_project_domain: str
    stytch_project_id: str
    mcp_server_base_url: str = "http://localhost:8001"
    upgrade_url: str | None = None


settings = Settings()  # type: ignore[call-arg]
