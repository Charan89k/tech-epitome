import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
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

/**
 * The public header. Same height, blur and right-hand controls as the app's
 * `SiteHeader`, so stepping from the landing page into the product does not
 * change the frame around it — only the links in the middle differ.
 */
export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="bg-background/85 border-border sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
        {/* Mobile nav */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="size-9 md:hidden" aria-label="Open menu">
              <MenuGlyph />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle>
                <Logo idSuffix="mobile-nav" />
              </SheetTitle>
            </SheetHeader>
            <nav aria-label="Mobile" className="px-4">
              <ul className="space-y-0.5">
                {marketingNav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={route(item.href)}
                      className="text-muted-foreground hover:bg-accent/60 hover:text-foreground block rounded-md px-2 py-2 text-sm transition-colors"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
                {!signedIn && (
                  <li>
                    <Link
                      href="/login"
                      className="text-muted-foreground hover:bg-accent/60 hover:text-foreground block rounded-md px-2 py-2 text-sm transition-colors"
                    >
                      Sign in
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
          </SheetContent>
        </Sheet>

        <Link href="/" className="mr-2 flex shrink-0 items-center rounded-md px-1 py-1">
          <Logo idSuffix="site-header" wordmarkClassName="text-[1.05rem]" />
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-0.5">
            {marketingNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={route(item.href)}
                  className="text-muted-foreground hover:text-foreground hover:bg-accent/60 flex h-9 items-center rounded-md px-2.5 text-sm font-medium transition-colors"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          {signedIn ? (
            <Button asChild size="sm" className="rounded-full px-4">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full px-4">
                <Link href="/signup">Start learning</Link>
              </Button>
            </>
          )}
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
