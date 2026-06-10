from fastmcp import Context
from mcp.types import TextContent
from fastmcp.tools import ToolResult
from fastmcp.apps import AppConfig

from ..main import mcp
from ..client import backend
from ..models.progress import ProgressPanel


@mcp.tool(
    app=AppConfig(resource_uri="ui://widget/progress-dashboard.html"),
)
async def get_progress(ctx: Context) -> ToolResult:
    """Get progress for the authenticated user, including streak and chapter completion."""
    auth = getattr(ctx, "auth", None)
    token = None
    user_id = "me"
    if auth is not None:
        token = getattr(auth, "token", getattr(auth, "access_token", None))
        claims = getattr(auth, "claims", {}) or {}
        user_id = claims.get("sub", "me")
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    data = await backend.get(f"/users/{user_id}/progress", headers=headers)
    panel = ProgressPanel(**data)
    return ToolResult(
        content=[TextContent(type="text", text=f"Streak: {panel.current_streak} days, {panel.completion_percentage:.0f}% complete.")],
        structured_content=panel.model_dump(),
        meta={"ui": {"resourceUri": "ui://widget/progress-dashboard.html"}, "openai/outputTemplate": "ui://widget/progress-dashboard.html"},
    )
