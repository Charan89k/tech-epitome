import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { decidePortal, isCampusPortal } from "@/lib/campus/portal";
import { route } from "@/lib/utils";
import { listMyMemberships } from "@/services/institutions";

export const metadata: Metadata = {
  title: "Campus access",
  robots: { index: false, follow: false },
};

/**
 * The gate behind each Campus sign-in. Roles come from the database here, so
 * this is what stops a student signing in through the teacher door.
 */
export default async function CampusEnterPage({
  params,
}: PageProps<"/campus/enter/[portal]">) {
  const { portal } = await params;
  if (!isCampusPortal(portal)) notFound();

  const user = await requireUser(`/campus/enter/${portal}`);
  const decision = decidePortal(
    portal,
    await listMyMemberships(user),
    user.role === "ADMIN"
  );
  if (decision.kind === "go") redirect(route(decision.path));

  const wanted = portal === "teacher" ? "faculty" : "student";
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16 sm:px-6">
      <ShieldAlert className="size-6 text-warning" aria-hidden="true" />
      <h1 className="tracking-headline mt-4 text-2xl font-semibold">
        {user.email} has no {wanted} membership
      </h1>
      <p className="mt-2 text-muted-foreground">
        {decision.hasOtherMembership
          ? `You belong to a college in a different role. Use the sign-in that matches it, or ask your college to change it.`
          : `A college adds you by sending an invitation to this address. Open the link in that invitation while signed in to join.`}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/campus">Go to Campus</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Go to Learn</Link>
        </Button>
      </div>
    </div>
  );
}
