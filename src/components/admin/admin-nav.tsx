"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn, route } from "@/lib/utils";

/**
 * The admin section tabs: underline style, with the ember bar under the
 * section you are in. A client component only to read the pathname.
 */
export function AdminNav({
  tabs,
}: {
  tabs: readonly { href: string; label: string }[];
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin sections"
      className="mt-4 flex overflow-x-auto border-b border-border"
    >
      {tabs.map((tab) => {
        const active =
          tab.href === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={route(tab.href)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative h-10 shrink-0 px-3 text-sm leading-10 transition-colors",
              "after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full",
              active
                ? "font-medium text-foreground after:bg-ember-500"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
