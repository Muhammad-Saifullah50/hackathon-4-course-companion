import os
from fastmcp import FastMCP
from fastmcp.resources import FunctionResource
from .ui import load_widget, WIDGET_NAMES

_auth = None
if os.getenv("ENABLE_AUTH", "false").lower() == "true":
    from .auth import auth_provider
    _auth = auth_provider

mcp = FastMCP(name="Course Companion", auth=_auth)


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
            )
        )


_register_widget_resources()


def get_app() -> FastMCP:
    from .tools import chapters, quiz, progress, search, access  # noqa: F401
    return mcp
