"use client";

import { useStytchSession, useStytchUser } from "@stytch/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AccountScreen() {
  const router = useRouter();
  const { session, isInitialized } = useStytchSession();
  const { user } = useStytchUser();

  useEffect(() => {
    if (isInitialized && !session) {
      router.replace("/login?return_to=%2Faccount");
    }
  }, [isInitialized, router, session]);

  if (!isInitialized || !session || !user) {
    return <main className="flex min-h-screen items-center justify-center">Loading...</main>;
  }

  const email = user.emails[0]?.email ?? "No email available";

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-12">
      <section className="w-full rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
          Account
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-zinc-950">{email}</h1>
        <dl className="mt-8 grid gap-4 rounded-2xl bg-zinc-50 p-5 text-sm">
          <div>
            <dt className="text-zinc-500">Stytch user ID</dt>
            <dd className="mt-1 break-all font-mono text-zinc-900">{user.user_id}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Session expires</dt>
            <dd className="mt-1 text-zinc-900">{session.expires_at}</dd>
          </div>
        </dl>
        <div className="mt-8 flex gap-3">
          <Link
            href="/"
            className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold"
          >
            Home
          </Link>
          <Link
            href="/logout"
            className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Sign out
          </Link>
        </div>
      </section>
    </main>
  );
}
