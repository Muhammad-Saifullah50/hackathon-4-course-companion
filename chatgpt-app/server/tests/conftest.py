import os
import pytest


def pytest_configure(config: pytest.Config) -> None:
    os.environ.setdefault("BACKEND_URL", "http://localhost:8000")
    os.environ.setdefault("STYTCH_PROJECT_DOMAIN", "https://test.api.stytch.com")
    os.environ.setdefault("STYTCH_PROJECT_ID", "project-test-id")


@pytest.fixture(autouse=True)
def set_required_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("BACKEND_URL", "http://localhost:8000")
    monkeypatch.setenv("STYTCH_PROJECT_DOMAIN", "https://test.api.stytch.com")
    monkeypatch.setenv("STYTCH_PROJECT_ID", "project-test-id")
