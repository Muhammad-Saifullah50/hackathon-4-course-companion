from fastmcp.server.auth.providers.jwt import JWTVerifier

from .core.config import settings

auth_provider = JWTVerifier(
    jwks_uri=f"{settings.stytch_project_domain}/.well-known/jwks.json",
    issuer=settings.stytch_project_domain,
    algorithm="RS256",
    audience=settings.stytch_project_id,
)
