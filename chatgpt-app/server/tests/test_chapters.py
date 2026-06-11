import pytest
from unittest.mock import AsyncMock, patch


MOCK_CHAPTERS_LIST = [
    {
        "slug": "intro",
        "title": "Introduction",
        "order": 1,
    },
    {
        "slug": "agents-101",
        "title": "Agents 101",
        "order": 2,
    },
]

MOCK_CHAPTER_DETAIL = {
    "slug": "intro",
    "title": "Introduction",
    "content": "Welcome to the course.",
    "order": 1,
    "next_slug": "agents-101",
    "prev_slug": None,
}


@pytest.mark.asyncio
async def test_list_chapters_returns_chapter_summaries():
    with patch("src.tools.chapters.backend") as mock_backend:
        mock_backend.get = AsyncMock(return_value=MOCK_CHAPTERS_LIST)

        from src.tools.chapters import list_chapters

        result = await list_chapters()

    assert result.structured_content is not None
    assert len(result.structured_content["chapters"]) == 2
    first = result.structured_content["chapters"][0]
    assert first["slug"] == "intro"
    assert first["title"] == "Introduction"
    assert first["order"] == 1


@pytest.mark.asyncio
async def test_get_chapter_returns_chapter_panel():
    with patch("src.tools.chapters.backend") as mock_backend:
        mock_backend.get = AsyncMock(return_value=MOCK_CHAPTER_DETAIL)

        from src.tools.chapters import get_chapter

        result = await get_chapter("intro")

    assert result.structured_content is not None
    assert result.structured_content["slug"] == "intro"
    assert result.structured_content["title"] == "Introduction"
    assert result.structured_content["content"] == "Welcome to the course."
    assert result.structured_content["next_slug"] == "agents-101"
    assert result.structured_content["prev_slug"] is None


@pytest.mark.asyncio
async def test_get_chapter_raises_for_missing_slug():
    import httpx

    mock_response = httpx.Response(404, request=httpx.Request("GET", "http://test/chapters/missing"))
    not_found_error = httpx.HTTPStatusError(
        "404 Not Found",
        request=mock_response.request,
        response=mock_response,
    )

    with patch("src.tools.chapters.backend") as mock_backend:
        mock_backend.get = AsyncMock(side_effect=not_found_error)

        from src.tools.chapters import get_chapter

        with pytest.raises(ValueError, match="Chapter 'missing' not found"):
            await get_chapter("missing")
