"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { toggleBookmarkAction } from "@/app/(shell)/library-actions";
import type { Annotatable } from "@/services/library";
import { cn } from "@/lib/utils";

/**
 * Saves a problem, chapter or pattern to the library.
 *
 * Optimistic, and reverts on failure with the server's reason. The
 * unique constraint means a double click races to the same row rather
 * than creating two, so the only real failure is being signed out or
 * the target having been unpublished underneath.
 *
 * Signed out it is not hidden: it says so and points at the login page,
 * because a control that vanishes is harder to understand than one that
 * explains itself.
 */
export function BookmarkButton({
  entityType,
  entityId,
  initiallyBookmarked,
  signedIn,
  variant = "ghost",
  className,
}: {
  entityType: Annotatable;
  entityId: string;
  initiallyBookmarked: boolean;
  signedIn: boolean;
  variant?: "ghost" | "outline";
  className?: string;
}) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(initiallyBookmarked);
  const [pending, start] = useTransition();

  function toggle() {
    if (!signedIn) {
      toast("Sign in to save this", {
        description: "Your library is tied to your account. It is free.",
        action: { label: "Sign in", onClick: () => router.push("/login") },
      });
      return;
    }

    const next = !bookmarked;
    setBookmarked(next);

    start(async () => {
      const result = await toggleBookmarkAction({ entityType, entityId });
      if (result.ok) {
        setBookmarked(result.data.bookmarked);
      } else {
        setBookmarked(!next);
        toast.error(result.error);
      }
    });
  }

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      onClick={toggle}
      disabled={pending}
      aria-pressed={signedIn ? bookmarked : undefined}
      // The label carries the state, so a screen reader is not relying on
      // the icon's fill to tell saved from unsaved.
      aria-label={bookmarked ? "Remove from library" : "Save to library"}
      className={cn("h-8 gap-1.5", className)}
    >
      <Bookmark
        className={cn("size-3.5", bookmarked && "fill-current text-ember-500")}
        aria-hidden="true"
      />
      <span className="hidden sm:inline">{bookmarked ? "Saved" : "Save"}</span>
    </Button>
  );
}
