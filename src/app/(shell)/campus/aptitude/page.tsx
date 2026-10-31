import type { Metadata } from "next";
import Link from "next/link";

import { AptitudeSet } from "@/components/campus/aptitude-set";
import { CampusTrail } from "@/components/campus/campus-trail";
import { PageHeader } from "@/components/common/page-header";
import { SectionHeading } from "@/components/common/section-heading";
import { APTITUDE_TOPICS, aptitudeTopic } from "@/data/aptitude";
import { requireCampusUser } from "@/lib/campus-access";
import { prisma } from "@/lib/db";
import { cn, route } from "@/lib/utils";

export const metadata: Metadata = { title: "Aptitude" };

export default async function AptitudePage({
  searchParams,
}: PageProps<"/campus/aptitude">) {
  const user = await requireCampusUser("/campus/aptitude");
  const { topic: requested } = await searchParams;
  const topic =
    (typeof requested === "string" ? aptitudeTopic(requested) : null) ??
    APTITUDE_TOPICS[0]!;
  const recent = await prisma.aptitudeAttempt.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, topic: true, correct: true, total: true, createdAt: true },
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow={<CampusTrail items={[{ label: "Aptitude" }]} />}
        title="Aptitude practice"
        description="Short sets with worked explanations. Your scores are yours; your college does not see them."
      />
      <nav
        aria-label="Topics"
        className="mt-5 flex overflow-x-auto border-b border-border"
      >
        {APTITUDE_TOPICS.map((t) => (
          <Link
            key={t.key}
            href={route(`/campus/aptitude?topic=${t.key}`)}
            aria-current={t.key === topic.key ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm whitespace-nowrap",
              t.key === topic.key
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.title}
          </Link>
        ))}
      </nav>
      <p className="mt-4 text-sm text-muted-foreground">{topic.description}</p>
      <div className="mt-5">
        {/* Keyed so changing topic starts a fresh set. No answers cross this line. */}
        <AptitudeSet
          key={topic.key}
          topicKey={topic.key}
          questions={topic.questions.map(({ id, prompt, options }) => ({
            id,
            prompt,
            options,
          }))}
        />
      </div>
      {recent.length > 0 && (
        <section aria-labelledby="recent-heading" className="mt-10">
          <SectionHeading id="recent-heading" title="Your recent sets" />
          <ul className="mt-2 divide-y divide-border text-sm">
            {recent.map((a) => (
              <li key={a.id} className="flex justify-between py-2">
                <span className="capitalize">{a.topic}</span>
                <span className="font-mono text-muted-foreground">
                  {a.correct}/{a.total} · {a.createdAt.toISOString().slice(0, 10)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
