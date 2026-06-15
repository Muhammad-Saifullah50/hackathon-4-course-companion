import json
from pathlib import Path
from unittest.mock import MagicMock

import pytest
from botocore.exceptions import ClientError
from httpx import AsyncClient

from src.core.config import settings
from src.models.content import Manifest
from src.services.content import (
    ChapterNotFoundError,
    ContentService,
    MediaNotFoundError,
    ServiceUnavailableError,
)
from tests.conftest import SAMPLE_CHAPTER_BODY, SAMPLE_MANIFEST

# ============================================================
# US1: GET /chapters — List all chapters
# ============================================================


async def test_list_chapters_returns_5_in_order(client: AsyncClient) -> None:
    resp = await client.get("/chapters")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 5
    orders = [c["order"] for c in data]
    assert orders == sorted(orders)


async def test_list_chapters_fields(client: AsyncClient) -> None:
    resp = await client.get("/chapters")
    assert resp.status_code == 200
    chapter = resp.json()[0]
    assert "slug" in chapter
    assert "title" in chapter
    assert "order" in chapter
    assert chapter["accessible"] is True
    assert chapter["required_tier"] is None
    assert chapter["slug"] == "claude-agent-sdk-foundations"
    locked = resp.json()[3]
    assert locked["accessible"] is False
    assert locked["required_tier"] == "premium"


