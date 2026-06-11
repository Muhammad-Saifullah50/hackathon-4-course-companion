import httpx
from fastmcp import Context
from mcp.types import TextContent
from fastmcp.tools import ToolResult
from fastmcp.apps import AppConfig

from ..client import backend
from ..main import mcp
from ..auth import (
    OAUTH_SECURITY,
    authorize_request,
    downstream_authentication_failed,
)
from ..models.quiz import QuizPanel, QuizQuestion, QuizResult, QuestionResult
from ..tool_metadata import (
    MUTATING_ANNOTATIONS,
    READ_ONLY_ANNOTATIONS,
    output_schema,
)

QUIZ_RESOURCE_URI = "ui://widget/quiz-panel.html"


def _quiz_meta() -> dict:
    return {
        "ui": {"resourceUri": QUIZ_RESOURCE_URI},
        "openai/outputTemplate": QUIZ_RESOURCE_URI,
    }


def _quiz_error(message: str, *, include_widget: bool = True) -> ToolResult:
    return ToolResult(
        content=[TextContent(type="text", text=message)],
        structured_content={"error": {"message": message}},
        meta=_quiz_meta() if include_widget else {},
        is_error=True,
    )


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


def _option_maps(question: dict) -> tuple[dict[str, str], dict[str, str]]:
    label_by_text: dict[str, str] = {}
    text_by_label: dict[str, str] = {}
    for option in question.get("options", []):
        if isinstance(option, dict):
            label = str(option.get("label", ""))
            text = str(option.get("text", ""))
        else:
            label = str(option)
            text = str(option)
        if label and text:
            label_by_text[text] = label
            text_by_label[label] = text
    return label_by_text, text_by_label


def _validate_answers(
    questions: list[dict], answers: dict[str, str]
) -> str | None:
    question_ids = {str(question["id"]) for question in questions}
    missing_ids = question_ids - answers.keys()
    if missing_ids:
        return f"Please answer every question before submitting. Missing: {', '.join(sorted(missing_ids))}."

    unknown_ids = answers.keys() - question_ids
    if unknown_ids:
        return f"Unknown quiz question IDs: {', '.join(sorted(unknown_ids))}."

    for question in questions:
        question_id = str(question["id"])
        label_by_text, text_by_label = _option_maps(question)
        answer = answers[question_id]
        if answer not in label_by_text and answer not in text_by_label:
            return f"Answer for {question_id} is not one of the available options."
    return None


async def _grade_answers(
    chapter_slug: str,
    questions: list[dict],
    answers: dict[str, str],
    headers: dict[str, str],
) -> QuizResult:
    per_question: list[QuestionResult] = []
    for question in questions:
        question_id = str(question["id"])
        label_by_text, text_by_label = _option_maps(question)
        selected_answer = answers[question_id]
        selected_label = label_by_text.get(selected_answer, selected_answer)
        graded = await backend.post(
            f"/quizzes/{chapter_slug}/submit",
            body={
                "question_id": question_id,
                "selected_answer": selected_label,
            },
            headers=headers,
        )
        correct_label = str(graded["correct_answer"])
        per_question.append(
            QuestionResult(
                question_id=question_id,
                correct=bool(graded["is_correct"]),
                correct_answer=text_by_label.get(correct_label, correct_label),
            )
        )

    score = sum(result.correct for result in per_question)
    total = len(per_question)
    percentage = score / total * 100 if total else 0.0
    return QuizResult(
        chapter_slug=chapter_slug,
        score=score,
        total=total,
        percentage=percentage,
        per_question=per_question,
    )


@mcp.tool(
    app=AppConfig(
        resource_uri=QUIZ_RESOURCE_URI,
        visibility=["model", "app"],
    ),
    meta={"securitySchemes": OAUTH_SECURITY},
    output_schema=output_schema(QuizPanel),
    annotations=READ_ONLY_ANNOTATIONS,
)
async def get_quiz(chapter_slug: str) -> ToolResult:
    """Fetch the quiz for a given chapter.

    Args:
        chapter_slug: The URL-safe slug identifying the chapter (e.g. 'intro-to-agents').
                      Call list_chapters first to get available slugs.
    """
    if not chapter_slug:
        return _quiz_error(
            "No chapter selected. Use list_chapters to browse available chapters."
        )
    authorization = await authorize_request(QUIZ_RESOURCE_URI)
    if isinstance(authorization, ToolResult):
        return authorization
    data = await backend.get(f"/quizzes/{chapter_slug}")
    panel = _normalize_quiz_panel(data)
    return ToolResult(
        content=[TextContent(type="text", text=f"Quiz ready: {panel.total_questions} questions.")],
        structured_content=panel.model_dump(),
        meta=_quiz_meta(),
    )


@mcp.tool(
    app=AppConfig(
        visibility=["app"],
    ),
    meta={"securitySchemes": OAUTH_SECURITY},
    output_schema=output_schema(QuizResult),
    annotations=MUTATING_ANNOTATIONS,
)
async def submit_quiz(
    chapter_slug: str,
    answers: dict[str, str],
    ctx: Context | None = None,
) -> ToolResult:
    """Submit quiz answers for a given chapter.

    Args:
        chapter_slug: The URL-safe slug identifying the chapter.
        answers: Mapping of question_id to the chosen answer string.
    """
    if not chapter_slug or not answers:
        return _quiz_error(
            "Missing chapter or answers. Use get_quiz to load a quiz first.",
            include_widget=False,
        )
    authorization = await authorize_request(context=ctx)
    if isinstance(authorization, ToolResult):
        return authorization
    headers = {"Authorization": f"Bearer {authorization.token}"}

    quiz = await backend.get(f"/quizzes/{chapter_slug}")
    questions = quiz.get("questions", [])
    validation_error = _validate_answers(questions, answers)
    if validation_error:
        return _quiz_error(validation_error, include_widget=False)

    try:
        result = await _grade_answers(
            chapter_slug,
            questions,
            answers,
            headers,
        )
        await backend.put(
            f"/users/{authorization.user_id}/progress"
            f"?chapter_slug={chapter_slug}",
            body={"quiz_score": round(result.percentage)},
            headers=headers,
        )
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 401:
            return downstream_authentication_failed()
        raise
    return ToolResult(
        content=[TextContent(type="text", text=f"Score: {result.score}/{result.total} ({result.percentage:.0f}%).")],
        structured_content=result.model_dump(),
        meta={},
    )
