import Link from "next/link";

import { CommandPaletteTrigger } from "@/components/layout/command-palette";
import { StreakPill } from "@/components/layout/streak-pill";
import { UserMenu, type UserMenuUser } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

type TopBarProps = {
  /** Null for an anonymous visitor browsing public course content. */
  user: UserMenuUser | null;
  streak: number;
};

export function TopBar({ user, streak }: TopBarProps) {
  return (
    <header className="bg-background/80 border-border sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b px-3 backdrop-blur-md sm:px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 !h-5" />

      <div className="flex-1">
        <CommandPaletteTrigger />
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {user ? (
          <>
            <StreakPill days={streak} />
            <UserMenu user={user} />
          </>
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
      </div>
    </header>
  );
}