async def test_list_chapters_503_when_manifest_unavailable(service: ContentService) -> None:
    service._s3.get_object.side_effect = Exception("R2 down")
    service._manifest_cache = None
    service._manifest_loaded_at = 0.0

    from httpx import ASGITransport, AsyncClient as _AC
    from src.main import app
    from src.core.dependencies import get_content_service

    app.dependency_overrides[get_content_service] = lambda: service
    async with _AC(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/chapters")
    app.dependency_overrides.clear()

    assert resp.status_code == 503


# ============================================================
# US2: GET /chapters/{slug} — Read a chapter
# ============================================================


async def test_get_chapter_valid_slug(client: AsyncClient) -> None:
    resp = await client.get("/chapters/mcp-introduction")
    assert resp.status_code == 200
    data = resp.json()
    assert data["slug"] == "mcp-introduction"
    assert data["title"] == "MCP Introduction"
    assert data["order"] == 3
    assert "content" in data
    assert "next_slug" in data
    assert "prev_slug" in data


async def test_get_chapter_first_has_no_prev(client: AsyncClient) -> None:
    resp = await client.get("/chapters/claude-agent-sdk-foundations")
    assert resp.status_code == 200
    assert resp.json()["prev_slug"] is None


async def test_get_locked_chapter_requires_upgrade(client: AsyncClient) -> None:
    resp = await client.get("/chapters/agent-skills")
    assert resp.status_code == 403
    assert resp.json()["detail"] == {
        "code": "upgrade_required",
        "resource": "chapter:agent-skills",
        "required_tier": "premium",
    }


async def test_get_chapter_middle_has_both_nav(client: AsyncClient) -> None:
    resp = await client.get("/chapters/mcp-introduction")
    assert resp.status_code == 200
    data = resp.json()
    assert data["prev_slug"] == "claude-agent-sdk-advanced"
    assert data["next_slug"] == "mcp-building-servers"


async def test_get_chapter_unknown_slug_returns_404(client: AsyncClient) -> None:
    resp = await client.get("/chapters/does-not-exist")
    assert resp.status_code == 404


async def test_get_chapter_manifest_slug_missing_r2_file(service: ContentService) -> None:
    def get_object_fail_chapter(Bucket: str, Key: str) -> dict:
        if Key == "manifest.json":
            body = MagicMock()
            body.read.return_value = json.dumps(SAMPLE_MANIFEST.model_dump()).encode()
            return {"Body": body}
        raise ClientError({"Error": {"Code": "NoSuchKey", "Message": "Not found"}}, "GetObject")

    service._s3.get_object.side_effect = get_object_fail_chapter
    service._manifest_cache = None
    service._manifest_loaded_at = 0.0

    from httpx import ASGITransport, AsyncClient as _AC
    from src.main import app
    from src.core.dependencies import get_content_service

    app.dependency_overrides[get_content_service] = lambda: service
    async with _AC(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/chapters/mcp-introduction")
    app.dependency_overrides.clear()

    assert resp.status_code == 404


# ============================================================
# US3: GET /chapters/{slug}/next and /prev — Navigation
# ============================================================


async def test_next_chapter_middle(client: AsyncClient) -> None:
    resp = await client.get("/chapters/mcp-introduction/next")
    assert resp.status_code == 200
    assert resp.json()["slug"] == "mcp-building-servers"


async def test_prev_chapter_middle(client: AsyncClient) -> None:
    resp = await client.get("/chapters/mcp-introduction/prev")
    assert resp.status_code == 200
    assert resp.json()["slug"] == "claude-agent-sdk-advanced"


async def test_next_chapter_last_returns_404(client: AsyncClient) -> None:
    resp = await client.get("/chapters/agent-skills/next")
    assert resp.status_code == 404


async def test_prev_chapter_first_returns_404(client: AsyncClient) -> None:
    resp = await client.get("/chapters/claude-agent-sdk-foundations/prev")
    assert resp.status_code == 404


async def test_next_unknown_slug_returns_404(client: AsyncClient) -> None:
    resp = await client.get("/chapters/nonexistent/next")
    assert resp.status_code == 404


# ============================================================
# US4: GET /chapters/{slug}/media/{filename} — Signed URL
# ============================================================


async def test_media_signed_url_valid(service: ContentService) -> None:
    fake_url = "https://r2.example.com/signed-url?token=abc"
    service._s3.generate_presigned_url.return_value = fake_url

    from httpx import ASGITransport, AsyncClient as _AC
    from src.main import app
    from src.core.dependencies import get_content_service

    app.dependency_overrides[get_content_service] = lambda: service
    async with _AC(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/chapters/mcp-introduction/media/diagram.png")
    app.dependency_overrides.clear()

    assert resp.status_code == 200
    data = resp.json()
    assert data["url"] == fake_url
    assert "expires_at" in data


async def test_media_unknown_file_returns_404(service: ContentService) -> None:
    service._s3.generate_presigned_url.side_effect = ClientError(
        {"Error": {"Code": "NoSuchKey", "Message": "Not found"}}, "GeneratePresignedUrl"
    )

    from httpx import ASGITransport, AsyncClient as _AC
    from src.main import app
    from src.core.dependencies import get_content_service

    app.dependency_overrides[get_content_service] = lambda: service
    async with _AC(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/chapters/mcp-introduction/media/no-such-file.png")
    app.dependency_overrides.clear()

    assert resp.status_code == 404


# ============================================================
# Service unit tests
# ============================================================


async def test_content_service_load_manifest(service: ContentService) -> None:
    manifest = await service.load_manifest()
    assert len(manifest.chapters) == 5
    assert manifest.chapters[0].slug == "claude-agent-sdk-foundations"


async def test_content_service_manifest_cache(service: ContentService) -> None:
    await service.load_manifest()
    call_count = service._s3.get_object.call_count
    await service.load_manifest()
    assert service._s3.get_object.call_count == call_count  # no additional call


async def test_content_service_chapter_body(service: ContentService) -> None:
    body = await service.get_chapter_body("mcp-introduction")
    assert "Test Chapter" in body


async def test_content_service_loads_local_content(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    manifest = SAMPLE_MANIFEST.model_dump_json()
    chapter_dir = tmp_path / "chapters"
    chapter_dir.mkdir()
    (tmp_path / "manifest.json").write_text(manifest, encoding="utf-8")
    (chapter_dir / "mcp-introduction.md").write_text(
        SAMPLE_CHAPTER_BODY,
        encoding="utf-8",
    )
    monkeypatch.setattr(settings, "use_local_content", True)
    monkeypatch.setattr(settings, "local_content_path", tmp_path)

    service = ContentService()

    loaded = await service.load_manifest()
    body = await service.get_chapter_body("mcp-introduction")

    assert len(loaded.chapters) == 5
    assert body == SAMPLE_CHAPTER_BODY
    assert service._s3 is None


async def test_content_service_duplicate_slug_dedup(service: ContentService) -> None:
    dup_manifest = {
        "chapters": [
            {"slug": "dup-slug", "title": "First", "order": 1},
            {"slug": "dup-slug", "title": "Second", "order": 2},
            {"slug": "unique", "title": "Unique", "order": 3},
        ]
    }
    body = MagicMock()
    body.read.return_value = json.dumps(dup_manifest).encode()
    service._s3.get_object.side_effect = None
    service._s3.get_object.return_value = {"Body": body}
    service._manifest_cache = None
    service._manifest_loaded_at = 0.0

    manifest = await service.load_manifest()
    slugs = [e.slug for e in manifest.chapters]
    assert slugs.count("dup-slug") == 1
    assert len(slugs) == 2
