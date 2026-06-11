import httpx
from fastmcp import Context
from mcp.types import TextContent
from fastmcp.tools import ToolResult
from fastmcp.apps import AppConfig

from ..main import mcp
from ..client import backend
from ..core.config import settings
from ..models.access import AccessStatusPanel
from ..tool_metadata import READ_ONLY_ANNOTATIONS, output_schema
from ..auth import (
    OAUTH_SECURITY,
    authorize_request,
    downstream_authentication_failed,
)


@mcp.tool(
    app=AppConfig(
        resource_uri="ui://widget/access-status.html",
        visibility=["model", "app"],
    ),
    meta={"securitySchemes": OAUTH_SECURITY},
    output_schema=output_schema(AccessStatusPanel),
    annotations=READ_ONLY_ANNOTATIONS,
)
async def check_access(ctx: Context | None = None) -> ToolResult:
    """Check the authenticated user's access tier."""
    authorization = await authorize_request(
        "ui://widget/access-status.html", ctx
    )
    if isinstance(authorization, ToolResult):
        return authorization
    headers = {"Authorization": f"Bearer {authorization.token}"}
    try:
        data = await backend.get("/access/check", headers=headers)
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 401:
            return downstream_authentication_failed(
                "ui://widget/access-status.html"
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
