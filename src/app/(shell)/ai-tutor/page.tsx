import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, ListChecks } from "lucide-react";

import { TutorPanel } from "@/components/tutor/tutor-panel";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { labelFor } from "@/lib/tutor/context";
import { GLOBAL_QUICK_ACTIONS } from "@/lib/tutor/types";
import { loadContextBundle } from "@/services/tutor";

export const metadata: Metadata = {
  title: "AI Tutor",
  description:
    "Ask about anything in the curriculum. The tutor knows what you have studied.",
};

/**
 * The general tutor.
 *
 * Deliberately the least capable of the three entry points, and it says so.
 * A tutor that knows which chapter you are reading and what your code does
 * gives materially better help than one answering in the abstract, so this
 * page points at the contextual entry points rather than pretending to
 * replace them. It exists for the questions that genuinely span the
 * curriculum — "what should I study next", "why do I keep failing these" —
 * which is also why its context is the learner's progress rather than a
 * page.
 */
export default async function AiTutorPage() {
  const user = await requireUser("/ai-tutor");

  const bundle = await loadContextBundle({ kind: "GLOBAL" }, user.id);

  return (
    <div className="mx-auto flex h-[calc(100dvh-3.5rem)] w-full max-w-5xl flex-col lg:flex-row">
      <div className="min-h-0 flex-1 border-border lg:border-r">
        <TutorPanel
          anchor={{ kind: "GLOBAL" }}
          label={
            bundle
              ? labelFor(bundle)
              : { contextType: "GLOBAL", primary: null, secondary: null, chips: [] }
          }
          quickActions={GLOBAL_QUICK_ACTIONS}
        />
      </div>

      <aside className="hidden w-72 shrink-0 p-5 lg:block">
        <h2 className="text-sm font-semibold">Better with context</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          Open the tutor from inside a chapter or a problem and it reads what you are
          looking at — the lesson text, the problem, your code, and your last failing
          test.
        </p>

        <div className="mt-4 space-y-2">
          <Button asChild variant="outline" size="sm" className="w-full justify-start">
            <Link href="/learn/dsa">
              <GraduationCap className="size-3.5" />
              Open the curriculum
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="w-full justify-start">
            <Link href="/problems">
              <ListChecks className="size-3.5" />
              Pick a problem
            </Link>
          </Button>
        </div>
      </aside>
    </div>
  );
}
