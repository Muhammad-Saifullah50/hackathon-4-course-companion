import pytest
from unittest.mock import AsyncMock, patch


MOCK_CHAPTERS_LIST = [
    {
        "slug": "intro",
        "title": "Introduction",
        "chapter_number": 1,
        "completed": False,
    },
    {
        "slug": "agents-101",
        "title": "Agents 101",
        "chapter_number": 2,
        "completed": True,
    },
]

MOCK_CHAPTER_DETAIL = {
    "slug": "intro",
    "title": "Introduction",
    "content_html": "<p>Welcome to the course.</p>",
    "chapter_number": 1,
    "next_slug": "agents-101",
    "prev_slug": None,
    "has_quiz": True,
}


@pytest.mark.asyncio
async def test_list_chapters_returns_chapter_summaries():
    with patch("src.tools.chapters.backend") as mock_backend:
        mock_backend.get = AsyncMock(return_value=MOCK_CHAPTERS_LIST)

        from src.tools.chapters import list_chapters

        result = await list_chapters()

    assert "chapters" in result
    assert len(result["chapters"]) == 2
    first = result["chapters"][0]
    assert first["slug"] == "intro"
    assert first["title"] == "Introduction"
    assert first["chapter_number"] == 1
    assert first["completed"] is False


@pytest.mark.asyncio
async def test_get_chapter_returns_chapter_panel():
    with patch("src.tools.chapters.backend") as mock_backend:
        mock_backend.get = AsyncMock(return_value=MOCK_CHAPTER_DETAIL)

        from src.tools.chapters import get_chapter

        result = await get_chapter("intro")

    assert result["slug"] == "intro"
    assert result["title"] == "Introduction"
    assert result["content_html"] == "<p>Welcome to the course.</p>"
    assert result["next_slug"] == "agents-101"
    assert result["prev_slug"] is None
    assert result["has_quiz"] is True


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
