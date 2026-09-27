"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { canAccess, FEATURES } from "@/lib/auth/access";
import { isNavItemActive, primaryNav } from "@/lib/navigation";
import { cn, route } from "@/lib/utils";

type AppSidebarProps = {
  /** Minimal shape - the shell only needs enough to resolve feature gates. */
  user: { role: "USER" | "ADMIN" } | null;
};

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader className="h-14 justify-center px-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-md px-1 py-1"
        >
          <Logo
            idSuffix="sidebar"
            wordmarkClassName="text-[0.95rem] group-data-[collapsible=icon]:hidden"
          />
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        {primaryNav.map((group) => {
          // Staff surfaces are omitted for everyone else rather than shown
          // locked: a learner has no route to becoming an admin, so an
          // "Admin" row they can never open is a dead end. Everything else
          // stays visible — the rule is that nothing in the navigation is
          // a dead end, and "sign in" is a next step.
          const items = group.items.filter(
            (item) => item.feature !== FEATURES.ADMIN || canAccess(user, item.feature)
          );
          if (items.length === 0) return null;

          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="text-[0.68rem] font-medium tracking-wider text-muted-foreground/70 uppercase">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => {
                    const active = isNavItemActive(item, pathname);
                    // The only remaining reason to withhold anything is that
                    // there is no account. Tech Epitome is free; there is no
                    // upgrade branch here and there must never be one again.
                    const needsAccount = item.feature
                      ? !canAccess(user, item.feature)
                      : false;

                    const button = (
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                        className={cn(
                          "gap-2.5",
                          active && "font-medium text-sidebar-accent-foreground"
                        )}
                      >
                        <Link href={route(item.href)}>
                          <item.icon
                            className={cn(
                              "size-4 shrink-0",
                              active ? "text-ember-500" : "text-muted-foreground"
                            )}
                          />
                          <span className="truncate">{item.title}</span>
                          {needsAccount && (
                            <LogIn
                              className="ml-auto size-3 shrink-0 text-muted-foreground/60"
                              aria-label="Sign in required"
                            />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    );

                    return (
                      <SidebarMenuItem key={item.href}>
                        {needsAccount ? (
                          <Tooltip>
                            <TooltipTrigger asChild>{button}</TooltipTrigger>
                            <TooltipContent side="right">
                              Sign in to use this — it is free
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          button
                        )}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
