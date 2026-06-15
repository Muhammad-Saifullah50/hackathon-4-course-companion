import { CreditCard, LogOut, Shield } from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import type {
  AuthSession,
  BillingStatus,
  PlanCatalogItem,
} from "@/lib/api-types";

export function AccountAccessCard({
  billing,
  plans,
}: {
  billing: BillingStatus;
  plans: PlanCatalogItem[];
}) {
  const isPaid = billing.tier !== "free";
  return (
    <section className="surface-card p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">Plan and billing</h2>
          <p className="muted mt-1 text-sm">
            {isPaid
              ? `Your ${billing.tier} access is managed securely by Stripe.`
              : "Choose the plan that fits your learning goals."}
          </p>
        </div>
        <CreditCard className="muted" size={18} />
      </div>
      <div className="account-details">
        <div>
          <Shield size={15} />
          <span>
            <small>Tier</small>
            {billing.tier}
          </span>
          <em>
            {billing.subscription_status === "paid"
              ? "Lifetime access"
              : billing.subscription_status ?? "No purchase"}
          </em>
        </div>
      </div>
      <div className="pricing-grid mt-5">
        {plans.map((plan) => (
          <article
            className="pricing-card"
            data-current={billing.tier === plan.tier}
            key={plan.tier}
          >
            <div>
              <h3>{plan.name}</h3>
              <strong>
                ${(plan.price_cents / 100).toFixed(plan.price_cents ? 2 : 0)}
                {plan.interval ? <small>/{plan.interval}</small> : null}
              </strong>
            </div>
            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
              {plan.seats_included ? (
                <li>{plan.seats_included} seats included</li>
              ) : null}
            </ul>
            {billing.tier === plan.tier ? (
              <span className="plan-state">Current plan</span>
            ) : plan.tier === "premium" && !isPaid ? (
              <form action="/api/billing/checkout" method="post">
                <button className="button-primary w-full">
                  Upgrade with Stripe
                </button>
              </form>
            ) : (
              <button className="button-secondary w-full" disabled>
                Coming soon
              </button>
            )}
          </article>
        ))}
      </div>
      {isPaid && billing.subscription_status !== "paid" ? (
        <form action="/api/billing/portal" method="post" className="mt-4">
          <button className="button-secondary">Manage billing</button>
        </form>
      ) : null}
      {billing.cancel_at_period_end && billing.current_period_end ? (
        <p className="muted mt-3 text-xs">
          Premium remains active until{" "}
          {new Date(billing.current_period_end).toLocaleDateString()}.
        </p>
      ) : null}
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
