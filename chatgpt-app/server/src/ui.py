from pathlib import Path

_WIDGET_DIR = Path(__file__).parent.parent.parent / "widgets" / "dist"

WIDGET_NAMES = {
    "chapter-list",
    "chapter-reader",
    "quiz-panel",
    "progress-dashboard",
    "search-results",
    "access-status",
}


def load_widget(name: str) -> str:
    return (_WIDGET_DIR / name).read_text()
