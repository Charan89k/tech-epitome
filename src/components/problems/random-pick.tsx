"use client";

import { useRouter } from "next/navigation";
import { Shuffle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { route } from "@/lib/utils";

/**
 * Opens a random problem. "Unsolved" is the useful default for a learner
 * who wants to be surprised; "Any" is there for revision.
 *
 * The pick happens in the browser from the slugs already on the page, so
 * it costs no request and needs no endpoint.
 */
export function RandomPick({
  problems,
  signedIn,
}: {
  problems: { slug: string; status: string }[];
  signedIn: boolean;
}) {
  const router = useRouter();
  const unsolved = problems.filter((p) => p.status !== "SOLVED");

  function open(pool: { slug: string }[]) {
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)]!;
    router.push(route(`/problems/${pick.slug}`));
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Shuffle className="size-4" aria-hidden="true" />
        Pick a random problem
      </span>
      {signedIn && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => open(unsolved)}
          disabled={unsolved.length === 0}
        >
          Unsolved ({unsolved.length})
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => open(problems)}
        disabled={problems.length === 0}
      >
        Any ({problems.length})
      </Button>
    </div>
  );
}
