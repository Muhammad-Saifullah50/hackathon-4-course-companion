import httpx
from fastmcp import Context
from mcp.types import TextContent
from fastmcp.tools import ToolResult
from fastmcp.apps import AppConfig

from ..main import mcp
from ..client import backend
from ..core.config import settings
from ..models.access import AccessStatusPanel


@mcp.tool(
    app=AppConfig(resource_uri="ui://widget/access-status.html"),
)
async def check_access(ctx: Context) -> ToolResult:
    """Check the authenticated user's access tier."""
    auth = getattr(ctx, "auth", None)
    token = None
    if auth is not None:
        token = getattr(auth, "token", getattr(auth, "access_token", None))
    headers = {"Authorization": f"Bearer {token}"} if token else {}

    try:
        data = await backend.get("/access/check", headers=headers)
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            panel = AccessStatusPanel(tier="free", allowed=True)
            if settings.upgrade_url:
                panel = panel.model_copy(update={"upgrade_url": settings.upgrade_url})
            return ToolResult(
                content=[TextContent(type="text", text="Free tier — sign in to check your access.")],
                structured_content=panel.model_dump(),
                meta={"ui": {"resourceUri": "ui://widget/access-status.html"}, "openai/outputTemplate": "ui://widget/access-status.html"},
            )
        raise

    panel = AccessStatusPanel(**data)
    if panel.tier == "free" and settings.upgrade_url:
        panel = panel.model_copy(update={"upgrade_url": settings.upgrade_url})

    return ToolResult(
        content=[TextContent(type="text", text=f"Account tier: {panel.tier}.")],
        structured_content=panel.model_dump(),
        meta={"ui": {"resourceUri": "ui://widget/access-status.html"}, "openai/outputTemplate": "ui://widget/access-status.html"},
    )
