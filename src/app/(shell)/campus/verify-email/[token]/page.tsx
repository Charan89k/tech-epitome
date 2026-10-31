import type { Metadata } from "next";

import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";

import { confirmVerificationAction } from "../../actions";

// The token is in the path; keep it out of Referer headers and indexes.
export const metadata: Metadata = {
  title: "Confirm your email",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

/** Confirmation is a POST, so a link scanner cannot verify on its own. */
export default async function VerifyEmailPage({
  params,
}: PageProps<"/campus/verify-email/[token]">) {
  const { token } = await params;
  const user = await requireUser(`/campus/verify-email/${token}`);

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
      <PageHeader
        title="Confirm your email"
        description={`Confirm that ${user.email} is your address.`}
      />
      <form action={confirmVerificationAction.bind(null, token)} className="mt-6">
        <Button type="submit">Confirm my email</Button>
      </form>
    </div>
  );
}
