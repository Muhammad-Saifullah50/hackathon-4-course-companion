import { Suspense } from "react";

import {
  AccountAccessCard,
  AccountAppearanceCard,
  AccountSessionCard,
} from "@/components/account-sections";
import { AccountProfileCard } from "@/components/account-screen";
import { AccountCardSkeleton } from "@/components/loading-ui";
import type {
  AuthSession,
  BillingStatus,
  PlanCatalogItem,
  UserProfile,
} from "@/lib/api-types";
import { verifySession } from "@/lib/auth-dal";
import {
  getServerBillingStatus,
  getServerProfile,
} from "@/lib/authenticated-api";
import { getPlans } from "@/lib/server-api";

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

async function Access({
  value,
  plans,
}: {
  value: Promise<BillingStatus>;
  plans: Promise<PlanCatalogItem[]>;
}) {
  return <AccountAccessCard billing={await value} plans={await plans} />;
}

async function Session({ value }: { value: Promise<AuthSession> }) {
  return <AccountSessionCard session={await value} />;
}

export default function AccountPage() {
  const session = verifySession();
  const profile = getServerProfile();
  const access = getServerBillingStatus();
  const plans = getPlans();

  return (
    <div className="mx-auto max-w-[1040px] px-5 py-10">
      <p className="eyebrow mb-2">Account</p>
      <h1 className="mb-7 text-2xl font-semibold">Account settings</h1>
      <div className="grid gap-4">
        <Suspense fallback={<AccountCardSkeleton rows={3} />}>
          <Profile value={profile} />
        </Suspense>
        <Suspense fallback={<AccountCardSkeleton />}>
          <Access value={access} plans={plans} />
        </Suspense>
        <AccountAppearanceCard />
        <Suspense fallback={<AccountCardSkeleton />}>
          <Session value={session} />
        </Suspense>
      </div>
    </div>
  );
}
