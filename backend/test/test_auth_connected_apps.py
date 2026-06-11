from unittest.mock import MagicMock, patch

from fastapi.security import HTTPAuthorizationCredentials

from src.core.auth import get_current_user


def test_connected_app_token_resolves_same_stytch_user():
    client = MagicMock()
    client.sessions.authenticate_jwt.side_effect = ValueError("not a session")
    client.users.get.return_value.user = type(
        "User",
        (),
        {"emails": [type("Email", (), {"email": "learner@example.com"})()]},
    )()

    signing_key = MagicMock(key="public-key")
    jwks_client = MagicMock()
    jwks_client.get_signing_key_from_jwt.return_value = signing_key

    with (
        patch("src.core.auth.get_stytch_client", return_value=client),
        patch(
            "src.core.auth.get_connected_apps_jwks_client",
            return_value=jwks_client,
        ),
        patch("src.core.auth.jwt.decode", return_value={"sub": "user-test"}),
    ):
        user = get_current_user(
            HTTPAuthorizationCredentials(
                scheme="Bearer", credentials="connected-app-token"
            )
        )

    assert user.user_id == "user-test"
    assert user.email == "learner@example.com"
