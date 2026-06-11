from src.main import get_app
from src.ui import widget_origin

PUBLIC_TOOLS = {"list_chapters", "get_chapter", "search_content"}
PROTECTED_TOOLS = {
    "get_quiz",
    "submit_quiz",
    "get_progress",
    "check_access",
}
REQUIRED_ARGUMENTS = {
    "get_chapter": {"slug"},
    "get_quiz": {"chapter_slug"},
    "submit_quiz": {"chapter_slug", "answers"},
    "search_content": {"query"},
}


async def test_tool_descriptors_are_submission_ready() -> None:
    tools = {
        tool.name: tool.to_mcp_tool().model_dump(
            by_alias=True,
            exclude_none=True,
        )
        for tool in await get_app().list_tools()
    }

    assert set(tools) == PUBLIC_TOOLS | PROTECTED_TOOLS
    for name, descriptor in tools.items():
        assert descriptor["outputSchema"]["type"] == "object"
        assert "anyOf" in descriptor["outputSchema"]
        assert descriptor["annotations"]["openWorldHint"] is False

        security = descriptor["_meta"]["securitySchemes"]
        if name in PUBLIC_TOOLS:
            assert security == [{"type": "noauth"}]
        else:
            assert security == [{"type": "oauth2", "scopes": ["openid"]}]

        visibility = descriptor["_meta"]["ui"]["visibility"]
        assert visibility == (
            ["app"] if name == "submit_quiz" else ["model", "app"]
        )

    for name, required in REQUIRED_ARGUMENTS.items():
        assert set(tools[name]["inputSchema"]["required"]) == required

    assert tools["submit_quiz"]["annotations"]["readOnlyHint"] is False
    assert tools["submit_quiz"]["annotations"]["idempotentHint"] is False
    assert "resourceUri" not in tools["submit_quiz"]["_meta"]["ui"]
    assert "openai/outputTemplate" not in tools["submit_quiz"]["_meta"]
    assert tools["get_quiz"]["_meta"]["ui"]["resourceUri"] == (
        "ui://widget/quiz-panel.html"
    )
    for name in set(tools) - {"submit_quiz"}:
        assert tools[name]["annotations"]["readOnlyHint"] is True
        assert tools[name]["annotations"]["idempotentHint"] is True


async def test_widget_resources_include_csp_and_domain() -> None:
    resources = [
        resource.to_mcp_resource().model_dump(
            by_alias=True,
            exclude_none=True,
        )
        for resource in await get_app().list_resources()
    ]

    assert len(resources) == 6
    for resource in resources:
        meta = resource["_meta"]
        assert meta["ui"]["domain"] == widget_origin()
        assert meta["ui"]["csp"] == {
            "connectDomains": [],
            "resourceDomains": [],
            "frameDomains": [],
        }
        assert meta["openai/widgetDomain"] == widget_origin()
        assert meta["openai/widgetCSP"]["connect_domains"] == []
        assert meta["openai/widgetCSP"]["resource_domains"] == []
        assert meta["openai/widgetCSP"]["frame_domains"] == []
