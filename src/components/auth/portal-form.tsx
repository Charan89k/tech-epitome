import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";
import { authErrorMessage } from "@/lib/auth/errors";
import { safeInternalPath } from "@/lib/safe-redirect";
import { site } from "@/lib/site";

const COPY = {
  student: {
    eyebrow: `${site.name} Campus`,
    title: "Student sign in",
    subtitle: "Your college's classes, exams and placement preparation.",
    gate: "/campus/enter/student",
    other: { href: "/campus/login/teacher", label: "Teacher or faculty? Sign in here" },
  },
  teacher: {
    eyebrow: `${site.name} Campus`,
    title: "Teacher and faculty sign in",
    subtitle: "Your classes, question banks, exams and grading.",
    gate: "/campus/enter/teacher",
    other: { href: "/campus/login/student", label: "Student? Sign in here" },
  },
  admin: {
    eyebrow: "Platform administration",
    title: "Administrator sign in",
    subtitle: "For Tech Epitome staff. Every change here is written to the audit log.",
    gate: "/admin",
    other: null,
  },
} as const;

/**
 * One sign-in form, three doors. Which door was used decides only where a
 * successful sign-in goes next; the page there checks the database for the
 * role, so nothing here can grant one.
 */
export function PortalForm({
  portal,
  next,
  error,
}: {
  portal: keyof typeof COPY;
  next: Parameters<typeof safeInternalPath>[0];
  error: Parameters<typeof authErrorMessage>[0];
}) {
  const copy = COPY[portal];
  const target = safeInternalPath(next, copy.gate);
  // Campus accounts come from an invitation, so only someone holding one is
  // offered account creation here.
  const invited = target.startsWith("/campus/invite/");

  return (
    <div className="w-full max-w-md">
      <p className="mb-3 text-center label-mono text-xs tracking-wider text-subtle-foreground uppercase">
        {copy.eyebrow}
      </p>
      <div className="rounded-lg border border-border bg-card p-6 shadow-raised sm:p-8">
        <AuthForm
          mode="signin"
          next={target}
          googleEnabled={false}
          githubEnabled={false}
          notice={authErrorMessage(error)}
          portal={{
            title: copy.title,
            subtitle: copy.subtitle,
            allowSignup: invited,
          }}
        />
      </div>
      {portal !== "admin" && !invited && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          No account? Your college invites you, and the link in that invitation creates
          it.
        </p>
      )}
      {copy.other && (
        <p className="mt-2 text-center text-sm">
          <Link
            href={copy.other.href}
            className="font-medium text-brand-300 underline-offset-4 hover:text-brand-200 hover:underline"
          >
            {copy.other.label}
          </Link>
        </p>
      )}
    </div>
  );
}
