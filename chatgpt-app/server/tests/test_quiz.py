"""Tests for quiz MCP tools (get_quiz, submit_quiz)."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.models.quiz import QuizPanel, QuizResult


SAMPLE_QUIZ_DATA = {
    "chapter_slug": "intro-to-agents",
    "chapter_title": "Introduction to AI Agents",
    "questions": [
        {
            "question_id": "q1",
            "text": "What is an AI agent?",
            "options": ["A robot", "An autonomous software system", "A database", "A compiler"],
        },
        {
            "question_id": "q2",
            "text": "Which SDK is used for Claude agents?",
            "options": ["LangChain", "AutoGPT", "Claude Agent SDK", "Hugging Face"],
        },
    ],
    "total_questions": 2,
}

SAMPLE_SUBMIT_RESULT = {
    "chapter_slug": "intro-to-agents",
    "score": 2,
    "total": 2,
    "percentage": 100.0,
    "per_question": [
        {"question_id": "q1", "correct": True, "correct_answer": "An autonomous software system"},
        {"question_id": "q2", "correct": True, "correct_answer": "Claude Agent SDK"},
    ],
}

SAMPLE_ANSWERS = {
    "q1": "An autonomous software system",
    "q2": "Claude Agent SDK",
}


@pytest.mark.asyncio
async def test_get_quiz_returns_quiz_panel():
    """get_quiz should call the backend and return a valid QuizPanel dict."""
    with patch("src.tools.quiz.backend") as mock_backend:
        mock_backend.get = AsyncMock(return_value=SAMPLE_QUIZ_DATA)

        from src.tools.quiz import get_quiz

        result = await get_quiz(chapter_slug="intro-to-agents")

        mock_backend.get.assert_called_once_with("/quizzes/intro-to-agents")

        # Validate the result is a valid QuizPanel
        panel = QuizPanel(**result)
        assert panel.chapter_slug == "intro-to-agents"
        assert panel.chapter_title == "Introduction to AI Agents"
        assert panel.total_questions == 2
        assert len(panel.questions) == 2
        assert panel.questions[0].question_id == "q1"
        assert panel.questions[1].question_id == "q2"


@pytest.mark.asyncio
async def test_get_quiz_propagates_http_error():
    """get_quiz should propagate backend HTTP errors."""
    import httpx

    with patch("src.tools.quiz.backend") as mock_backend:
        mock_request = MagicMock(spec=httpx.Request)
        mock_request.url = "http://backend/quizzes/missing"
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 404

        mock_backend.get = AsyncMock(
            side_effect=httpx.HTTPStatusError(
                "404 Not Found",
                request=mock_request,
                response=mock_response,
            )
        )

        from src.tools.quiz import get_quiz

        with pytest.raises(httpx.HTTPStatusError) as exc_info:
            await get_quiz(chapter_slug="missing-chapter")

        assert exc_info.value.response.status_code == 404


@pytest.mark.asyncio
async def test_submit_quiz_returns_quiz_result():
    """submit_quiz should call the backend with auth and return a valid QuizResult dict."""
    mock_ctx = MagicMock()
    mock_ctx.auth_token = "test-token-123"

    with patch("src.tools.quiz.backend") as mock_backend:
        mock_backend.post = AsyncMock(return_value=SAMPLE_SUBMIT_RESULT)

        from src.tools.quiz import submit_quiz

        result = await submit_quiz(
            chapter_slug="intro-to-agents",
            answers=SAMPLE_ANSWERS,
            ctx=mock_ctx,
        )

        mock_backend.post.assert_called_once_with(
            "/quizzes/intro-to-agents/submit",
            body=SAMPLE_ANSWERS,
            headers={"Authorization": "Bearer test-token-123"},
        )

        # Validate the result is a valid QuizResult
        quiz_result = QuizResult(**result)
        assert quiz_result.chapter_slug == "intro-to-agents"
        assert quiz_result.score == 2
        assert quiz_result.total == 2
        assert quiz_result.percentage == 100.0
        assert len(quiz_result.per_question) == 2
        assert quiz_result.per_question[0].correct is True
        assert quiz_result.per_question[1].correct is True


@pytest.mark.asyncio
async def test_submit_quiz_without_token_sends_no_auth_header():
    """submit_quiz should call backend without auth header when no token is available."""
    mock_ctx = MagicMock(spec=[])  # no attributes at all

    with patch("src.tools.quiz.backend") as mock_backend:
        mock_backend.post = AsyncMock(return_value=SAMPLE_SUBMIT_RESULT)

        from src.tools.quiz import submit_quiz

        await submit_quiz(
            chapter_slug="intro-to-agents",
            answers=SAMPLE_ANSWERS,
            ctx=mock_ctx,
        )

        mock_backend.post.assert_called_once_with(
            "/quizzes/intro-to-agents/submit",
            body=SAMPLE_ANSWERS,
            headers={},
        )


@pytest.mark.asyncio
async def test_submit_quiz_propagates_http_error():
    """submit_quiz should propagate backend HTTP errors."""
    import httpx

    mock_ctx = MagicMock()
    mock_ctx.auth_token = "test-token"

    with patch("src.tools.quiz.backend") as mock_backend:
        mock_request = MagicMock(spec=httpx.Request)
        mock_request.url = "http://backend/quizzes/intro-to-agents/submit"
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 401

        mock_backend.post = AsyncMock(
            side_effect=httpx.HTTPStatusError(
                "401 Unauthorized",
                request=mock_request,
                response=mock_response,
            )
        )

        from src.tools.quiz import submit_quiz

        with pytest.raises(httpx.HTTPStatusError) as exc_info:
            await submit_quiz(
                chapter_slug="intro-to-agents",
                answers=SAMPLE_ANSWERS,
                ctx=mock_ctx,
            )

        assert exc_info.value.response.status_code == 401
