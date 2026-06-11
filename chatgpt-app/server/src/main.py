from fastmcp import FastMCP
from fastmcp.resources import FunctionResource
from starlette.requests import Request
from starlette.responses import JSONResponse

from .auth import SCOPES
from .core.config import settings
from .ui import load_widget, widget_resource_meta, WIDGET_NAMES

mcp = FastMCP(name="Course Companion")


@mcp.custom_route(
    "/.well-known/oauth-protected-resource",
    methods=["GET", "OPTIONS"],
)
async def oauth_protected_resource(_: Request) -> JSONResponse:
    base_url = settings.mcp_server_base_url.rstrip("/")
    return JSONResponse(
        {
            "resource": base_url,
            "authorization_servers": [
                settings.stytch_project_domain.rstrip("/")
            ],
            "scopes_supported": SCOPES,
        },
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Authorization, Content-Type",
        },
    )


def _register_widget_resources() -> None:
    """Register each compiled widget as a concrete ``ui://`` resource.

    Concrete resources appear in ``resources/list`` (the channel MCP Apps
    clients use to discover widgets); a templated resource would only show up
    in ``resources/templates/list`` and never be picked up.
    """
    def _make_loader(widget_name: str):
        def _serve() -> str:
            return load_widget(f"{widget_name}.html")
        return _serve

    for name in WIDGET_NAMES:
        mcp.add_resource(
            FunctionResource.from_function(
                _make_loader(name),
                uri=f"ui://widget/{name}.html",
                name=name,
                mime_type="text/html;profile=mcp-app",
                meta=widget_resource_meta(),
            )
        )


_register_widget_resources()


def get_app() -> FastMCP:
    from .tools import chapters, quiz, progress, search, access  # noqa: F401
    return mcp
