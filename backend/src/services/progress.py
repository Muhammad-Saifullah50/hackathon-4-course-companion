from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import ChapterProgress, User
from src.models.progress import CompletionResponse, ProgressEntry, ProgressResponse
from src.services.content import ContentService


def _update_streak(user: User, today_utc: date) -> None:
    """Apply the four-condition streak state machine to the user row in-place."""
    last = user.last_active_date

    if last is None:
        user.current_streak = 1
        user.last_active_date = today_utc
    elif last == today_utc:
        pass  # already completed today — no-op
    elif last == today_utc - timedelta(days=1):
        user.current_streak += 1
        user.last_active_date = today_utc
    else:
        user.current_streak = 1
        user.last_active_date = today_utc


class ProgressService:
    async def record_completion(
        self,
        user_id: str,
        chapter_slug: str,
        quiz_score: int | None,
        current_user_id: str,
        session: AsyncSession,
        content_service: ContentService,
    ) -> CompletionResponse:
        if current_user_id != user_id:
            raise HTTPException(status_code=403, detail="Forbidden")

        manifest = await content_service.load_manifest()
        known_slugs = {e.slug for e in manifest.chapters}
        if chapter_slug not in known_slugs:
            raise HTTPException(status_code=404, detail=f"Unknown chapter: {chapter_slug}")

        now = datetime.now(tz=timezone.utc)
        today_utc = now.date()

        stmt = pg_insert(ChapterProgress).values(
            user_id=user_id,
            chapter_slug=chapter_slug,
            completed_at=now,
            quiz_score=quiz_score,
        ).on_conflict_do_update(
            index_elements=["user_id", "chapter_slug"],
            set_={"completed_at": now, "quiz_score": quiz_score},
        )
        await session.execute(stmt)

        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")

        _update_streak(user, today_utc)
        await session.commit()

        return CompletionResponse(
            user_id=user_id,
            chapter_slug=chapter_slug,
            completed_at=now,
            quiz_score=quiz_score,
            current_streak=user.current_streak,
        )

    async def get_progress(
        self,
        user_id: str,
        current_user_id: str,
        session: AsyncSession,
    ) -> ProgressResponse:
        if current_user_id != user_id:
            raise HTTPException(status_code=403, detail="Forbidden")

        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")

        rows = await session.execute(
            select(ChapterProgress).where(ChapterProgress.user_id == user_id)
        )
        completions = [
            ProgressEntry(
                chapter_slug=row.chapter_slug,
                completed_at=row.completed_at,
                quiz_score=row.quiz_score,
            )
            for row in rows.scalars().all()
        ]

        return ProgressResponse(
            user_id=user_id,
            completions=completions,
            current_streak=user.current_streak,
            last_active_date=user.last_active_date,
        )
