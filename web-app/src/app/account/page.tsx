import { Suspense } from "react";

import {
  AccountAccessCard,
  AccountAppearanceCard,
  AccountSessionCard,
} from "@/components/account-sections";
import { AccountProfileCard } from "@/components/account-screen";
import { AccountCardSkeleton } from "@/components/loading-ui";
import type {
  AccessStatus,
  AuthSession,
  UserProfile,
} from "@/lib/api-types";
import { verifySession } from "@/lib/auth-dal";
import {
  getServerAccess,
  getServerProfile,
} from "@/lib/authenticated-api";

export const unstable_instant = {
  prefetch: "runtime",
  samples: [
    {
      cookies: [{ name: "stytch_session", value: null }],
    },
  ],
};

async function Profile({ value }: { value: Promise<UserProfile> }) {
  return <AccountProfileCard profile={await value} />;
}

async function Access({ value }: { value: Promise<AccessStatus> }) {
  return <AccountAccessCard access={await value} />;
}

async function Session({ value }: { value: Promise<AuthSession> }) {
  return <AccountSessionCard session={await value} />;
}

export default function AccountPage() {
  const session = verifySession();
  const profile = getServerProfile();
  const access = getServerAccess();

  return (
    <div className="mx-auto max-w-[680px] px-5 py-10">
      <p className="eyebrow mb-2">Account</p>
      <h1 className="mb-7 text-2xl font-semibold">Account settings</h1>
      <div className="grid gap-4">
        <Suspense fallback={<AccountCardSkeleton rows={3} />}>
          <Profile value={profile} />
        </Suspense>
        <Suspense fallback={<AccountCardSkeleton />}>
          <Access value={access} />
        </Suspense>
        <AccountAppearanceCard />
        <Suspense fallback={<AccountCardSkeleton />}>
          <Session value={session} />
        </Suspense>
      </div>
    </div>
  );
}
