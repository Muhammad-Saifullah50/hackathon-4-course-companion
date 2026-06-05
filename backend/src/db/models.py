from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, SmallInteger, String, UniqueConstraint, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    access_tier: Mapped[str] = mapped_column(String(32), nullable=False, default="free")
    current_streak: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_active_date: Mapped[date | None] = mapped_column(Date, nullable=True)


class ChapterProgress(Base):
    __tablename__ = "chapter_progress"
    __table_args__ = (UniqueConstraint("user_id", "chapter_slug", name="uq_chapter_progress_user_chapter"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    chapter_slug: Mapped[str] = mapped_column(String(128), nullable=False)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    quiz_score: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
