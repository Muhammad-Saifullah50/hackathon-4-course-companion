import httpx
from mcp.types import TextContent
from fastmcp.tools import ToolResult
from fastmcp.apps import AppConfig

from ..main import mcp
from ..client import backend
from ..models.chapters import ChapterListPanel, ChapterPanel, ChapterSummary
from ..auth import NOAUTH_SECURITY, optional_authorize_request
from ..core.config import settings
from ..tool_metadata import READ_ONLY_ANNOTATIONS, output_schema


@mcp.tool(
    app=AppConfig(
        resource_uri="ui://widget/chapter-list.html",
        visibility=["model", "app"],
    ),
    meta={"securitySchemes": NOAUTH_SECURITY},
    output_schema=output_schema(ChapterListPanel),
    annotations=READ_ONLY_ANNOTATIONS,
)
async def list_chapters() -> ToolResult:
    """List all available course chapters."""
    authorization = await optional_authorize_request()
    headers = (
        {"Authorization": f"Bearer {authorization.token}"}
        if authorization
        else None
    )
    data = await backend.get("/chapters", headers=headers)
    chapters = [ChapterSummary(**ch) for ch in data]
    return ToolResult(
        content=[TextContent(type="text", text=f"Found {len(chapters)} chapters.")],
        structured_content={"chapters": [ch.model_dump() for ch in chapters]},
        meta={"ui": {"resourceUri": "ui://widget/chapter-list.html"}, "openai/outputTemplate": "ui://widget/chapter-list.html"},
    )


@mcp.tool(
    app=AppConfig(
        resource_uri="ui://widget/chapter-reader.html",
        visibility=["model", "app"],
    ),
    meta={"securitySchemes": NOAUTH_SECURITY},
    output_schema=output_schema(ChapterPanel),
    annotations=READ_ONLY_ANNOTATIONS,
)
async def get_chapter(slug: str) -> ToolResult:
    """Get the full content of a specific chapter by its slug.

    Args:
        slug: The unique identifier for the chapter (e.g. 'intro-to-agents').
              Call list_chapters first to get available slugs.
    """
    if not slug:
        return ToolResult(
            content=[TextContent(type="text", text="Please call list_chapters first to see available chapters, then call get_chapter with a specific slug.")],
            structured_content={"error": {"message": "No chapter selected. Use list_chapters to browse available chapters."}},
            meta={"ui": {"resourceUri": "ui://widget/chapter-reader.html"}, "openai/outputTemplate": "ui://widget/chapter-reader.html"},
        )
    try:
        authorization = await optional_authorize_request()
        headers = (
            {"Authorization": f"Bearer {authorization.token}"}
            if authorization
            else None
        )
        data = await backend.get(f"/chapters/{slug}", headers=headers)
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise ValueError(f"Chapter '{slug}' not found")
        if e.response.status_code == 403:
            message = "This chapter requires Premium."
            return ToolResult(
                content=[TextContent(type="text", text=message)],
                structured_content={
                    "error": {
                        "message": message,
                        "code": "upgrade_required",
                        "upgrade_url": settings.upgrade_url or None,
                    }
                },
                meta={"ui": {"resourceUri": "ui://widget/chapter-reader.html"}, "openai/outputTemplate": "ui://widget/chapter-reader.html"},
                is_error=True,
            )
        raise
    panel = ChapterPanel(**data)
    return ToolResult(
        content=[TextContent(type="text", text=f"Showing chapter: {panel.title}")],
        structured_content=panel.model_dump(),
        meta={"ui": {"resourceUri": "ui://widget/chapter-reader.html"}, "openai/outputTemplate": "ui://widget/chapter-reader.html"},
    )
