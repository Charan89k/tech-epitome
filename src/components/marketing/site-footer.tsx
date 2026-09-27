import Link from "next/link";

import { LogoMark } from "@/components/brand/logo";
import { site } from "@/lib/site";
import { route } from "@/lib/utils";

const COLUMNS = [
  {
    heading: "Learn",
    links: [
      { title: "DSA curriculum", href: "/learn/dsa" },
      { title: "Algorithm patterns", href: "/patterns" },
      { title: "Problems", href: "/problems" },
    ],
  },
  {
    heading: "Product",
    links: [
      { title: "Pricing", href: "/pricing" },
      { title: "Sign in", href: "/login" },
      { title: "Create account", href: "/signup" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-border mt-auto border-t">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <LogoMark gradient idSuffix="footer" className="size-5" />
            <span className="text-sm font-semibold tracking-tight">
              {site.name}
            </span>
          </div>
          <p className="text-muted-foreground mt-3 max-w-xs text-xs leading-relaxed">
            {site.description}
          </p>
        </div>

        {COLUMNS.map((column) => (
          <nav key={column.heading} aria-label={column.heading}>
            <h2 className="text-foreground text-xs font-medium tracking-wider uppercase">
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
          <p className="font-mono">Built for people who want to understand.</p>
        </div>
      </div>
    </footer>
  );
}
