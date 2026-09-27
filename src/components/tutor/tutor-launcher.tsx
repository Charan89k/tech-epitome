"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";

import { TutorPanel } from "@/components/tutor/tutor-panel";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import type {
  TutorAnchor,
  TutorCodeState,
  TutorContextLabel,
  TutorQuickAction,
} from "@/lib/tutor/types";
import { cn } from "@/lib/utils";

/**
 * "Ask Tutor", and the drawer behind it.
 *
 * The panel is mounted only while open. That is not a performance
 * nicety — an unmounted panel cannot hold a stream, so closing the drawer
 * genuinely aborts the request rather than leaving it running invisibly,
 * and reopening does not resurrect half a stale answer.
 *
 * Locked state is handled here rather than by hiding the button. A learner
 * on the free plan should be able to see that the tutor exists and what it
 * would do; the product's rule is that nothing in the navigation is a dead
 * end, not that paid features are invisible.
 */
export function TutorLauncher({
  anchor,
  label,
  quickActions,
  getCode,
  access,
  variant = "outline",
  className,
}: {
  anchor: TutorAnchor;
  label: TutorContextLabel;
  quickActions: TutorQuickAction[];
  getCode?: () => TutorCodeState | undefined;
  /** Resolved on the server: whether this learner may actually use it. */
  access: "allowed" | "signin" | "upgrade";
  variant?: "outline" | "ghost" | "default";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <>
      <Button
        variant={variant}
        size="sm"
        className={cn("h-8 gap-1.5", className)}
        onClick={() => setOpen(true)}
        data-testid="tutor-open"
      >
        <Sparkles className="size-3.5" aria-hidden="true" />
        Ask Tutor
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          // A phone gets the full height from the bottom, which keeps the
          // composer above the on-screen keyboard instead of behind it.
          side={isMobile ? "bottom" : "right"}
          className={cn(
            "gap-0 p-0",
            isMobile
              ? "h-[92dvh] w-full max-w-none rounded-t-xl"
              : "w-full sm:max-w-md"
          )}
        >
          {/* The dialog's accessible name. Names the context rather than
              repeating the panel's own visible "AI Tutor" heading, so a
              screen reader hears what this tutor is about instead of the
              same two words twice. */}
          <SheetHeader className="sr-only">
            <SheetTitle>
              {label.secondary
                ? `AI Tutor — ${label.secondary}`
                : "AI Tutor"}
            </SheetTitle>
          </SheetHeader>

          {access === "allowed" ? (
            <TutorPanel
              anchor={anchor}
              label={label}
              quickActions={quickActions}
              getCode={getCode}
            />
          ) : (
            <LockedTutor reason={access} />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function LockedTutor({ reason }: { reason: "signin" | "upgrade" }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <Lock className="text-muted-foreground size-6" aria-hidden="true" />
      <h2 className="mt-3 text-sm font-semibold">The AI tutor is part of Pro</h2>
      <p className="text-muted-foreground mt-2 max-w-xs text-sm leading-relaxed">
        {reason === "signin"
          ? "Sign in to check whether your plan includes it."
          : "It knows the chapter you are reading and the code in your editor, and it walks you to the answer instead of handing it over."}
      </p>
      <Button asChild className="mt-6">
        <Link href={reason === "signin" ? "/login" : "/pricing"}>
          {reason === "signin" ? "Sign in" : "See plans"}
        </Link>
      </Button>
    </div>
  );
}
