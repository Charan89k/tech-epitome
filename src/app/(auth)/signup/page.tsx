import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth/session";
import { isGoogleAuthEnabled } from "@/lib/env";
import { route } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Start learning algorithms, patterns and system design on CodeForge.",
  robots: { index: false, follow: false },
};

/**
 * Where to land after signing up.
 *
 * Empty on purpose when nothing was requested: the action then sends a
 * brand-new account to onboarding. A `?next=` means they were on their
 * way somewhere specific — "sign up to save this note" — and bouncing
 * them to a questionnaire would lose the thing they actually wanted.
 */
function safeNext(value: string | string[] | undefined): string {
  const next = Array.isArray(value) ? value[0] : value;
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "";
  return next;
}

export default async function SignUpPage({ searchParams }: PageProps<"/signup">) {
  const params = await searchParams;
  const next = safeNext(params.next);

  if (await getCurrentUser()) redirect(route(next || "/dashboard"));

  return <AuthForm mode="signup" next={next} googleEnabled={isGoogleAuthEnabled()} />;
}
