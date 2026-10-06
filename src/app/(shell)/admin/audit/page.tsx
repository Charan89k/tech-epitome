import type { Metadata } from "next";
import { ScrollText } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
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
        <div className="bg-card border-border mt-4 rounded-xl border">
          <EmptyState
            icon={ScrollText}
            title="Nothing has been changed yet"
            description="Administrative actions appear here as they happen."
          />
        </div>
      ) : (
        <div className="bg-card border-border mt-4 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[48rem] text-sm">
            <caption className="sr-only">Administrative changes, newest first</caption>
            <thead>
              <tr className="border-border text-muted-foreground bg-muted/20 border-b text-left text-xs">
                <th scope="col" className="w-40 px-4 py-2.5 font-medium">
                  When
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Action
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Change
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  By
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-accent/25 align-top transition-colors">
                  <td className="text-muted-foreground px-4 py-2.5 text-xs whitespace-nowrap">
                    <time dateTime={row.createdAt.toISOString()}>
                      {row.createdAt.toLocaleString()}
                    </time>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="bg-muted/60 rounded-md px-1.5 py-0.5 font-mono text-[0.68rem] whitespace-nowrap">
                      {row.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="text-sm">{row.summary}</p>
                    {row.entityId && (
                      <p className="text-muted-foreground/60 mt-0.5 font-mono text-[0.65rem]">
                        {row.entity} · {row.entityId}
                      </p>
                    )}
                  </td>
                  <td className="text-muted-foreground px-4 py-2.5 text-xs">
                    {row.actorEmail}
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
