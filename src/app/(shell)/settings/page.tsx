import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { SettingsForm } from "@/components/settings/settings-form";
import { requireUser } from "@/lib/auth/session";
import { emailIsConfigured } from "@/lib/email";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const user = await requireUser("/settings");

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: {
      targetRole: true,
      preferredLanguage: true,
      reducedMotion: true,
      onboardedAt: true,
      notifyReviewDue: true,
      notifyInterviewGraded: true,
      notifyMilestones: true,
      emailReviewReminders: true,
    },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Settings"
        description="Account details and how the product behaves for you."
      />

      <div className="mt-8">
        <SettingsForm
          // Whether this deployment can send mail at all. The form says
          // so rather than offering a toggle for a channel that does not
          // exist here.
          emailConfigured={emailIsConfigured()}
          values={{
            name: user.name ?? "",
            targetRole: profile?.targetRole ?? "",
            preferredLanguage: profile?.preferredLanguage ?? "PYTHON",
            reducedMotion: profile?.reducedMotion ?? false,
            notifyReviewDue: profile?.notifyReviewDue ?? true,
            notifyInterviewGraded: profile?.notifyInterviewGraded ?? true,
            notifyMilestones: profile?.notifyMilestones ?? true,
            emailReviewReminders: profile?.emailReviewReminders ?? false,
          }}
        />
      </div>

      {/* Onboarding is reachable afterwards on purpose: somebody who
          skipped should be able to come back, and somebody who answered
          should be able to change their mind. */}
      <section className="mt-8 grid gap-3 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
        <div className="lg:pt-4">
          <h2 className="text-base font-semibold">Getting started</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            The questions asked when you signed up.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="text-sm font-medium">
              {profile?.onboardedAt
                ? "Your learning preferences"
                : "You have not answered the getting-started questions"}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Experience, goal, target interview and a weekly target. All optional, and
              none of them lock anything.
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="shrink-0">
            <Link href="/onboarding">
              {profile?.onboardedAt ? "Review answers" : "Answer them"}
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
