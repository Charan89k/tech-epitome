import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, GraduationCap, Presentation } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/session";
import { safeInternalPath } from "@/lib/safe-redirect";
import { site } from "@/lib/site";
import { route } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Enter Campus",
  description: "Sign in to your college's Tech Epitome Campus workspace.",
};

const DOORS = [
  {
    href: "/campus/login/student",
    icon: GraduationCap,
    title: "I am a student",
    text: "Classes, assignments, exams, aptitude practice and placement preparation.",
  },
  {
    href: "/campus/login/teacher",
    icon: Presentation,
    title: "I teach here",
    text: "Classes and rosters, question banks, exams, grading and class analytics.",
  },
] as const;

export default async function CampusLoginPage({
  searchParams,
}: PageProps<"/campus/login">) {
  const { next, ended } = await searchParams;
  const target = typeof next === "string" ? safeInternalPath(next, "") : "";
  if (ended !== "1" && (await getCurrentUser())) redirect(route(target || "/campus"));
  const query = target ? `?next=${encodeURIComponent(target)}` : "";

  return (
    <div className="w-full max-w-xl">
      <p className="label-mono text-xs tracking-wider text-subtle-foreground uppercase">
        {site.name} Campus
      </p>
      <h1 className="tracking-headline mt-2 text-3xl font-semibold">Enter Campus</h1>
      <p className="mt-2 text-muted-foreground">
        The workspace your college runs on {site.name}. Your college decides your role;
        choosing a door below does not.
      </p>

      <ul className="mt-8 divide-y divide-border border-y border-border">
        {DOORS.map((door) => (
          <li key={door.href}>
            <Link
              href={route(`${door.href}${query}`)}
              className="group flex items-center gap-4 py-5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <door.icon
                className="size-5 shrink-0 text-brand-300"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="block font-medium group-hover:text-brand-300">
                  {door.title}
                </span>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  {door.text}
                </span>
              </span>
              <ChevronRight
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-sm text-muted-foreground">
        Not at a college?{" "}
        <Link
          href="/problems"
          className="font-medium text-brand-300 hover:text-brand-200"
        >
          {site.name} Learn
        </Link>{" "}
        is open to everyone.
      </p>
    </div>
  );
}
