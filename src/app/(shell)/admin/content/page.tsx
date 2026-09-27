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

      <nav aria-label="Content type" className="mt-4 flex flex-wrap gap-1.5">
        {KINDS.map((item) => (
          <Link
            key={item.key}
            href={route(`/admin/content?kind=${item.key}`)}
            aria-current={item.key === kind ? "page" : undefined}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs transition-colors",
              item.key === kind
                ? "border-ember-500/40 bg-ember-500/10 text-ember-300"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <form className="mt-4 max-w-sm">
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

      {rows.length === 0 ? (
        <div className="border-border mt-4 rounded-lg border border-dashed">
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
        <ul className="border-border mt-4 divide-y divide-[var(--border)] overflow-hidden rounded-lg border">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center gap-3 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{row.title}</p>
                {row.subtitle && (
                  <p className="text-muted-foreground truncate text-xs">
                    {row.subtitle}
                  </p>
                )}
              </div>
              <StatusToggle kind={kind} id={row.id} status={row.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
