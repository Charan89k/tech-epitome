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

function safeNext(value: string | string[] | undefined): string {
  const next = Array.isArray(value) ? value[0] : value;
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

export default async function SignUpPage({ searchParams }: PageProps<"/signup">) {
  const params = await searchParams;
  const next = safeNext(params.next);

  if (await getCurrentUser()) redirect(route(next));

  return <AuthForm mode="signup" next={next} googleEnabled={isGoogleAuthEnabled()} />;
}
