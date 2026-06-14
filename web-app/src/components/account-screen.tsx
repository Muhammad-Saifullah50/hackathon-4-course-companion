"use client";

import { Calendar, Check, Copy, Mail, User } from "lucide-react";
import { useState } from "react";

import type { UserProfile } from "@/lib/api-types";

export function AccountProfileCard({
  profile,
}: {
  profile: UserProfile;
}) {
  const [copied, setCopied] = useState(false);

  async function copyId() {
    if (!profile) return;
    await navigator.clipboard.writeText(profile.id);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="surface-card p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="avatar h-11 w-11 text-lg">
          {profile.email.charAt(0).toUpperCase()}
        </span>
        <div>
          <strong>{profile.email}</strong>
          <p className="muted text-sm">Claude Teacher learner</p>
        </div>
      </div>
      <div className="account-details">
        <div>
          <Mail size={15} />
          <span>
            <small>Email</small>
            {profile.email}
          </span>
        </div>
        <div>
          <Calendar size={15} />
          <span>
            <small>Member since</small>
            {new Date(profile.created_at).toLocaleDateString()}
          </span>
        </div>
        <div>
          <User size={15} />
          <span className="min-w-0">
            <small>User ID</small>
            <code>{profile.id}</code>
          </span>
          <button onClick={copyId}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>
    </section>
  );
}
