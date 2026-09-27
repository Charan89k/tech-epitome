"use client";

import Link from "next/link";
import { LogOut, Settings, Sparkles, User as UserIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/app/(auth)/actions";

export type UserMenuUser = {
  name: string | null;
  email: string;
  image: string | null;
  isPro: boolean;
  role: "USER" | "ADMIN";
};

/** Two initials from a display name, falling back to the email local part. */
function initials(name: string | null, email: string): string {
  const source = name?.trim() || email.split("@")[0] || "?";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  const letters =
    parts.length >= 2
      ? `${parts[0]![0]}${parts[1]![0]}`
      : source.slice(0, 2);
  return letters.toUpperCase();
}

export function UserMenu({ user }: { user: UserMenuUser }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-full"
          aria-label="Account menu"
        >
          <Avatar className="size-8">
            {user.image && (
              <AvatarImage src={user.image} alt="" referrerPolicy="no-referrer" />
            )}
            <AvatarFallback className="bg-muted text-xs font-medium">
              {initials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium">
                {user.name ?? "Your account"}
              </span>
              {user.role === "ADMIN" ? (
                <Badge variant="outline" className="h-5 px-1.5 text-[0.65rem]">
                  Admin
                </Badge>
              ) : user.isPro ? (
                <Badge className="bg-ember-500/15 text-ember-400 border-ember-500/25 h-5 border px-1.5 text-[0.65rem]">
                  Pro
                </Badge>
              ) : null}
            </div>
            <span className="text-muted-foreground truncate text-xs">
              {user.email}
            </span>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserIcon className="size-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="size-4" />
            Settings
          </Link>
        </DropdownMenuItem>

        {!user.isPro && user.role !== "ADMIN" && (
          <DropdownMenuItem asChild>
            <Link href="/pricing">
              <Sparkles className="text-ember-500 size-4" />
              Upgrade to Pro
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* A POST form, not a link: signing out changes state and must not be
            triggerable by a prefetch or a crawler. */}
        <form action={signOutAction}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full cursor-default">
              <LogOut className="size-4" />
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
