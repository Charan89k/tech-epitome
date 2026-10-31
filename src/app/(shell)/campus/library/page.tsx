import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark, FileText, Highlighter } from "lucide-react";

import { CampusTrail } from "@/components/campus/campus-trail";
import { PageHeader } from "@/components/common/page-header";
import { requireCampusUser } from "@/lib/campus-access";

export const metadata: Metadata = { title: "Library" };

const ITEMS = [
  {
    href: "/dashboard/notes",
    icon: FileText,
    title: "Notes",
    text: "Everything you wrote while studying.",
  },
  {
    href: "/dashboard/highlights",
    icon: Highlighter,
    title: "Highlights",
    text: "Passages you marked in chapters.",
  },
  {
    href: "/dashboard/bookmarks",
    icon: Bookmark,
    title: "Bookmarks",
    text: "Chapters and problems you saved.",
  },
] as const;

export default async function CampusLibraryPage() {
  await requireCampusUser("/campus/library");
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow={<CampusTrail items={[{ label: "Library" }]} />}
        title="Your library"
        description="These belong to your account and stay with you if you leave. Your college cannot read them."
      />
      <ul className="mt-6 divide-y divide-border border-y border-border">
        {ITEMS.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="group flex items-center gap-3 py-4">
              <item.icon className="size-4 text-brand-300" aria-hidden="true" />
              <span>
                <span className="block font-medium group-hover:text-brand-300">
                  {item.title}
                </span>
                <span className="block text-sm text-muted-foreground">{item.text}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
