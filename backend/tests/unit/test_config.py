from src.core.config import Settings


def test_allowed_origins_parses_and_trims_values() -> None:
    settings = Settings(
        cors_allowed_origins="http://localhost:3000, https://learn.example.com "
    )

    assert settings.allowed_origins == [
        "http://localhost:3000",
        "https://learn.example.com",
    ]
