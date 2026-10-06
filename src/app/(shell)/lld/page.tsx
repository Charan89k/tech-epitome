import type { Metadata } from "next";
import { Boxes } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { FeatureLink, HowItWorks } from "@/components/system-design/catalogue-parts";
import { DesignProgress } from "@/components/system-design/design-progress";
import type { DesignThumbKind } from "@/components/system-design/design-thumb";
import { ExerciseCard } from "@/components/system-design/exercise-card";
import { getCurrentUser } from "@/lib/auth/session";
import { listLLDProblems } from "@/services/lld";

export const metadata: Metadata = {
  title: "Design exercises — LLD",
  description:
    "Design the classes for a realistic brief, submit your design, then compare it against a reference and its trade-offs.",
  alternates: { canonical: "/lld" },
};

/** Thumbnails that suit the published briefs; anything new cycles. */
const THUMB_FOR: Record<string, DesignThumbKind> = {
  "parking-garage": "classes",
  "vending-machine": "state",
  "event-logger": "events",
};
const THUMBS: DesignThumbKind[] = ["classes", "state", "events"];

export default async function LLDIndexPage() {
  const user = await getCurrentUser();
  const problems = await listLLDProblems(user?.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="grid gap-4 md:grid-cols-2">
        <FeatureLink
          href="/learn/lld"
          title="Low-Level Design Course"
          description="Responsibilities, relationships and the patterns that keep a design open to change."
          thumb="classes"
        />
        <FeatureLink
          href="/system-design"
          title="System Design"
          description="One layer up: draw the services, stores and queues behind a product."
          thumb="pipeline"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_17rem]">
        <div className="min-w-0 space-y-4">
          <PageHeader
            title="Low-Level Design Exercises"
            description="Read the brief, decide what each class is the only thing that knows, and say what you traded away. The reference appears after you submit — not before."
          />
          <HowItWorks
            steps={["Read the brief", "Design the classes", "Submit and compare"]}
          />
        </div>
        <DesignProgress
          statuses={problems.map((p) => p.status)}
          signedIn={Boolean(user)}
          signedOutText="Sign in to save your designs and see the reference solutions."
        />
      </div>

      {problems.length === 0 ? (
        <div className="bg-card border-border mt-6 rounded-xl border">
          <EmptyState
            icon={Boxes}
            title="No exercises published yet"
            description="Design exercises appear here once published. Running locally? Seed the database with npm run db:seed."
          />
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map((problem, index) => (
            <li key={problem.slug}>
              <ExerciseCard
                href={`/lld/${problem.slug}`}
                title={problem.title}
                tagline={problem.tagline}
                difficulty={problem.difficulty}
                status={problem.status}
                thumb={THUMB_FOR[problem.slug] ?? THUMBS[index % THUMBS.length]!}
                tags={problem.designPatterns}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
