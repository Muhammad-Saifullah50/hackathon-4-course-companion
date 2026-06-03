import json
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import pytest
import pytest_asyncio
from botocore.exceptions import ClientError
from httpx import ASGITransport, AsyncClient

from src.main import app
from src.models.quiz import (
    AnswerOption,
    AnswerSubmission,
    GradedResult,
    QuestionPublic,
    QuizFile,
    QuizPublic,
)
from src.services.quiz import QuizNotFoundError, QuizService, QuizValidationError
from src.services.content import ServiceUnavailableError
from src.core.dependencies import get_quiz_service

# ------------------------------------------------------------------ fixtures

SAMPLE_QUIZ_PUBLIC = QuizPublic(
    chapter_slug="mcp-introduction",
    questions=[
        QuestionPublic(
            id="q1",
            text="What does MCP stand for?",
            options=[
                AnswerOption(label="A", text="Model Context Protocol"),
                AnswerOption(label="B", text="Multi-Channel Processing"),
            ],
        )
    ],
)

SAMPLE_GRADED_CORRECT = GradedResult(
    question_id="q1",
    is_correct=True,
    correct_answer="A",
    explanation="MCP stands for Model Context Protocol.",
)

SAMPLE_GRADED_INCORRECT = GradedResult(
    question_id="q1",
    is_correct=False,
    correct_answer="A",
    explanation="MCP stands for Model Context Protocol.",
)


@pytest_asyncio.fixture
async def mock_quiz_service() -> QuizService:
    svc = MagicMock(spec=QuizService)
    svc.get_quiz_public = AsyncMock(return_value=SAMPLE_QUIZ_PUBLIC)
    svc.grade_submission = AsyncMock(return_value=SAMPLE_GRADED_CORRECT)
    return svc


@pytest_asyncio.fixture
async def quiz_client(mock_quiz_service: QuizService) -> AsyncClient:
    app.dependency_overrides[get_quiz_service] = lambda: mock_quiz_service
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


# ============================================================
# US1: GET /quizzes/{chapter_slug}
# ============================================================


async def test_get_quiz_happy_path(quiz_client: AsyncClient) -> None:
    resp = await quiz_client.get("/quizzes/mcp-introduction")
    assert resp.status_code == 200
    data = resp.json()
    assert data["chapter_slug"] == "mcp-introduction"
    assert "questions" in data
    assert len(data["questions"]) > 0
    for q in data["questions"]:
        assert "correct_answer" not in q
        assert "explanation" not in q


async def test_get_quiz_404(mock_quiz_service: QuizService, quiz_client: AsyncClient) -> None:
    mock_quiz_service.get_quiz_public.side_effect = QuizNotFoundError("Quiz not found for chapter: unknown")
    resp = await quiz_client.get("/quizzes/unknown")
    assert resp.status_code == 404
    assert "detail" in resp.json()


async def test_get_quiz_503(mock_quiz_service: QuizService, quiz_client: AsyncClient) -> None:
    mock_quiz_service.get_quiz_public.side_effect = ServiceUnavailableError("R2 unavailable")
    resp = await quiz_client.get("/quizzes/mcp-introduction")
    assert resp.status_code == 503


# ============================================================
# US2: POST /quizzes/{chapter_slug}/submit
# ============================================================


