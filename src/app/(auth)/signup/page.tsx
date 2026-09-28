import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth/session";
import { isGitHubAuthEnabled, isGoogleAuthEnabled } from "@/lib/env";
import { safeInternalPath } from "@/lib/safe-redirect";
import { route } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Start learning algorithms, patterns and system design on Tech Epitome.",
  robots: { index: false, follow: false },
};

export default async function SignUpPage({ searchParams }: PageProps<"/signup">) {
  const params = await searchParams;

  // Empty fallback on purpose: with nothing requested the action sends a
  // brand-new account to onboarding. A `?next=` means they were on their way
  // somewhere specific — "sign up to save this note" — and bouncing them to a
  // questionnaire would lose the thing they actually wanted.
  const next = safeInternalPath(params.next, "");

  if (await getCurrentUser()) redirect(route(next || "/dashboard"));

  return (
    <AuthForm
      mode="signup"
      next={next}
      googleEnabled={isGoogleAuthEnabled()}
      githubEnabled={isGitHubAuthEnabled()}
    />
  );
}
