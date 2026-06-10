from fastmcp import Context
from mcp.types import TextContent
from fastmcp.tools import ToolResult
from fastmcp.apps import AppConfig

from ..client import backend
from ..main import mcp
from ..models.quiz import QuizPanel, QuizQuestion, QuizResult, QuestionResult


def _normalize_quiz_panel(data: dict) -> QuizPanel:
    """Normalize raw backend quiz response into QuizPanel model.

    Backend uses 'id' not 'question_id', options are objects not strings,
    and 'chapter_title'/'total_questions' are absent.
    """
    raw_questions = data.get("questions", [])
    questions = [
        QuizQuestion(
            question_id=q["id"],
            text=q["text"],
            options=[
                opt["text"] if isinstance(opt, dict) else opt
                for opt in q.get("options", [])
            ],
        )
        for q in raw_questions
    ]
    slug = data["chapter_slug"]
    return QuizPanel(
        chapter_slug=slug,
        chapter_title=data.get("chapter_title", slug.replace("-", " ").title()),
        questions=questions,
        total_questions=len(questions),
    )


def _normalize_quiz_result(data: dict) -> QuizResult:
    """Normalize raw backend submit response into QuizResult model.

    Backend uses 'is_correct' not 'correct'.
    """
    per_question = [
        QuestionResult(
            question_id=qr["question_id"],
            correct=qr.get("is_correct", qr.get("correct", False)),
            correct_answer=qr["correct_answer"],
        )
        for qr in data.get("per_question", [])
    ]
    return QuizResult(
        chapter_slug=data["chapter_slug"],
        score=data["score"],
        total=data["total"],
        percentage=data["percentage"],
        per_question=per_question,
    )


@mcp.tool(
    app=AppConfig(resource_uri="ui://widget/quiz-panel.html"),
)
async def get_quiz(chapter_slug: str = "") -> ToolResult:
    """Fetch the quiz for a given chapter.

    Args:
        chapter_slug: The URL-safe slug identifying the chapter (e.g. 'intro-to-agents').
                      Call list_chapters first to get available slugs.
    """
    if not chapter_slug:
        return ToolResult(
            content=[TextContent(type="text", text="Please call list_chapters first to find a chapter slug, then call get_quiz with it.")],
            structured_content={"error": {"message": "No chapter selected. Use list_chapters to browse available chapters."}},
            meta={"ui": {"resourceUri": "ui://widget/quiz-panel.html"}, "openai/outputTemplate": "ui://widget/quiz-panel.html"},
        )
    data = await backend.get(f"/quizzes/{chapter_slug}")
    panel = _normalize_quiz_panel(data)
    return ToolResult(
        content=[TextContent(type="text", text=f"Quiz ready: {panel.total_questions} questions.")],
        structured_content=panel.model_dump(),
        meta={"ui": {"resourceUri": "ui://widget/quiz-panel.html"}, "openai/outputTemplate": "ui://widget/quiz-panel.html"},
    )


@mcp.tool(
    app=AppConfig(resource_uri="ui://widget/quiz-panel.html"),
)
async def submit_quiz(
    chapter_slug: str = "",
    answers: dict[str, str] | None = None,
    ctx: Context = None,  # type: ignore[assignment]
) -> ToolResult:
    """Submit quiz answers for a given chapter.

    Args:
        chapter_slug: The URL-safe slug identifying the chapter.
        answers: Mapping of question_id to the chosen answer string.
        ctx: FastMCP request context (provides Bearer token for auth forwarding).
    """
    if not chapter_slug or not answers:
        return ToolResult(
            content=[TextContent(type="text", text="Please load a quiz with get_quiz first, then submit answers via the quiz widget.")],
            structured_content={"error": {"message": "Missing chapter or answers. Use get_quiz to load a quiz first."}},
            meta={"ui": {"resourceUri": "ui://widget/quiz-panel.html"}, "openai/outputTemplate": "ui://widget/quiz-panel.html"},
        )
    token: str | None = None
    try:
        token = ctx.auth_token  # type: ignore[attr-defined]
    except AttributeError:
        pass

    if token is None:
        try:
            auth = ctx.auth  # type: ignore[attr-defined]
            token = auth.token if auth else None
        except AttributeError:
            pass

    headers: dict[str, str] = (
        {"Authorization": f"Bearer {token}"} if token else {}
    )

    data = await backend.post(
        f"/quizzes/{chapter_slug}/submit",
        body=answers,
        headers=headers,
    )
    result = _normalize_quiz_result(data)
    return ToolResult(
        content=[TextContent(type="text", text=f"Score: {result.score}/{result.total} ({result.percentage:.0f}%).")],
        structured_content=result.model_dump(),
        meta={"ui": {"resourceUri": "ui://widget/quiz-panel.html"}, "openai/outputTemplate": "ui://widget/quiz-panel.html"},
    )
