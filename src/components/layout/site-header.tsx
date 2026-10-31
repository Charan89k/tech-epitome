"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  Library,
  Menu,
  Building2,
  type LucideIcon,
} from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { CommandPaletteTrigger } from "@/components/layout/command-palette";
import { StreakPill } from "@/components/layout/streak-pill";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu, type UserMenuUser } from "@/components/layout/user-menu";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { isNavItemActive, navForViewer, type NavGroup, type NavViewer } from "@/lib/navigation";
import { cn, route } from "@/lib/utils";

/**
 * The application header: brand, section menus, search, and the learner's
 * own controls.
 *
 * Sections open as menus of described destinations rather than bare links,
 * because "System Design" means little until you read that it is the course
 * and "Design Exercises" is where you practise it. The same `primaryNav`
 * data drives the rail, the command palette and the mobile sheet, so the
 * four can never disagree about what exists.
 */

const MENU_ICON: Record<string, LucideIcon> = {
  Learn: BookOpen,
  Campus: Building2,
  Library: Library,
};

const HEADER_GROUPS = ["Learn", "Campus", "Library"];

type Props = {
  user: (UserMenuUser & { role: "USER" | "ADMIN"; campusMember?: boolean }) | null;
  streak: number;
  unreadNotifications: number;
};

export function SiteHeader({ user, streak, unreadNotifications }: Props) {
  const pathname = usePathname();
  const groups = navForViewer(user).filter((group) => HEADER_GROUPS.includes(group.label));

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-3 sm:px-4">
      <MobileNav user={user} pathname={pathname} />

      <Link
        href={user ? "/dashboard" : "/"}
        className="mr-2 flex items-center rounded-md px-1 py-1"
      >
        <Logo responsive wordmarkClassName="text-[1.05rem]" />
      </Link>

      <nav aria-label="Sections" className="hidden items-center gap-0.5 lg:flex">
        {groups.map((group) => (
          <SectionMenu key={group.label} group={group} pathname={pathname} />
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <div className="hidden w-56 md:block">
          <CommandPaletteTrigger />
        </div>
        <div className="md:hidden">
          <CommandPaletteTrigger compact />
        </div>
        <ThemeToggle />
        {user ? (
          <>
            <div className="hidden sm:block">
              <StreakPill days={streak} />
            </div>
            <NotificationBell initialUnread={unreadNotifications} />
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

function SectionMenu({ group, pathname }: { group: NavGroup; pathname: string }) {
  const Icon = MENU_ICON[group.label] ?? BookOpen;
  const active = group.items.some((item) => isNavItemActive(item, pathname));

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        className={cn(
          "relative flex h-9 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors outline-none hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-accent/60",
          active
            ? "text-foreground after:absolute after:inset-x-2.5 after:-bottom-[0.6875rem] after:h-0.5 after:bg-primary"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Icon className={cn("size-4", active && "text-primary")} aria-hidden="true" />
        {group.label}
        <ChevronDown className="size-3.5 opacity-60" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} className="w-80 p-1.5">
        {group.items.map((item) => {
          const itemActive = isNavItemActive(item, pathname);
          return (
            <DropdownMenuItem
              key={item.href}
              asChild
              className="items-start gap-3 rounded-lg p-2.5"
            >
              <Link href={route(item.href)} aria-current={itemActive ? "page" : undefined}>
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl border",
                    itemActive
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-muted/50 text-muted-foreground"
                  )}
                >
                  <item.icon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">
                    {item.title}
                  </span>
                  {item.description && (
                    <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                      {item.description}
                    </span>
                  )}
                </span>
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileNav({
  user,
  pathname,
}: {
  user: NavViewer;
  pathname: string;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            <Logo />
          </SheetTitle>
        </SheetHeader>
        <nav aria-label="All sections" className="space-y-5 px-4 pb-8">
          {navForViewer(user).map(({ label, items }) => {
            return (
              <div key={label}>
                <p className="mb-1.5 px-2 text-xs font-medium text-muted-foreground">
                  {label}
                </p>
                <ul className="space-y-0.5">
                  {items.map((item) => {
                    const active = isNavItemActive(item, pathname);
                    return (
                      <li key={item.href}>
                        <Link
                          href={route(item.href)}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
                            active
                              ? "bg-accent font-medium text-foreground"
                              : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                          )}
                        >
                          <item.icon
                            className={cn("size-4", active && "text-primary")}
                            aria-hidden="true"
                          />
                          {item.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
