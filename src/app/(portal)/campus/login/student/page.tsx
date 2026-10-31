import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PortalForm } from "@/components/auth/portal-form";
import { getCurrentUser } from "@/lib/auth/session";
import { safeInternalPath } from "@/lib/safe-redirect";
import { route } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Campus student sign in",
  robots: { index: false, follow: false },
};

export default async function StudentLoginPage({
  searchParams,
}: PageProps<"/campus/login/student">) {
  const { next, error, ended } = await searchParams;
  if (ended !== "1" && (await getCurrentUser())) {
    redirect(route(safeInternalPath(next, "/campus/enter/student")));
  }
  return <PortalForm portal="student" next={next} error={error} />;
}
