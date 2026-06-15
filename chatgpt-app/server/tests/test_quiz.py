"""Tests for quiz MCP tools (get_quiz, submit_quiz)."""

from unittest.mock import AsyncMock, MagicMock, call, patch

import pytest

from src.auth import AuthorizedRequest
from src.models.quiz import QuizPanel, QuizResult


SAMPLE_QUIZ_DATA = {
    "chapter_slug": "intro-to-agents",
    "chapter_title": "Introduction to AI Agents",
    "questions": [
        {
            "id": "q1",
            "text": "What is an AI agent?",
            "options": [
                {"label": "A", "text": "A robot"},
                {"label": "B", "text": "An autonomous software system"},
                {"label": "C", "text": "A database"},
                {"label": "D", "text": "A compiler"},
            ],
        },
        {
            "id": "q2",
            "text": "Which SDK is used for Claude agents?",
            "options": [
                {"label": "A", "text": "LangChain"},
                {"label": "B", "text": "AutoGPT"},
                {"label": "C", "text": "Claude Agent SDK"},
                {"label": "D", "text": "Hugging Face"},
            ],
        },
    ],
}

SAMPLE_ANSWERS = {
    "q1": "An autonomous software system",
    "q2": "Claude Agent SDK",
}

AUTHORIZED = AuthorizedRequest(token="test-token-123", user_id="user-123")


@pytest.mark.asyncio
async def test_get_quiz_returns_quiz_panel():
    """get_quiz should call the backend and return a valid QuizPanel dict."""
    with (
        patch("src.tools.quiz.backend") as mock_backend,
        patch(
            "src.tools.quiz.optional_authorize_request",
            new=AsyncMock(return_value=AUTHORIZED),
        ),
    ):
        mock_backend.get = AsyncMock(return_value=SAMPLE_QUIZ_DATA)

        from src.tools.quiz import get_quiz

        result = await get_quiz(chapter_slug="intro-to-agents")

        mock_backend.get.assert_called_once_with(
            "/quizzes/intro-to-agents",
            headers={"Authorization": "Bearer test-token-123"},
        )

        # Validate the result is a valid QuizPanel
        panel = QuizPanel(**result.structured_content)
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

    with (
        patch("src.tools.quiz.backend") as mock_backend,
        patch(
            "src.tools.quiz.optional_authorize_request",
            new=AsyncMock(return_value=AUTHORIZED),
        ),
    ):
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
    """submit_quiz should translate text answers and aggregate backend results."""
    with (
        patch("src.tools.quiz.backend") as mock_backend,
        patch(
            "src.tools.quiz.optional_authorize_request",
            new=AsyncMock(return_value=AUTHORIZED),
        ),
    ):
        mock_backend.get = AsyncMock(return_value=SAMPLE_QUIZ_DATA)
        mock_backend.post = AsyncMock(
            side_effect=[
                {
                    "question_id": "q1",
                    "is_correct": True,
                    "correct_answer": "B",
                    "explanation": "Agents act autonomously.",
                },
                {
                    "question_id": "q2",
                    "is_correct": False,
                    "correct_answer": "C",
                    "explanation": "The expected SDK is Claude Agent SDK.",
                },
            ]
        )
        mock_backend.put = AsyncMock(return_value={})

        from src.tools.quiz import submit_quiz

        result = await submit_quiz(
            chapter_slug="intro-to-agents",
            answers={
                "q1": "An autonomous software system",
                "q2": "AutoGPT",
            },
        )

        mock_backend.get.assert_awaited_once_with(
            "/quizzes/intro-to-agents",
            headers={"Authorization": "Bearer test-token-123"},
        )
        assert mock_backend.post.await_args_list == [
            call(
                "/quizzes/intro-to-agents/submit",
                body={"question_id": "q1", "selected_answer": "B"},
                headers={"Authorization": "Bearer test-token-123"},
            ),
            call(
                "/quizzes/intro-to-agents/submit",
                body={"question_id": "q2", "selected_answer": "B"},
                headers={"Authorization": "Bearer test-token-123"},
            ),
        ]
        mock_backend.put.assert_awaited_once_with(
            "/users/user-123/progress?chapter_slug=intro-to-agents",
            body={"quiz_score": 50},
            headers={"Authorization": "Bearer test-token-123"},
        )

        quiz_result = QuizResult(**result.structured_content)
        assert quiz_result.chapter_slug == "intro-to-agents"
        assert quiz_result.score == 1
        assert quiz_result.total == 2
        assert quiz_result.percentage == 50.0
        assert len(quiz_result.per_question) == 2
        assert quiz_result.per_question[0].correct is True
        assert quiz_result.per_question[0].correct_answer == "An autonomous software system"
        assert quiz_result.per_question[1].correct is False
        assert quiz_result.per_question[1].correct_answer == "Claude Agent SDK"
        assert quiz_result.saved is True
        assert result.meta == {}


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("answers", "expected_message"),
    [
        ({"q1": "A robot"}, "Missing: q2"),
        ({**SAMPLE_ANSWERS, "q3": "Unknown"}, "Unknown quiz question IDs: q3"),
        (
            {"q1": "Not an option", "q2": "Claude Agent SDK"},
            "Answer for q1 is not one of the available options.",
        ),
    ],
)
async def test_submit_quiz_returns_structured_validation_errors(
    answers: dict[str, str], expected_message: str
):
    """Invalid batch answers should return a widget error without grading."""
    with (
        patch("src.tools.quiz.backend") as mock_backend,
        patch(
            "src.tools.quiz.optional_authorize_request",
            new=AsyncMock(return_value=AUTHORIZED),
        ),
    ):
        mock_backend.get = AsyncMock(return_value=SAMPLE_QUIZ_DATA)
        mock_backend.post = AsyncMock()
        mock_backend.put = AsyncMock()

        from src.tools.quiz import submit_quiz

        result = await submit_quiz(
            chapter_slug="intro-to-agents",
            answers=answers,
        )

        assert result.is_error is True
        assert result.meta == {}
        assert expected_message in result.structured_content["error"]["message"]
        mock_backend.post.assert_not_awaited()
        mock_backend.put.assert_not_awaited()


