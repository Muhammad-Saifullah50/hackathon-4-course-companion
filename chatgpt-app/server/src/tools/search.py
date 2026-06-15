from mcp.types import TextContent
from fastmcp.tools import ToolResult
from fastmcp.apps import AppConfig

from ..main import mcp
from ..client import backend
from ..models.search import SearchResultsPanel
from ..auth import NOAUTH_SECURITY
from ..auth import optional_authorize_request
from ..tool_metadata import READ_ONLY_ANNOTATIONS, output_schema


@mcp.tool(
    app=AppConfig(
        resource_uri="ui://widget/search-results.html",
        visibility=["model", "app"],
    ),
    meta={"securitySchemes": NOAUTH_SECURITY},
    output_schema=output_schema(SearchResultsPanel),
    annotations=READ_ONLY_ANNOTATIONS,
)
async def search_content(query: str, limit: int = 10) -> ToolResult:
    """Search course content by keyword.

    Args:
        query: The search term to find in course chapters and materials.
        limit: Maximum number of results to return (1–20, default 10).
    """
    query = query.strip()
    if not query:
        return ToolResult(
            content=[TextContent(type="text", text="Please provide a search query to search course content.")],
            structured_content={"error": {"message": "No search query provided. Please enter a keyword to search."}},
            meta={"ui": {"resourceUri": "ui://widget/search-results.html"}, "openai/outputTemplate": "ui://widget/search-results.html"},
        )
    limit = max(1, min(limit, 20))
    authorization = await optional_authorize_request()
    headers = (
        {"Authorization": f"Bearer {authorization.token}"}
        if authorization
        else None
    )
    data = await backend.get(
        f"/search?q={query}&limit={limit}", headers=headers
    )
    panel = SearchResultsPanel(
        query=query,
        total_matches=int(data.get("total", data.get("total_matches", 0))),
        results=[
            {
                "chapter_slug": item.get("slug", item.get("chapter_slug")),
                "chapter_title": item.get("title", item.get("chapter_title")),
                "excerpt": item.get("excerpt", ""),
                "accessible": item.get("accessible", True),
                "required_tier": item.get("required_tier"),
            }
            for item in data.get("results", [])
        ],
    )
    return ToolResult(
        content=[TextContent(type="text", text=f"Found {panel.total_matches} result(s) for '{panel.query}'.")],
        structured_content=panel.model_dump(),
        meta={"ui": {"resourceUri": "ui://widget/search-results.html"}, "openai/outputTemplate": "ui://widget/search-results.html"},
    )
