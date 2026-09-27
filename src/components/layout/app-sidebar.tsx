"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
import { canAccess } from "@/lib/auth/access";
import { isNavItemActive, primaryNav } from "@/lib/navigation";
import { cn, route } from "@/lib/utils";

type AppSidebarProps = {
  /** Minimal shape - the shell only needs enough to resolve feature gates. */
  user: { role: "USER" | "ADMIN"; isPro: boolean } | null;
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
        {primaryNav.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-muted-foreground/70 text-[0.68rem] font-medium tracking-wider uppercase">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = isNavItemActive(item, pathname);
                  const locked = item.feature
                    ? !canAccess(user, item.feature)
                    : false;

                  const button = (
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className={cn(
                        "gap-2.5",
                        active &&
                          "text-sidebar-accent-foreground font-medium"
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
                        {locked && (
                          <Lock className="text-muted-foreground/60 ml-auto size-3 shrink-0" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  );

                  return (
                    <SidebarMenuItem key={item.href}>
                      {locked ? (
                        <Tooltip>
                          <TooltipTrigger asChild>{button}</TooltipTrigger>
                          <TooltipContent side="right">
                            Included with Pro
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
        ))}
      </SidebarContent>

      <SidebarFooter className="px-3 pb-3">
        {user && !user.isPro && user.role !== "ADMIN" && (
          <Link
            href="/pricing"
            className="border-ember-500/25 bg-ember-500/8 hover:bg-ember-500/12 block rounded-lg border p-3 transition-colors group-data-[collapsible=icon]:hidden"
          >
            <p className="text-foreground text-sm font-medium">Unlock Pro</p>
            <p className="text-muted-foreground mt-0.5 text-xs leading-snug">
              Full curriculum, AI tutor and mock interviews.
            </p>
          </Link>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
