import type { Metadata } from "next";
import { Boxes } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { DesignProgress } from "@/components/system-design/design-progress";
import type { DesignThumbKind } from "@/components/system-design/design-thumb";
import { ExerciseCard } from "@/components/system-design/exercise-card";
import { FeatureLink, HowItWorks } from "@/components/system-design/catalogue-parts";
import { getCurrentUser } from "@/lib/auth/session";
import { listSystemDesignProblems } from "@/services/system-design";

export const metadata: Metadata = {
  title: "Design exercises",
  description:
    "Draw an architecture for a realistic brief, submit it, then compare against a reference and its trade-offs.",
  alternates: { canonical: "/system-design" },
};

/** Thumbnails that suit the published briefs; anything new cycles. */
const THUMB_FOR: Record<string, DesignThumbKind> = {
  "short-link-service": "pipeline",
  "request-rate-limiter": "layers",
  "notification-delivery": "fanout",
};
const THUMBS: DesignThumbKind[] = ["pipeline", "fanout", "layers"];

export default async function SystemDesignIndexPage() {
  const user = await getCurrentUser();
  const problems = await listSystemDesignProblems(user?.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="grid gap-4 md:grid-cols-2">
        <FeatureLink
          href="/learn/system-design"
          title="System Design Course"
          description="The lessons behind these exercises: scale, caching, queues and the trade-offs between them."
          thumb="layers"
        />
        <FeatureLink
          href="/lld"
          title="Low-Level Design"
          description="One layer down: design the classes, their responsibilities and how they relate."
          thumb="classes"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_17rem]">
        <div className="min-w-0 space-y-4">
          <PageHeader
            title="Design Exercises"
            description="Read the brief, draw the architecture, say what you traded away. The reference appears after you submit — not before."
          />
          <HowItWorks
            steps={["Read the brief", "Draw the architecture", "Submit and compare"]}
          />
        </div>
        <DesignProgress
          statuses={problems.map((p) => p.status)}
          signedIn={Boolean(user)}
          signedOutText="Sign in to save your designs and see the reference architectures."
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
                href={`/system-design/${problem.slug}`}
                title={problem.title}
                tagline={problem.tagline}
                difficulty={problem.difficulty}
                status={problem.status}
                thumb={THUMB_FOR[problem.slug] ?? THUMBS[index % THUMBS.length]!}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
