import type { Metadata } from "next";

import { EmptyState } from "@/components/common/empty-state";
import { Pagination } from "@/components/problems/pagination";
import { RoleSelect } from "@/components/admin/role-select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth/session";
import { listUsers } from "@/services/admin";
import { Users } from "lucide-react";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage({
  searchParams,
}: PageProps<"/admin/users">) {
  const admin = await requireAdmin();
  const params = await searchParams;

  const query = typeof params.q === "string" ? params.q : undefined;
  const page = Number.parseInt(
    typeof params.page === "string" ? params.page : "1",
    10
  );

  const result = await listUsers({
    query,
    page: Number.isFinite(page) ? page : 1,
  });

  const baseQuery = new URLSearchParams();
  if (query) baseQuery.set("q", query);

  return (
    <div>
      {/* A GET form, so a filtered list is a shareable URL and the back
          button behaves. No client JS needed for it. */}
      <form className="max-w-sm">
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
      </form>

      <p className="text-muted-foreground mt-3 text-xs">
        {result.total} {result.total === 1 ? "account" : "accounts"}
      </p>

      {result.rows.length === 0 ? (
        <div className="border-border mt-4 rounded-lg border border-dashed">
          <EmptyState
            icon={Users}
            title="No accounts match"
            description={
              query
                ? "Try a different name or email."
                : "Nobody has signed up yet."
            }
          />
        </div>
      ) : (
        <>
          <div className="border-border mt-4 overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <caption className="sr-only">
                Accounts, newest first, with their role
              </caption>
              <thead>
                <tr className="border-border text-muted-foreground border-b text-left text-xs">
                  <th scope="col" className="px-3 py-2 font-medium">
                    Account
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Joined
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Solved
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Interviews
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Role
                  </th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {result.rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">
                          {row.name ?? "Unnamed"}
                        </span>
                        {row.id === admin.id && (
                          <Badge variant="outline" className="text-[0.65rem]">
                            You
                          </Badge>
                        )}
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {row.email}
                      </span>
                    </td>
                    <td className="text-muted-foreground px-3 py-2 text-xs whitespace-nowrap">
                      {row.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {row.problemsSolved}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {row.interviews}
                    </td>
                    <td className="px-3 py-2">
                      <RoleSelect
                        userId={row.id}
                        role={row.role}
                        // An admin cannot demote themselves. Disabling the
                        // control says so before the server has to refuse.
                        self={row.id === admin.id}
                      />
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
            />
          </div>
        </>
      )}
    </div>
  );
}
