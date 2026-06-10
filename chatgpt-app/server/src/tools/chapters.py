import httpx
from mcp.types import TextContent
from fastmcp.tools import ToolResult
from fastmcp.apps import AppConfig

from ..main import mcp
from ..client import backend
from ..models.chapters import ChapterPanel, ChapterSummary


@mcp.tool(
    app=AppConfig(resource_uri="ui://widget/chapter-list.html"),
)
async def list_chapters() -> ToolResult:
    """List all available course chapters."""
    data = await backend.get("/chapters")
    chapters = [ChapterSummary(**ch) for ch in data]
    return ToolResult(
        content=[TextContent(type="text", text=f"Found {len(chapters)} chapters.")],
        structured_content={"chapters": [ch.model_dump() for ch in chapters]},
        meta={"ui": {"resourceUri": "ui://widget/chapter-list.html"}, "openai/outputTemplate": "ui://widget/chapter-list.html"},
    )


@mcp.tool(
    app=AppConfig(resource_uri="ui://widget/chapter-reader.html"),
)
async def get_chapter(slug: str = "") -> ToolResult:
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
        data = await backend.get(f"/chapters/{slug}")
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise ValueError(f"Chapter '{slug}' not found")
        raise
    panel = ChapterPanel(**data)
    return ToolResult(
        content=[TextContent(type="text", text=f"Showing chapter: {panel.title}")],
        structured_content=panel.model_dump(),
        meta={"ui": {"resourceUri": "ui://widget/chapter-reader.html"}, "openai/outputTemplate": "ui://widget/chapter-reader.html"},
    )
