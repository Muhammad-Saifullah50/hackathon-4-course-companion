import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from src.main import app
from src.models.content import Manifest, ManifestEntry
from src.services.content import ContentService

SAMPLE_MANIFEST = Manifest(
    chapters=[
        ManifestEntry(slug="claude-agent-sdk-foundations", title="Claude Agent SDK Foundations", order=1),
        ManifestEntry(slug="claude-agent-sdk-advanced", title="Claude Agent SDK Advanced", order=2),
        ManifestEntry(slug="mcp-introduction", title="MCP Introduction", order=3),
        ManifestEntry(slug="mcp-building-servers", title="MCP Building Servers", order=4),
        ManifestEntry(slug="agent-skills", title="Agent Skills", order=5),
    ]
)

SAMPLE_CHAPTER_BODY = "# Test Chapter\n\n## Introduction\nTest content.\n"


@pytest.fixture
def sample_manifest() -> Manifest:
    return SAMPLE_MANIFEST


@pytest.fixture
def mock_r2_client() -> MagicMock:
    client = MagicMock()
    manifest_body = MagicMock()
    manifest_body.read.return_value = json.dumps(SAMPLE_MANIFEST.model_dump()).encode()
    client.get_object.return_value = {"Body": manifest_body}

    chapter_body = MagicMock()
    chapter_body.read.return_value = SAMPLE_CHAPTER_BODY.encode()

    def get_object_side_effect(Bucket: str, Key: str) -> dict:
        if Key == "manifest.json":
            body = MagicMock()
            body.read.return_value = json.dumps(SAMPLE_MANIFEST.model_dump()).encode()
            return {"Body": body}
        if Key.startswith("chapters/") and Key.endswith(".md"):
            body = MagicMock()
            body.read.return_value = SAMPLE_CHAPTER_BODY.encode()
            return {"Body": body}
        from botocore.exceptions import ClientError
        raise ClientError({"Error": {"Code": "NoSuchKey", "Message": "Not found"}}, "GetObject")

    client.get_object.side_effect = get_object_side_effect
    return client


@pytest_asyncio.fixture
async def service(mock_r2_client: MagicMock) -> ContentService:
    svc = ContentService()
    svc._s3 = mock_r2_client
    return svc


@pytest_asyncio.fixture
async def client(service: ContentService) -> AsyncClient:
    from src.core.dependencies import get_content_service

    app.dependency_overrides[get_content_service] = lambda: service
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
