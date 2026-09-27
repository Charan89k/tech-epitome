import type { Metadata } from "next";

import { PageHeader } from "@/components/common/page-header";
import { SettingsForm } from "@/components/settings/settings-form";
import { requireUser } from "@/lib/auth/session";
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
      emailDigest: true,
    },
  });

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Settings"
        description="Account details and how the product behaves for you."
      />

      <div className="mt-6">
        <SettingsForm
          values={{
            name: user.name ?? "",
            targetRole: profile?.targetRole ?? "",
            preferredLanguage: profile?.preferredLanguage ?? "PYTHON",
            reducedMotion: profile?.reducedMotion ?? false,
            emailDigest: profile?.emailDigest ?? true,
          }}
        />
      </div>
    </div>
  );
}
