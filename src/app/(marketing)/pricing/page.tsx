import type { Metadata } from "next";
import Link from "next/link";
import { Check, Info, Minus } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { FEATURE_LABELS, PLANS } from "@/lib/billing/plans";
import { isBillingEnabled } from "@/lib/env";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Start free. Upgrade for the full curriculum, AI tutoring and mock interviews.",
  alternates: { canonical: "/pricing" },
};

export default async function PricingPage() {
  const user = await getCurrentUser();
  const billingEnabled = isBillingEnabled();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Learn for free. Go deeper when you are ready.
        </h1>
        <p className="text-muted-foreground mt-4 text-sm text-pretty sm:text-base">
          The fundamentals are free because the method only proves itself if you
          can try it. Pro opens the rest of the platform.
        </p>
      </div>

      {!billingEnabled && (
        <Alert className="mx-auto mt-8 max-w-2xl">
          <Info className="size-4" />
          <AlertDescription>
            Checkout is not configured on this deployment, so Pro cannot be
            purchased here yet. Plan entitlements below are live and enforced —
            an account set to Pro receives exactly these features.
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = user?.plan === plan.tier;

          return (
            <div
              key={plan.tier}
              className={cn(
                "border-border bg-card relative flex flex-col rounded-xl border p-6",
                plan.highlighted && "border-ember-500/40 surface-edge"
              )}
            >
              {plan.highlighted && (
                <Badge className="bg-ember-500/15 text-ember-400 border-ember-500/30 absolute -top-2.5 left-6 border text-[0.65rem]">
                  Most complete
                </Badge>
              )}

              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-base font-semibold">{plan.name}</h2>
                {isCurrent && (
                  <Badge variant="outline" className="text-[0.65rem]">
                    Current plan
                  </Badge>
                )}
              </div>

              <p className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight tabular-nums">
                  ${plan.monthlyPrice}
                </span>
                <span className="text-muted-foreground text-xs">
                  {plan.billingNote}
                </span>
              </p>

              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                {plan.description}
              </p>

              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.includes.map((feature) => (
                  <li key={feature} className="flex gap-2.5 text-sm">
                    <Check
                      className="text-success mt-0.5 size-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="text-muted-foreground">
                      {FEATURE_LABELS[feature]}
                    </span>
                  </li>
                ))}
                {plan.excludes?.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm">
                    <Minus
                      className="text-muted-foreground/50 mt-0.5 size-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="text-muted-foreground/60 line-through">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {plan.tier === "FREE" ? (
                  <Button
                    asChild
                    variant={plan.highlighted ? "default" : "outline"}
                    className="w-full"
                    disabled={isCurrent}
                  >
                    <Link href={user ? "/dashboard" : "/signup"}>
                      {user ? "Go to dashboard" : "Start free"}
                    </Link>
                  </Button>
                ) : billingEnabled ? (
                  <Button
                    asChild
                    variant={plan.highlighted ? "default" : "outline"}
                    className="w-full"
                  >
                    <Link href={user ? "/settings" : "/signup"}>
                      {isCurrent ? "Manage plan" : "Upgrade to Pro"}
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    Checkout not configured
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
