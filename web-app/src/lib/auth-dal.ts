import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { AuthSession } from "@/lib/api-types";
import { STYTCH_SESSION_COOKIE } from "@/lib/auth-cookies";

const backendUrl =
  process.env.BACKEND_URL?.replace(/\/$/, "") ??
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";

async function readSessionToken(): Promise<string | null> {
  return (await cookies()).get(STYTCH_SESSION_COOKIE)?.value ?? null;
}

async function authenticate(token: string): Promise<AuthSession | null> {
  const response = await fetch(`${backendUrl}/auth/session`, {
    headers: { "X-Stytch-Session": token },
    cache: "no-store",
  });
  if (response.status === 401) return null;
  if (!response.ok) {
    throw new Error("Authentication service is temporarily unavailable.");
  }
  return (await response.json()) as AuthSession;
}

interface ServerAuthContext {
  session: AuthSession | null;
  token: string | null;
}

const getServerAuthContext = cache(async (): Promise<ServerAuthContext> => {
  const token = await readSessionToken();
  return {
    session: token ? await authenticate(token) : null,
    token,
  };
});

export const getOptionalSession = cache(async (): Promise<AuthSession | null> => {
  return (await getServerAuthContext()).session;
});

export const verifySession = cache(async (): Promise<AuthSession> => {
  const { session, token } = await getServerAuthContext();
  if (!token) redirect("/login");

  if (!session) {
    redirect("/api/auth/logout?return_to=%2Flogin");
  }
  return session;
});

export async function getServerSessionToken(): Promise<string> {
  const { session, token } = await getServerAuthContext();
  if (!token) redirect("/login");
  if (!session) redirect("/api/auth/logout?return_to=%2Flogin");
  return token;
}
