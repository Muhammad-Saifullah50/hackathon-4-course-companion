from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    backend_url: str
    stytch_project_domain: str
    stytch_project_id: str
    upgrade_url: str | None = None


settings = Settings()  # type: ignore[call-arg]
