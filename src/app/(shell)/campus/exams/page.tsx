import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList } from "lucide-react";

import { CampusTrail } from "@/components/campus/campus-trail";
import { When } from "@/components/campus/when";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { SectionHeading } from "@/components/common/section-heading";
import { Badge } from "@/components/ui/badge";
import { requireCampusUser } from "@/lib/campus-access";
import { route } from "@/lib/utils";
import { listMyExams, type MyExam } from "@/services/campus-exams";

export const metadata: Metadata = { title: "Exams" };

function ExamList({ exams }: { exams: MyExam[] }) {
  return (
    <ul className="divide-y divide-border">
      {exams.map((exam) => (
        <li key={exam.id}>
          <Link
            href={route(`/campus/${exam.collegeSlug}/assessments/${exam.id}`)}
            className="group flex flex-wrap items-center gap-x-4 gap-y-1 py-3.5"
          >
            <span className="min-w-0 flex-1">
              <span className="block font-medium group-hover:text-brand-300">
                {exam.title}
              </span>
              <span className="block text-sm text-muted-foreground">
                {exam.className} · {exam.collegeName}
              </span>
            </span>
            <span className="font-mono text-xs text-subtle-foreground">
              Closes <When date={exam.closesAt} />
            </span>
            {exam.attempts > 0 && <Badge variant="outline">Attempted</Badge>}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function ExamsPage() {
  const user = await requireCampusUser("/campus/exams");
  const exams = await listMyExams(user);
  const now = new Date();
  const upcoming = exams.filter((e) => e.closesAt >= now && e.status === "PUBLISHED");
  const past = exams.filter((e) => !upcoming.includes(e));

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow={<CampusTrail items={[{ label: "Exams" }]} />}
        title="Exams"
        description="Published exams in your classes, across all your colleges."
      />
      {exams.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No exams yet"
          description="When an instructor publishes an exam in one of your classes, it appears here."
        />
      ) : (
        <div className="mt-6 space-y-10">
          <section aria-labelledby="upcoming-heading">
            <SectionHeading
              id="upcoming-heading"
              title="Open and upcoming"
              count={upcoming.length}
            />
            {upcoming.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Nothing open right now.
              </p>
            ) : (
              <ExamList exams={upcoming} />
            )}
          </section>
          {past.length > 0 && (
            <section aria-labelledby="past-heading">
              <SectionHeading id="past-heading" title="Past" count={past.length} />
              <ExamList exams={past} />
            </section>
          )}
        </div>
      )}
    </div>
  );
}
