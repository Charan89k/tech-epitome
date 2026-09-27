import type { Metadata } from "next";
import { ScrollText } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { listAuditLog } from "@/services/admin";

export const metadata: Metadata = { title: "Audit log" };

/**
 * What admins have done.
 *
 * Append-only by construction: `services/admin.ts` writes a row inside
 * the same transaction as every mutation, and nothing in the codebase
 * updates or deletes one. There is deliberately no foreign key to the
 * user table — deleting an admin account must not erase the record of
 * what they did, so the actor's email is denormalised at write time.
 */
export default async function AdminAuditPage() {
  const rows = await listAuditLog(200);

  return (
    <div>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Every administrative change, in order. Written in the same
        transaction as the change itself, so there is no sequence in which a
        mutation lands without a record of who made it.
      </p>

      {rows.length === 0 ? (
        <div className="border-border mt-4 rounded-lg border border-dashed">
          <EmptyState
            icon={ScrollText}
            title="Nothing has been changed yet"
            description="Administrative actions appear here as they happen."
          />
        </div>
      ) : (
        <ol className="border-border mt-4 divide-y divide-[var(--border)] overflow-hidden rounded-lg border">
          {rows.map((row) => (
            <li key={row.id} className="p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono text-[0.65rem]">
                  {row.action}
                </Badge>
                <span className="text-muted-foreground text-xs">
                  {row.actorEmail}
                </span>
                <time
                  dateTime={row.createdAt.toISOString()}
                  className="text-muted-foreground/70 ml-auto text-xs whitespace-nowrap"
                >
                  {row.createdAt.toLocaleString()}
                </time>
              </div>
              <p className="mt-1.5 text-sm">{row.summary}</p>
              {row.entityId && (
                <p className="text-muted-foreground/60 mt-0.5 font-mono text-[0.65rem]">
                  {row.entity} · {row.entityId}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
