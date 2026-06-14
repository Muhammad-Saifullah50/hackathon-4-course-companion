export const STYTCH_SESSION_COOKIE = "stytch_session";
export const STYTCH_SESSION_JWT_COOKIE = "stytch_session_jwt";
export const STYTCH_INTERMEDIATE_SESSION_COOKIE =
  "stytch_intermediate_session_token";

export const STYTCH_COOKIE_NAMES = [
  STYTCH_SESSION_COOKIE,
  STYTCH_SESSION_JWT_COOKIE,
  STYTCH_INTERMEDIATE_SESSION_COOKIE,
] as const;

export function jwtExpiresAt(token: string): number | null {
  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(
      Buffer.from(normalized, "base64").toString("utf8"),
    ) as { exp?: unknown };
    return typeof decoded.exp === "number" ? decoded.exp : null;
  } catch {
    return null;
  }
}
