import httpx
from fastmcp import Context
from mcp.types import TextContent
from fastmcp.tools import ToolResult
from fastmcp.apps import AppConfig

from ..main import mcp
from ..client import backend
from ..models.progress import ChapterProgressItem, ProgressPanel
from ..tool_metadata import READ_ONLY_ANNOTATIONS, output_schema
from ..auth import (
    OAUTH_SECURITY,
    authorize_request,
    downstream_authentication_failed,
)

PROGRESS_RESOURCE_URI = "ui://widget/progress-dashboard.html"


def _normalize_progress(data: dict, chapters: list[dict]) -> ProgressPanel:
    completions = {
        str(entry["chapter_slug"]): entry
        for entry in data.get("completions", [])
    }
    ordered_chapters = sorted(
        chapters,
        key=lambda chapter: int(chapter.get("order", 0)),
    )
    chapter_list = [
        ChapterProgressItem(
            slug=str(chapter["slug"]),
            title=str(chapter["title"]),
            completed=str(chapter["slug"]) in completions,
            quiz_score=(
                completions[str(chapter["slug"])].get("quiz_score")
                if str(chapter["slug"]) in completions
                else None
            ),
        )
        for chapter in ordered_chapters
    ]
    completed_chapters = sum(chapter.completed for chapter in chapter_list)
    total_chapters = len(chapter_list)
    percentage = (
        completed_chapters / total_chapters * 100
        if total_chapters
        else 0.0
    )
    return ProgressPanel(
        user_id=str(data["user_id"]),
        current_streak=int(data.get("current_streak", 0)),
        completion_percentage=percentage,
        total_chapters=total_chapters,
        completed_chapters=completed_chapters,
        chapter_list=chapter_list,
    )


@mcp.tool(
    app=AppConfig(
        resource_uri=PROGRESS_RESOURCE_URI,
        visibility=["model", "app"],
    ),
    meta={"securitySchemes": OAUTH_SECURITY},
    output_schema=output_schema(ProgressPanel),
    annotations=READ_ONLY_ANNOTATIONS,
)
async def get_progress(ctx: Context | None = None) -> ToolResult:
    """Get progress for the authenticated user, including streak and chapter completion."""
    authorization = await authorize_request(
        PROGRESS_RESOURCE_URI, ctx
    )
    if isinstance(authorization, ToolResult):
        return authorization
    headers = {"Authorization": f"Bearer {authorization.token}"}
    try:
        data = await backend.get(
            f"/users/{authorization.user_id}/progress", headers=headers
        )
        chapters = await backend.get("/chapters")
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 401:
            return downstream_authentication_failed(PROGRESS_RESOURCE_URI)
        raise
    panel = _normalize_progress(data, chapters)
    return ToolResult(
        content=[TextContent(type="text", text=f"Streak: {panel.current_streak} days, {panel.completion_percentage:.0f}% complete.")],
        structured_content=panel.model_dump(),
        meta={"ui": {"resourceUri": PROGRESS_RESOURCE_URI}, "openai/outputTemplate": PROGRESS_RESOURCE_URI},
    )
