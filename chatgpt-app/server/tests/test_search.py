import pytest
from unittest.mock import AsyncMock, patch


MOCK_SEARCH_RESPONSE = {
    "query": "mcp",
    "total_matches": 2,
    "results": [
        {
            "chapter_slug": "intro-to-mcp",
            "chapter_title": "Introduction to MCP",
            "excerpt": "MCP stands for Model Context Protocol...",
        },
        {
            "chapter_slug": "mcp-advanced",
            "chapter_title": "Advanced MCP Patterns",
            "excerpt": "Building production MCP servers requires...",
        },
    ],
}


@pytest.mark.asyncio
async def test_search_content_returns_search_results_panel():
    with patch("src.tools.search.backend") as mock_backend:
        mock_backend.get = AsyncMock(return_value=MOCK_SEARCH_RESPONSE)

        from src.tools.search import search_content

        result = await search_content("mcp")

    assert result["query"] == "mcp"
    assert result["total_matches"] == 2
    assert len(result["results"]) == 2
    first = result["results"][0]
    assert first["chapter_slug"] == "intro-to-mcp"
    assert first["chapter_title"] == "Introduction to MCP"
    assert "excerpt" in first


@pytest.mark.asyncio
async def test_search_content_raises_for_empty_query():
    from src.tools.search import search_content

    with pytest.raises(ValueError, match="Search query cannot be empty"):
        await search_content("")


@pytest.mark.asyncio
async def test_search_content_clamps_limit_to_20():
    with patch("src.tools.search.backend") as mock_backend:
        mock_backend.get = AsyncMock(return_value={**MOCK_SEARCH_RESPONSE, "query": "x"})

        from src.tools.search import search_content

        await search_content("x", limit=50)

    mock_backend.get.assert_called_once()
    call_url: str = mock_backend.get.call_args[0][0]
    assert "limit=20" in call_url
