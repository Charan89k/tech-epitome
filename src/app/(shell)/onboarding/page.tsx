import type { Metadata } from "next";

import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Getting started",
  robots: { index: false, follow: false },
};

/**
 * Five optional questions.
 *
 * Deliberately a page rather than a modal on the dashboard: a modal over
 * a screen you have not seen yet is disorienting, and it makes "skip"
 * feel like the only sane choice.
 *
 * Reachable again from settings rather than being a one-shot wizard —
 * somebody who skipped should be able to come back, and somebody who
 * answered should be able to change their mind. The copy changes to say
 * which visit this is; the form does not.
 */
export default async function OnboardingPage() {
  const user = await requireUser("/onboarding");

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: {
      onboardedAt: true,
      experienceLevel: true,
      primaryGoal: true,
      targetInterview: true,
      preferredLanguage: true,
      weeklyTarget: true,
    },
  });

  const returning = Boolean(profile?.onboardedAt);

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="text-2xl font-semibold tracking-tight">
        {returning ? "Your learning preferences" : "Before you start"}
      </h1>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
        {returning
          ? "Change any of these, or clear them. They only steer what the dashboard suggests first."
          : "Five questions, all optional, so the dashboard can suggest something sensible first. None of them lock anything — every part of Tech Epitome is open to every account, and all of it is free."}
      </p>

      <div className="mt-8">
        <OnboardingForm
          defaults={{
            experienceLevel: profile?.experienceLevel ?? null,
            primaryGoal: profile?.primaryGoal ?? null,
            targetInterview: profile?.targetInterview ?? null,
            preferredLanguage: profile?.preferredLanguage ?? null,
            weeklyTarget: profile?.weeklyTarget ?? null,
          }}
        />
      </div>
    </div>
  );
}
