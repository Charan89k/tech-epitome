import type { Metadata } from "next";

import { EmptyState } from "@/components/common/empty-state";
import { Pagination } from "@/components/problems/pagination";
import { RoleSelect } from "@/components/admin/role-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth/session";
import { listUsers } from "@/services/admin";

import { setUserSuspendedAction } from "../institutions/actions";
import { Search, Users } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage({
  searchParams,
}: PageProps<"/admin/users">) {
  const admin = await requireAdmin();
  const params = await searchParams;

  const query = typeof params.q === "string" ? params.q : undefined;
  const page = Number.parseInt(typeof params.page === "string" ? params.page : "1", 10);

  const result = await listUsers({
    query,
    page: Number.isFinite(page) ? page : 1,
  });

  const baseQuery = new URLSearchParams();
  if (query) baseQuery.set("q", query);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        {/* A GET form, so a filtered list is a shareable URL and the back
            button behaves. No client JS needed for it. */}
        <form role="search" className="flex min-w-0 flex-1 gap-2 sm:max-w-md">
          <label htmlFor="q" className="sr-only">
            Search users by name or email
          </label>
          <Input
            id="q"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Search by name or email…"
          />
          <Button type="submit" variant="outline">
            <Search className="size-4" aria-hidden="true" />
            Search
          </Button>
          {query && (
            <Button asChild variant="ghost">
              <Link href="/admin/users">Clear</Link>
            </Button>
          )}
        </form>
        <p className="ml-auto label-mono tabular-nums">
          {result.total} {result.total === 1 ? "account" : "accounts"}
        </p>
      </div>

      {result.rows.length === 0 ? (
        <div className="mt-4 rounded-lg border border-border bg-card">
          <EmptyState
            icon={Users}
            title="No accounts match"
            description={
              query ? "Try a different name or email." : "Nobody has signed up yet."
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full min-w-[44rem] text-sm">
              <caption className="sr-only">
                Accounts, newest first, with their role
              </caption>
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left [&>th]:label-mono [&>th]:font-normal">
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Account
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Joined
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">
                    Solved
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">
                    Interviews
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Role
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.rows.map((row) => (
                  <tr
                    key={row.id}
                    className="align-top transition-colors hover:bg-accent/25"
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{row.name ?? "Unnamed"}</span>
                        {row.id === admin.id && <Badge variant="outline">You</Badge>}
                        {row.status !== "ACTIVE" && (
                          <Badge variant="warning">{row.status.toLowerCase()}</Badge>
                        )}
                      </div>
                      <span className="block text-xs text-muted-foreground">
                        {row.email}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-muted-foreground">
                      {row.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {row.problemsSolved}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {row.interviews}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <RoleSelect
                          userId={row.id}
                          role={row.role}
                          // An admin cannot demote themselves. Disabling the
                          // control says so before the server has to refuse.
                          self={row.id === admin.id}
                        />
                        {row.id !== admin.id && (
                          <form
                            action={setUserSuspendedAction.bind(
                              null,
                              row.id,
                              row.status === "ACTIVE"
                            )}
                          >
                            <Button
                              type="submit"
                              size="xs"
                              variant={
                                row.status === "ACTIVE" ? "outline" : "secondary"
                              }
                            >
                              {row.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                            </Button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              total={result.total}
              baseQuery={baseQuery.toString()}
              pathname="/admin/users"
              noun="account"
            />
          </div>
        </>
      )}
    </div>
  );
}
