import type { Metadata } from "next";

import { PageHeader } from "@/components/common/page-header";
import { SqlLab } from "@/components/sql-lab/sql-lab";

export const metadata: Metadata = {
  title: "SQL Playground",
  description:
    "Practise SQL against a real PostgreSQL running in your browser, with exercises that check your answer.",
  alternates: { canonical: "/sql" },
};

export default function SqlPlaygroundPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Practice"
        title="SQL Playground"
        description="A real PostgreSQL running in your browser. Nothing you type reaches our servers, and you can break the data and reset it as often as you like."
      />
      <SqlLab />
    </div>
  );
}
