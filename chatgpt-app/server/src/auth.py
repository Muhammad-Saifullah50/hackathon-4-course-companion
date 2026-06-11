from dataclasses import dataclass
from urllib.parse import urlsplit, urlunsplit

from fastmcp.server.auth.providers.jwt import JWTVerifier
from fastmcp.server.dependencies import get_http_headers
from fastmcp.tools import ToolResult
from mcp.types import TextContent

from .core.config import settings

SCOPES = ["openid"]
NOAUTH_SECURITY = [{"type": "noauth"}]
OAUTH_SECURITY = [{"type": "oauth2", "scopes": SCOPES}]

auth_provider = JWTVerifier(
    jwks_uri=f"{settings.stytch_project_domain}/.well-known/jwks.json",
    issuer=settings.stytch_project_domain,
    algorithm="RS256",
    audience=settings.stytch_project_id,
)


@dataclass(frozen=True)
class AuthorizedRequest:
    token: str
    user_id: str


def protected_resource_url() -> str:
    resource = urlsplit(settings.mcp_server_base_url)
    origin = urlunsplit((resource.scheme, resource.netloc, "", "", ""))
    return f"{origin}/.well-known/oauth-protected-resource"


def authorization_challenge() -> str:
    return (
        'Bearer error="invalid_token", '
        'error_description="Authentication required", '
        f'resource_metadata="{protected_resource_url()}"'
    )


def _result_meta(
    resource_uri: str | None,
    *,
    challenge: bool = False,
) -> dict[str, object]:
    meta: dict[str, object] = {}
    if challenge:
        meta["mcp/www_authenticate"] = [authorization_challenge()]
    if resource_uri is not None:
        meta["ui"] = {"resourceUri": resource_uri}
        meta["openai/outputTemplate"] = resource_uri
    return meta


def authentication_required(resource_uri: str | None = None) -> ToolResult:
    return ToolResult(
        content=[TextContent(type="text", text="Sign in to use this feature.")],
        structured_content={"error": {"message": "Authentication required."}},
        meta=_result_meta(resource_uri, challenge=True),
        is_error=True,
    )


def downstream_authentication_failed(
    resource_uri: str | None = None,
) -> ToolResult:
    """Return a non-challenge error for a token already validated by MCP."""
    return ToolResult(
        content=[
            TextContent(
                type="text",
                text="The backend rejected a valid app token. Check the server authentication configuration.",
            )
        ],
        structured_content={
            "error": {
                "message": "Backend authentication configuration error."
            }
        },
        meta=_result_meta(resource_uri),
        is_error=True,
    )


async def authorize_request(
    resource_uri: str | None = None,
    context: object | None = None,
) -> AuthorizedRequest | ToolResult:
    authorization = get_http_headers(
        include={"authorization"}
    ).get("authorization", "")
    scheme, _, token = authorization.partition(" ")
    if not token and context is not None:
        token = str(getattr(context, "auth_token", "") or "")
        auth = getattr(context, "auth", None)
        if not token and auth is not None:
            token = str(getattr(auth, "token", "") or "")
        if token:
            scheme = "Bearer"
    if scheme.lower() != "bearer" or not token:
        return authentication_required(resource_uri)

    try:
        access_token = await auth_provider.verify_token(token)
    except Exception:
        return authentication_required(resource_uri)
    if access_token is None:
        return authentication_required(resource_uri)

    user_id = str(access_token.claims.get("sub", ""))
    if not user_id:
        return authentication_required(resource_uri)
    return AuthorizedRequest(token=token, user_id=user_id)