@pytest.mark.asyncio
async def test_submit_quiz_backend_401_returns_configuration_error():
    """A backend auth mismatch should not restart the OAuth flow."""
    import httpx

    with (
        patch("src.tools.quiz.backend") as mock_backend,
        patch(
            "src.tools.quiz.optional_authorize_request",
            new=AsyncMock(return_value=AUTHORIZED),
        ),
    ):
        mock_request = MagicMock(spec=httpx.Request)
        mock_request.url = "http://backend/quizzes/intro-to-agents/submit"
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 401

        mock_backend.get = AsyncMock(return_value=SAMPLE_QUIZ_DATA)
        mock_backend.post = AsyncMock(
            side_effect=httpx.HTTPStatusError(
                "401 Unauthorized",
                request=mock_request,
                response=mock_response,
            )
        )
        mock_backend.put = AsyncMock()

        from src.tools.quiz import submit_quiz

        result = await submit_quiz(
            chapter_slug="intro-to-agents",
            answers=SAMPLE_ANSWERS,
        )

        assert result.is_error is True
        assert "mcp/www_authenticate" not in result.meta
        assert "ui" not in result.meta
        assert "openai/outputTemplate" not in result.meta
        assert result.structured_content["error"]["message"] == (
            "Backend authentication configuration error."
        )
        mock_backend.put.assert_not_awaited()


@pytest.mark.asyncio
async def test_submit_quiz_progress_401_returns_configuration_error():
    """A rejected progress write returns an app-only structured error."""
    import httpx

    with (
        patch("src.tools.quiz.backend") as mock_backend,
        patch(
            "src.tools.quiz.optional_authorize_request",
            new=AsyncMock(return_value=AUTHORIZED),
        ),
    ):
        mock_backend.get = AsyncMock(return_value=SAMPLE_QUIZ_DATA)
        mock_backend.post = AsyncMock(
            return_value={
                "question_id": "q1",
                "is_correct": True,
                "correct_answer": "B",
            }
        )
        request = httpx.Request("PUT", "http://backend/users/user-123/progress")
        response = httpx.Response(401, request=request)
        mock_backend.put = AsyncMock(
            side_effect=httpx.HTTPStatusError(
                "401 Unauthorized",
                request=request,
                response=response,
            )
        )

        from src.tools.quiz import submit_quiz

        result = await submit_quiz(
            chapter_slug="intro-to-agents",
            answers=SAMPLE_ANSWERS,
        )

    assert result.is_error is True
    assert result.meta == {}
    assert result.structured_content["error"]["message"] == (
        "Backend authentication configuration error."
    )


@pytest.mark.asyncio
async def test_submit_quiz_anonymously_does_not_save_progress():
    """Free anonymous quiz attempts are graded without a progress write."""
    with (
        patch("src.tools.quiz.backend") as mock_backend,
        patch(
            "src.tools.quiz.optional_authorize_request",
            new=AsyncMock(return_value=None),
        ),
    ):
        mock_backend.get = AsyncMock(return_value=SAMPLE_QUIZ_DATA)
        mock_backend.post = AsyncMock(
            return_value={
                "question_id": "q1",
                "is_correct": True,
                "correct_answer": "B",
            }
        )
        mock_backend.put = AsyncMock()

        from src.tools.quiz import submit_quiz

        result = await submit_quiz(
            chapter_slug="intro-to-agents",
            answers=SAMPLE_ANSWERS,
        )

    quiz_result = QuizResult(**result.structured_content)
    assert quiz_result.saved is False
    mock_backend.put.assert_not_awaited()
