"""Unit tests for the _update_streak pure helper — no DB or network access."""
from datetime import date
from unittest.mock import MagicMock

import pytest

from src.services.progress import _update_streak

DAY = date(2026, 6, 5)


def _make_user(current_streak: int = 0, last_active_date: date | None = None) -> MagicMock:
    user = MagicMock()
    user.current_streak = current_streak
    user.last_active_date = last_active_date
    return user


class TestUpdateStreak:
    def test_brand_new_user_streak_becomes_1(self) -> None:
        user = _make_user(current_streak=0, last_active_date=None)
        _update_streak(user, DAY)
        assert user.current_streak == 1
        assert user.last_active_date == DAY

    def test_two_consecutive_days_streak_becomes_2(self) -> None:
        yesterday = date(2026, 6, 4)
        user = _make_user(current_streak=1, last_active_date=yesterday)
        _update_streak(user, DAY)
        assert user.current_streak == 2
        assert user.last_active_date == DAY

    def test_same_day_second_completion_streak_unchanged(self) -> None:
        user = _make_user(current_streak=3, last_active_date=DAY)
        _update_streak(user, DAY)
        assert user.current_streak == 3
        assert user.last_active_date == DAY

    def test_one_day_gap_resets_to_1(self) -> None:
        two_days_ago = date(2026, 6, 3)
        user = _make_user(current_streak=5, last_active_date=two_days_ago)
        _update_streak(user, DAY)
        assert user.current_streak == 1
        assert user.last_active_date == DAY

    def test_multi_day_gap_resets_to_1(self) -> None:
        week_ago = date(2026, 5, 29)
        user = _make_user(current_streak=10, last_active_date=week_ago)
        _update_streak(user, DAY)
        assert user.current_streak == 1
        assert user.last_active_date == DAY

    def test_multiple_completions_same_day_count_once(self) -> None:
        user = _make_user(current_streak=1, last_active_date=DAY)
        _update_streak(user, DAY)
        _update_streak(user, DAY)
        _update_streak(user, DAY)
        assert user.current_streak == 1
        assert user.last_active_date == DAY