async def test_submit_correct_answer(mock_quiz_service: QuizService, quiz_client: AsyncClient) -> None:
    mock_quiz_service.grade_submission.return_value = SAMPLE_GRADED_CORRECT
    resp = await quiz_client.post(
        "/quizzes/mcp-introduction/submit",
        json={"question_id": "q1", "selected_answer": "A"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["question_id"] == "q1"
    assert data["is_correct"] is True
    assert "correct_answer" in data
    assert "explanation" in data


async def test_submit_incorrect_answer(mock_quiz_service: QuizService, quiz_client: AsyncClient) -> None:
    mock_quiz_service.grade_submission.return_value = SAMPLE_GRADED_INCORRECT
    resp = await quiz_client.post(
        "/quizzes/mcp-introduction/submit",
        json={"question_id": "q1", "selected_answer": "B"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_correct"] is False
    assert "correct_answer" in data
    assert "explanation" in data


async def test_submit_unknown_question_id(mock_quiz_service: QuizService, quiz_client: AsyncClient) -> None:
    mock_quiz_service.grade_submission.side_effect = QuizValidationError(
        "Question 'q99' not found in quiz for chapter: mcp-introduction"
    )
    resp = await quiz_client.post(
        "/quizzes/mcp-introduction/submit",
        json={"question_id": "q99", "selected_answer": "A"},
    )
    assert resp.status_code == 400
    assert "detail" in resp.json()


async def test_submit_404_missing_quiz(mock_quiz_service: QuizService, quiz_client: AsyncClient) -> None:
    mock_quiz_service.grade_submission.side_effect = QuizNotFoundError("Quiz not found for chapter: unknown")
    resp = await quiz_client.post(
        "/quizzes/unknown/submit",
        json={"question_id": "q1", "selected_answer": "A"},
    )
    assert resp.status_code == 404


# ============================================================
# US3: Schema validation for all 5 quiz JSON files
# ============================================================

QUIZ_CONTENT_DIR = Path(__file__).resolve().parents[2] / "content" / "quizzes"

QUIZ_FILES = [
    "mcp-introduction.json",
    "claude-agent-sdk-foundations.json",
    "claude-agent-sdk-advanced.json",
    "mcp-building-servers.json",
    "agent-skills.json",
]


async def test_quiz_schema_validation() -> None:
    for filename in QUIZ_FILES:
        path = QUIZ_CONTENT_DIR / filename
        assert path.exists(), f"Missing quiz file: {path}"
        data = json.loads(path.read_text())
        quiz = QuizFile.model_validate(data)
        assert len(quiz.questions) >= 1, f"{filename}: must have at least 1 question"


# ============================================================
# QuizService unit tests (direct, with mocked boto3 client)
# ============================================================

SAMPLE_QUIZ_FILE_DICT = {
    "chapter_slug": "mcp-introduction",
    "questions": [
        {
            "id": "q1",
            "text": "What does MCP stand for?",
            "options": [
                {"label": "A", "text": "Model Context Protocol"},
                {"label": "B", "text": "Multi-Channel Processing"},
            ],
            "correct_answer": "A",
            "explanation": "MCP stands for Model Context Protocol.",
        }
    ],
}


@pytest_asyncio.fixture
async def quiz_service_with_r2() -> QuizService:
    svc = QuizService()
    mock_s3 = MagicMock()
    body = MagicMock()
    body.read.return_value = json.dumps(SAMPLE_QUIZ_FILE_DICT).encode()
    mock_s3.get_object.return_value = {"Body": body}
    svc._s3 = mock_s3
    return svc


async def test_service_get_quiz_public_strips_answers(quiz_service_with_r2: QuizService) -> None:
    result = await quiz_service_with_r2.get_quiz_public("mcp-introduction")
    assert result.chapter_slug == "mcp-introduction"
    assert len(result.questions) == 1
    q = result.questions[0]
    assert q.id == "q1"
    assert not hasattr(q, "correct_answer") or "correct_answer" not in q.model_fields_set


async def test_service_fetch_quiz_not_found(quiz_service_with_r2: QuizService) -> None:
    quiz_service_with_r2._s3.get_object.side_effect = ClientError(
        {"Error": {"Code": "NoSuchKey", "Message": "Not found"}}, "GetObject"
    )
    with pytest.raises(QuizNotFoundError):
        await quiz_service_with_r2.get_quiz_public("unknown-chapter")


async def test_service_fetch_quiz_r2_error_raises_503(quiz_service_with_r2: QuizService) -> None:
    quiz_service_with_r2._s3.get_object.side_effect = ClientError(
        {"Error": {"Code": "InternalError", "Message": "Server error"}}, "GetObject"
    )
    with pytest.raises(ServiceUnavailableError):
        await quiz_service_with_r2.get_quiz_public("mcp-introduction")


async def test_service_retry_succeeds_on_second_attempt(quiz_service_with_r2: QuizService) -> None:
    body = MagicMock()
    body.read.return_value = json.dumps(SAMPLE_QUIZ_FILE_DICT).encode()
    call_count = 0

    def flaky_get_object(**kwargs: object) -> dict:
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            raise ClientError({"Error": {"Code": "InternalError", "Message": "Transient"}}, "GetObject")
        return {"Body": body}

    quiz_service_with_r2._s3.get_object.side_effect = flaky_get_object
    result = await quiz_service_with_r2.get_quiz_public("mcp-introduction")
    assert result.chapter_slug == "mcp-introduction"
    assert call_count == 2


async def test_service_grade_correct_answer(quiz_service_with_r2: QuizService) -> None:
    result = await quiz_service_with_r2.grade_submission(
        "mcp-introduction", AnswerSubmission(question_id="q1", selected_answer="A")
    )
    assert result.is_correct is True
    assert result.correct_answer == "A"
    assert result.explanation == "MCP stands for Model Context Protocol."


async def test_service_grade_incorrect_answer(quiz_service_with_r2: QuizService) -> None:
    result = await quiz_service_with_r2.grade_submission(
        "mcp-introduction", AnswerSubmission(question_id="q1", selected_answer="B")
    )
    assert result.is_correct is False
    assert result.correct_answer == "A"


async def test_service_grade_unknown_question_raises_validation_error(
    quiz_service_with_r2: QuizService,
) -> None:
    with pytest.raises(QuizValidationError, match="q99"):
        await quiz_service_with_r2.grade_submission(
            "mcp-introduction", AnswerSubmission(question_id="q99", selected_answer="A")
        )


async def test_service_r2_client_lazy_init() -> None:
    svc = QuizService()
    assert svc._s3 is None
    # Accessing _r2 property triggers lazy init — we can't call boto3 without real credentials
    # so just confirm that assigning _s3 directly bypasses boto3
    svc._s3 = MagicMock()
    assert svc._r2 is svc._s3
