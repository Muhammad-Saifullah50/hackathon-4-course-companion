"""add progress and streaks

Revision ID: 002
Revises: 001
Create Date: 2026-06-05

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: Union[str, Sequence[str], None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("current_streak", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("users", sa.Column("last_active_date", sa.Date(), nullable=True))

    op.create_table(
        "chapter_progress",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "user_id",
            sa.String(64),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("chapter_slug", sa.String(128), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("quiz_score", sa.SmallInteger(), nullable=True),
        sa.UniqueConstraint("user_id", "chapter_slug", name="uq_chapter_progress_user_chapter"),
    )
    op.create_index("ix_chapter_progress_user_id", "chapter_progress", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_chapter_progress_user_id", table_name="chapter_progress")
    op.drop_table("chapter_progress")
    op.drop_column("users", "last_active_date")
    op.drop_column("users", "current_streak")
