import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth/session";
import { isGoogleAuthEnabled } from "@/lib/env";
import { safeInternalPath } from "@/lib/safe-redirect";
import { route } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Tech Epitome account.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeInternalPath(params.next, "/dashboard");

  // Already signed in - skip the form entirely.
  if (await getCurrentUser()) redirect(route(next));

  return <AuthForm mode="signin" next={next} googleEnabled={isGoogleAuthEnabled()} />;
}
