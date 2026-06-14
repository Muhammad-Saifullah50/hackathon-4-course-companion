"use client";

import { Calendar, Check, Copy, ExternalLink, LogOut, Mail, Shield, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import type { AccessStatus, AuthSession, UserProfile } from "@/lib/api-types";

export function AccountScreen({
  access,
  profile,
  session,
}: {
  access: AccessStatus;
  profile: UserProfile;
  session: AuthSession;
}) {
  const [copied, setCopied] = useState(false);

  async function copyId() {
    if (!profile) return;
    await navigator.clipboard.writeText(profile.id);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
      <div className="mx-auto max-w-[680px] px-5 py-10">
        <p className="eyebrow mb-2">Account</p><h1 className="mb-7 text-2xl font-semibold">Account settings</h1>
        <div className="grid gap-4">
          <section className="surface-card p-6">
            <div className="mb-5 flex items-center gap-3"><span className="avatar h-11 w-11 text-lg">{profile.email.charAt(0).toUpperCase()}</span><div><strong>{profile.email}</strong><p className="muted text-sm">Course Companion learner</p></div></div>
            <div className="account-details">
              <div><Mail size={15} /><span><small>Email</small>{profile.email}</span></div>
              <div><Calendar size={15} /><span><small>Member since</small>{new Date(profile.created_at).toLocaleDateString()}</span></div>
              <div><User size={15} /><span className="min-w-0"><small>User ID</small><code>{profile.id}</code></span><button onClick={copyId}>{copied ? <Check size={14} /> : <Copy size={14} />}</button></div>
              <div><Shield size={15} /><span><small>Tier</small>{access.tier}</span><em>Premium coming later</em></div>
            </div>
          </section>
          <section className="surface-card p-6">
            <h2 className="font-semibold">ChatGPT integration</h2>
            <p className="muted mt-2 text-sm leading-6">Use this same account when connecting Course Companion in ChatGPT. The consent screen grants profile, progress, and quiz score access.</p>
            <a className="mt-4 inline-flex items-center gap-1 text-sm text-[var(--emerald)]" href="https://chatgpt.com" target="_blank" rel="noreferrer">Open ChatGPT <ExternalLink size={12} /></a>
          </section>
          <section className="surface-card flex items-center justify-between p-6"><div><h2 className="font-semibold">Appearance</h2><p className="muted mt-1 text-sm">Follow your system or choose manually.</p></div><ThemeToggle showLabel /></section>
          <section className="surface-card p-6">
            <h2 className="font-semibold">Session</h2>
            <p className="muted mt-2 text-sm">
              {session.expires_at
                ? `Expires ${new Date(session.expires_at).toLocaleString()}`
                : "Active Stytch session"}
            </p>
            <Link href="/logout" className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--danger)]"><LogOut size={14} /> Sign out</Link>
          </section>
        </div>
      </div>
  );
}
