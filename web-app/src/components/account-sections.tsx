import { LogOut, Shield } from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import type { AccessStatus, AuthSession } from "@/lib/api-types";

export function AccountAccessCard({ access }: { access: AccessStatus }) {
  return (
    <section className="surface-card p-6">
      <div className="account-details">
        <div>
          <Shield size={15} />
          <span>
            <small>Tier</small>
            {access.tier}
          </span>
          <em>Premium coming later</em>
        </div>
      </div>
    </section>
  );
}

export function AccountAppearanceCard() {
  return (
    <section className="surface-card flex items-center justify-between p-6">
      <div>
        <h2 className="font-semibold">Appearance</h2>
        <p className="muted mt-1 text-sm">
          Follow your system or choose manually.
        </p>
      </div>
      <ThemeToggle showLabel />
    </section>
  );
}

export function AccountSessionCard({ session }: { session: AuthSession }) {
  return (
    <section className="surface-card p-6">
      <h2 className="font-semibold">Session</h2>
      <p className="muted mt-2 text-sm">
        {session.expires_at
          ? `Expires ${new Date(session.expires_at).toLocaleString()}`
          : "Active Stytch session"}
      </p>
      <Link
        href="/logout"
        className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--danger)]"
      >
        <LogOut size={14} /> Sign out
      </Link>
    </section>
  );
}
