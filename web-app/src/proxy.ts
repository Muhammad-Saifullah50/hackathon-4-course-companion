import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  jwtExpiresAt,
  STYTCH_SESSION_COOKIE,
  STYTCH_SESSION_JWT_COOKIE,
} from "@/lib/auth-cookies";

const PROTECTED_PATHS = [
  "/dashboard",
  "/account",
  "/progress",
  "/search",
  "/oauth/authorize",
];

function hasSession(request: NextRequest): boolean {
  const jwt = request.cookies.get(STYTCH_SESSION_JWT_COOKIE)?.value;
  if (jwt) {
    const expiresAt = jwtExpiresAt(jwt);
    if (
      expiresAt !== null &&
      expiresAt > Math.floor(Date.now() / 1000)
    ) {
      return true;
    }
  }
  return request.cookies.has(STYTCH_SESSION_COOKIE);
}

function isProtected(pathname: string): boolean {
  return PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const authenticated = hasSession(request);

  if (pathname === "/" && authenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isProtected(pathname) && !authenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("return_to", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/account/:path*",
    "/progress/:path*",
    "/search/:path*",
    "/oauth/authorize/:path*",
  ],
};
