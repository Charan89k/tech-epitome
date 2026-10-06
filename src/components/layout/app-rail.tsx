"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, LogIn } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { canAccess, FEATURES } from "@/lib/auth/access";
import { isNavItemActive, primaryNav } from "@/lib/navigation";
import { cn, route } from "@/lib/utils";

/**
 * The floating navigation rail.
 *
 * Collapsed it is a column of icons — every destination one click away
 * without spending reading width on labels the learner already knows.
 * Expanded it shows the labels and group names. The choice is remembered
 * per browser; storage is a convenience, so every access is guarded and the
 * rail simply starts collapsed when storage is unavailable.
 *
 * Desktop only: on small screens the header's sheet carries the same list.
 */

const STORAGE_KEY = "tech-epitome:rail-expanded";

function readExpanded(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function AppRail({ user }: { user: { role: "USER" | "ADMIN" } | null }) {
  const pathname = usePathname();
  // Read once on the client; the server renders collapsed.
  const stored = useSyncExternalStore(
    () => () => {},
    readExpanded,
    () => false
  );
  const [override, setOverride] = useState<boolean | null>(null);
  const expanded = override ?? stored;

  function toggle() {
    const next = !expanded;
    setOverride(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // Not remembering the preference is fine.
    }
  }

  return (
    <aside
      aria-label="Navigation"
      className={cn(
        "sticky top-14 hidden h-[calc(100dvh-3.5rem)] shrink-0 py-3 pl-3 md:block",
        expanded ? "w-60" : "w-[4.25rem]"
      )}
    >
      <nav className="flex h-full flex-col overflow-x-hidden overflow-y-auto rounded-2xl border border-border bg-card/60 p-1.5">
        <button
          type="button"
          onClick={toggle}
          className="mb-1.5 flex size-9 shrink-0 items-center justify-center self-start rounded-xl border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label={expanded ? "Collapse navigation" : "Expand navigation"}
          aria-expanded={expanded}
        >
          {expanded ? (
            <ChevronLeft className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </button>

        {primaryNav.map((group, groupIndex) => {
          const items = group.items.filter(
            (item) => item.feature !== FEATURES.ADMIN || canAccess(user, item.feature)
          );
          if (items.length === 0) return null;
          return (
            <div
              key={group.label}
              className={cn(
                groupIndex > 0 && "mt-1.5 border-t border-border/60 pt-1.5"
              )}
            >
              {expanded && (
                <p className="px-2.5 pt-1 pb-1 text-[0.62rem] font-medium tracking-wider text-muted-foreground/60 uppercase">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = isNavItemActive(item, pathname);
                  const needsAccount = item.feature
                    ? !canAccess(user, item.feature)
                    : false;
                  const link = (
                    <Link
                      href={route(item.href)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex h-9 items-center gap-2.5 rounded-xl text-sm transition-colors",
                        expanded ? "px-2.5" : "w-9 justify-center",
                        active
                          ? "bg-ember-500/12 text-ember-200 ring-1 ring-ember-500/30 ring-inset"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "size-[1.05rem] shrink-0",
                          active && "text-ember-400"
                        )}
                        aria-hidden="true"
                      />
                      {expanded ? (
                        <>
                          <span className="truncate">{item.title}</span>
                          {needsAccount && (
                            <LogIn
                              className="ml-auto size-3 shrink-0 text-muted-foreground/50"
                              aria-label="Sign in required"
                            />
                          )}
                        </>
                      ) : (
                        <span className="sr-only">{item.title}</span>
                      )}
                    </Link>
                  );
                  return (
                    <li key={item.href}>
                      {expanded ? (
                        link
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>{link}</TooltipTrigger>
                          <TooltipContent side="right">
                            {item.title}
                            {needsAccount && " · sign in to use — it is free"}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
