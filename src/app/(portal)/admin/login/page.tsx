import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PortalForm } from "@/components/auth/portal-form";
import { getCurrentUser } from "@/lib/auth/session";
import { safeInternalPath } from "@/lib/safe-redirect";
import { route } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Administrator sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  const { next, error, ended } = await searchParams;
  // `/admin` itself refuses anyone who is not a platform admin.
  if (ended !== "1" && (await getCurrentUser())) {
    redirect(route(safeInternalPath(next, "/admin")));
  }
  return <PortalForm portal="admin" next={next} error={error} />;
}
