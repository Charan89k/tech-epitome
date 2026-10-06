import type { Metadata } from "next";
import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { StatusToggle } from "@/components/admin/status-toggle";
import { Input } from "@/components/ui/input";
import { listContent, type ContentKind } from "@/services/admin";
import { cn, route } from "@/lib/utils";

export const metadata: Metadata = { title: "Content" };

const KINDS: { key: ContentKind; label: string }[] = [
  { key: "problem", label: "Problems" },
  { key: "chapter", label: "Chapters" },
  { key: "systemDesign", label: "System design" },
  { key: "lld", label: "LLD" },
  { key: "behavioral", label: "Behavioural" },
  { key: "prepTrack", label: "Prep tracks" },
];

function isKind(value: unknown): value is ContentKind {
  return KINDS.some((kind) => kind.key === value);
}

export default async function AdminContentPage({
  searchParams,
}: PageProps<"/admin/content">) {
  const params = await searchParams;

  // Narrowed against a closed list, so the query parameter can never
  // select an arbitrary Prisma delegate.
  const kind: ContentKind = isKind(params.kind) ? params.kind : "problem";
  const query = typeof params.q === "string" ? params.q : undefined;

  const rows = await listContent(kind, query);

  return (
    <div>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Publishing state is the only field editable here. Bodies are validated
        block documents authored in <code className="text-xs">src/data/</code>;
        a textarea that let arbitrary JSON into them would be a worse tool than
        the seed it replaced. Changing what learners can <em>see</em> is the
        operation this screen exists for.
      </p>

      <div className="bg-card border-border mt-4 flex flex-col gap-2 rounded-xl border p-2 md:flex-row md:items-center">
      <nav aria-label="Content type" className="flex flex-wrap gap-1">
        {KINDS.map((item) => (
          <Link
            key={item.key}
            href={route(`/admin/content?kind=${item.key}`)}
            aria-current={item.key === kind ? "page" : undefined}
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-xs transition-colors",
              item.key === kind
                ? "bg-ember-500/12 text-ember-300 font-medium"
                : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <form className="min-w-0 md:ml-auto md:w-64">
        <input type="hidden" name="kind" value={kind} />
        <label htmlFor="q" className="sr-only">
          Search content
        </label>
        <Input
          id="q"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Search by title…"
        />
      </form>
      </div>

      {rows.length === 0 ? (
        <div className="bg-card border-border mt-4 rounded-xl border">
          <EmptyState
            icon={FileQuestion}
            title="Nothing here"
            description={
              query
                ? "No content of this type matches that search."
                : "No content of this type exists yet."
            }
          />
        </div>
      ) : (
        <div className="bg-card border-border mt-4 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[32rem] text-sm">
            <caption className="sr-only">
              {KINDS.find((item) => item.key === kind)?.label} and their publication status
            </caption>
            <thead>
              <tr className="border-border text-muted-foreground bg-muted/20 border-b text-left text-xs">
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Title
                </th>
                <th scope="col" className="w-44 px-4 py-2.5 font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-accent/25 transition-colors">
                  <td className="max-w-0 px-4 py-2.5">
                    <p className="truncate text-sm font-medium">{row.title}</p>
                    {row.subtitle && (
                      <p className="text-muted-foreground truncate text-xs">
                        {row.subtitle}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 align-top">
                    <StatusToggle kind={kind} id={row.id} status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
