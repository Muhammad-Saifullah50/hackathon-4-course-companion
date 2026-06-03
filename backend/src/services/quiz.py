import asyncio
import json
import logging
from typing import Any

import boto3
from botocore.exceptions import ClientError

from src.core.config import settings
from src.models.quiz import (
    AnswerSubmission,
    GradedResult,
    QuestionPublic,
    QuizFile,
    QuizPublic,
)
from src.services.content import ServiceUnavailableError

logger = logging.getLogger(__name__)


class QuizNotFoundError(Exception):
    pass


class QuizValidationError(Exception):
    pass


class QuizService:
    def __init__(self) -> None:
        self._s3: Any = None

    @property
    def _r2(self) -> Any:
        if self._s3 is None:
            self._s3 = boto3.client(
                "s3",
                endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
                aws_access_key_id=settings.r2_access_key_id,
                aws_secret_access_key=settings.r2_secret_access_key,
                region_name="auto",
            )
        return self._s3

    def _fetch_quiz_from_r2(self, chapter_slug: str) -> QuizFile:
        key = f"quizzes/{chapter_slug}.json"
        try:
            obj = self._r2.get_object(Bucket=settings.r2_bucket_name, Key=key)
            raw = json.loads(obj["Body"].read())
            return QuizFile.model_validate(raw)
        except ClientError as exc:
            error_code = exc.response["Error"]["Code"]
            if error_code in ("NoSuchKey", "404"):
                raise QuizNotFoundError(f"Quiz not found for chapter: {chapter_slug}") from exc
            logger.error("R2 error fetching quiz %s: %s", chapter_slug, exc)
            raise ServiceUnavailableError(f"Could not fetch quiz: {chapter_slug}") from exc
        except Exception as exc:
            logger.error("Unexpected error fetching quiz %s: %s", chapter_slug, exc)
            raise ServiceUnavailableError(f"Could not fetch quiz: {chapter_slug}") from exc

    async def _fetch_with_retry(self, chapter_slug: str) -> QuizFile:
        try:
            return await asyncio.to_thread(self._fetch_quiz_from_r2, chapter_slug)
        except (ServiceUnavailableError,):
            pass
        try:
            return await asyncio.to_thread(self._fetch_quiz_from_r2, chapter_slug)
        except ServiceUnavailableError:
            raise ServiceUnavailableError(f"Quiz service unavailable for chapter: {chapter_slug}")

    async def get_quiz_public(self, chapter_slug: str) -> QuizPublic:
        quiz = await self._fetch_with_retry(chapter_slug)
        return QuizPublic(
            chapter_slug=quiz.chapter_slug,
            questions=[
                QuestionPublic(id=q.id, text=q.text, options=q.options)
                for q in quiz.questions
            ],
        )

    async def grade_submission(self, chapter_slug: str, submission: AnswerSubmission) -> GradedResult:
        quiz = await self._fetch_with_retry(chapter_slug)
        question = next((q for q in quiz.questions if q.id == submission.question_id), None)
        if question is None:
            raise QuizValidationError(
                f"Question '{submission.question_id}' not found in quiz for chapter: {chapter_slug}"
            )
        return GradedResult(
            question_id=submission.question_id,
            is_correct=submission.selected_answer == question.correct_answer,
            correct_answer=question.correct_answer,
            explanation=question.explanation,
        )
