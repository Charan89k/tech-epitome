import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/admin-nav";

import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · Tech Epitome" },
  robots: { index: false, follow: false, nocache: true },
};

/**
 * The admin shell.
 *
 * `requireAdmin` here rather than in each page: a layout runs before every
 * page beneath it, so there is one boundary rather than five that must all
 * remember. It redirects a signed-out visitor and `forbidden()`s a
 * signed-in non-admin, which returns a real 403 rather than a 404 — the
 * route's existence is not a secret, and pretending otherwise would make a
 * genuine permissions problem look like a broken link.
 *
 * Every page below still re-checks nothing and queries nothing sensitive
 * without going through `services/admin.ts`, which is the only module that
 * writes an audit row.
 *
 * Admin is a role. It is not, and must never become, a paid plan.
 */

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/ai", label: "AI usage" },
  { href: "/admin/audit", label: "Audit log" },
] as const;

export default async function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  await requireAdmin();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="tracking-headline text-2xl font-bold sm:text-3xl">Admin</h1>
        <span className="bg-ember-500/12 text-ember-300 rounded-full px-2 py-0.5 text-[0.65rem] font-medium">
          Staff only
        </span>
      </div>

      <AdminNav tabs={TABS} />

      <div className="mt-6">{children}</div>
    </div>
  );
}
