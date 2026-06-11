from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

from fastmcp.apps import AppConfig, ResourceCSP

from .core.config import settings

_WIDGET_DIR = Path(__file__).parent.parent.parent / "widgets" / "dist"

WIDGET_NAMES = {
    "chapter-list",
    "chapter-reader",
    "quiz-panel",
    "progress-dashboard",
    "search-results",
    "access-status",
}


def widget_origin() -> str:
    parsed = urlsplit(settings.mcp_server_base_url)
    return urlunsplit((parsed.scheme, parsed.netloc, "", "", ""))


def widget_resource_meta() -> dict[str, object]:
    origin = widget_origin()
    csp = ResourceCSP(
        connect_domains=[],
        resource_domains=[],
        frame_domains=[],
    )
    ui = AppConfig(csp=csp, domain=origin).model_dump(
        by_alias=True,
        exclude_none=True,
    )
    legacy_csp: dict[str, list[str]] = {
        "connect_domains": [],
        "resource_domains": [],
        "frame_domains": [],
    }
    if settings.upgrade_url:
        upgrade = urlsplit(settings.upgrade_url)
        if upgrade.scheme and upgrade.netloc:
            legacy_csp["redirect_domains"] = [
                urlunsplit((upgrade.scheme, upgrade.netloc, "", "", ""))
            ]
    return {
        "ui": ui,
        "openai/widgetCSP": legacy_csp,
        "openai/widgetDomain": origin,
    }


def load_widget(name: str) -> str:
    return (_WIDGET_DIR / name).read_text()
