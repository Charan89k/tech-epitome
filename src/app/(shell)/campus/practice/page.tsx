import type { Metadata } from "next";
import Link from "next/link";

import { CampusTrail } from "@/components/campus/campus-trail";
import { DifficultyBadge } from "@/components/common/difficulty-badge";
import { PageHeader } from "@/components/common/page-header";
import { requireCampusUser } from "@/lib/campus-access";
import { route } from "@/lib/utils";
import { listProblemsByPattern } from "@/services/problems";

export const metadata: Metadata = { title: "DSA Practice" };

/** The shared catalogue, by pattern. A college assigns from it; it adds no copy. */
export default async function CampusPracticePage() {
  const user = await requireCampusUser("/campus/practice");
  const groups = (await listProblemsByPattern(user.id)).filter((g) => g.pattern);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow={<CampusTrail items={[{ label: "DSA Practice" }]} />}
        title="DSA practice"
        description="Work through a pattern at a time. Problems your class assigned also appear in that class."
      />
      <div className="mt-6 space-y-3">
        {groups.map((group) => {
          const solved = group.problems.filter((p) => p.status === "SOLVED").length;
          return (
            <details
              key={group.pattern!.slug}
              className="rounded-lg border border-border bg-card"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0">
                  <span className="block font-medium">{group.pattern!.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {group.pattern!.tagline}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-xs text-subtle-foreground">
                  {solved}/{group.problems.length}
                </span>
              </summary>
              <ul className="divide-y divide-border border-t border-border">
                {group.problems.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                  >
                    <Link
                      href={route(`/problems/${p.slug}`)}
                      className="min-w-0 text-info hover:underline"
                    >
                      {p.title}
                    </Link>
                    <DifficultyBadge difficulty={p.difficulty} />
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
      </div>
    </div>
  );
}
