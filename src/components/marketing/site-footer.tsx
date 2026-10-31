import Link from "next/link";

import { LogoMark } from "@/components/brand/logo";
import { site } from "@/lib/site";
import { route } from "@/lib/utils";

const COLUMNS = [
  {
    heading: "Learn",
    links: [
      { title: "Data Structures & Algorithms", href: "/learn/dsa" },
      { title: "System Design", href: "/learn/system-design" },
      { title: "Low-Level Design", href: "/learn/lld" },
      { title: "Algorithm patterns", href: "/patterns" },
    ],
  },
  {
    heading: "Practice",
    links: [
      { title: "Problems", href: "/problems" },
      { title: "Visualize", href: "/visualize" },
      { title: "Design exercises", href: "/system-design" },
    ],
  },
  {
    heading: "Campus",
    links: [
      { title: "For colleges", href: "/#campus" },
      { title: "Your college workspace", href: "/campus" },
    ],
  },
  {
    heading: "Account",
    links: [
      { title: "Everything included", href: "/features" },
      { title: "Sign in", href: "/login" },
      { title: "Create account", href: "/signup" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-border mt-auto border-t">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-8 px-4 py-12 sm:px-6 md:grid-cols-[1.6fr_repeat(4,1fr)]">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2">
            <LogoMark brand className="size-5" />
            <span className="text-sm font-semibold tracking-tight">
              {site.name}
            </span>
          </div>
          <p className="text-muted-foreground mt-3 max-w-xs text-sm leading-relaxed">
            {site.description}
          </p>
        </div>

        {COLUMNS.map((column) => (
          <nav key={column.heading} aria-label={column.heading}>
            <h2 className="font-display text-foreground text-base">
              {column.heading}
            </h2>
            <ul className="mt-3 space-y-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={route(link.href)}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-border border-t">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © {new Date().getFullYear()} {site.name}. All course content is
            original.
          </p>
          <p>Free for every learner. No paid tier.</p>
        </div>
      </div>
    </footer>
  );
}
