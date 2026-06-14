import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  STYTCH_COOKIE_NAMES,
  STYTCH_SESSION_COOKIE,
} from "@/lib/auth-cookies";
import { safeReturnTo } from "@/lib/auth-navigation";

const backendUrl =
  process.env.BACKEND_URL?.replace(/\/$/, "") ??
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";

async function revokeCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(STYTCH_SESSION_COOKIE)?.value;
  if (token) {
    await fetch(`${backendUrl}/auth/logout`, {
      method: "POST",
      headers: { "X-Stytch-Session": token },
      cache: "no-store",
    }).catch(() => undefined);
  }
}

function clearStytchCookies(response: NextResponse): NextResponse {
  for (const name of STYTCH_COOKIE_NAMES) {
    response.cookies.set(name, "", {
      expires: new Date(0),
      path: "/",
      httpOnly: false,
      sameSite: "lax",
    });
  }
  return response;
}

export async function GET(request: NextRequest) {
  await revokeCurrentSession();
  const returnTo = safeReturnTo(
    request.nextUrl.searchParams.get("return_to") ?? "/login",
  );
  return clearStytchCookies(
    NextResponse.redirect(new URL(returnTo, request.url)),
  );
}

export async function POST() {
  await revokeCurrentSession();
  return clearStytchCookies(new NextResponse(null, { status: 204 }));
}
