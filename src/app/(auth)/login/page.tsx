import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth/session";
import { isGoogleAuthEnabled } from "@/lib/env";
import { route } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Tech Epitome account.",
  robots: { index: false, follow: false },
};

/** Only same-origin absolute paths, so `?next=` cannot become an open redirect. */
function safeNext(value: string | string[] | undefined): string {
  const next = Array.isArray(value) ? value[0] : value;
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNext(params.next);

  // Already signed in - skip the form entirely.
  if (await getCurrentUser()) redirect(route(next));

  return <AuthForm mode="signin" next={next} googleEnabled={isGoogleAuthEnabled()} />;
}
