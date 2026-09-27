import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { marketingNav } from "@/lib/navigation";
import { route } from "@/lib/utils";

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="bg-background/75 border-border sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="shrink-0">
          <Logo idSuffix="site-header" />
        </Link>

        <nav aria-label="Main" className="hidden flex-1 md:block">
          <ul className="flex items-center gap-1">
            {marketingNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={route(item.href)}
                  className="text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md px-3 py-1.5 text-sm transition-colors"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {signedIn ? (
            <Button asChild size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Start learning</Link>
              </Button>
            </>
          )}

          {/* Mobile nav */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open menu"
              >
                <MenuGlyph />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>
                  <Logo idSuffix="mobile-nav" />
                </SheetTitle>
              </SheetHeader>
              <nav aria-label="Mobile" className="px-4">
                <ul className="space-y-1">
                  {marketingNav.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={route(item.href)}
                        className="hover:bg-accent block rounded-md px-3 py-2 text-sm transition-colors"
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                  {!signedIn && (
                    <li>
                      <Link
                        href="/login"
                        className="hover:bg-accent block rounded-md px-3 py-2 text-sm transition-colors"
                      >
                        Sign in
                      </Link>
                    </li>
                  )}
                </ul>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function MenuGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-5" aria-hidden="true" fill="none">
      <path
        d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
