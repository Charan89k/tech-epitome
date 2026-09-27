import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · CodeForge" },
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
        <h1 className="text-xl font-semibold tracking-tight">Admin</h1>
        <span className="border-border text-muted-foreground rounded-full border px-2 py-0.5 text-[0.65rem]">
          Staff only
        </span>
      </div>

      <nav
        aria-label="Admin sections"
        className="border-border mt-4 flex gap-1 overflow-x-auto border-b pb-px"
      >
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="text-muted-foreground hover:text-foreground hover:border-border -mb-px shrink-0 border-b-2 border-transparent px-3 py-2 text-sm transition-colors"
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6">{children}</div>
    </div>
  );
}
