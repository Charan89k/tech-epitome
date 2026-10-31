import "server-only";

import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Runs `fn` as the least-privilege `te_tenant` database role, with the
 * caller's identity and institution stamped on the transaction.
 *
 * This is the database half of tenant isolation. The service layer already
 * filters by institution; the row-level security policies on the
 * institution tables (migration 20261028120100_tenant_rls_role) mean a
 * query that forgets to still cannot see or write another institution's
 * rows, and `te_tenant` has no grant on anyone's personal learning data.
 *
 * Everything is transaction-local - `SET LOCAL ROLE` and
 * `set_config(..., true)` both end at COMMIT or ROLLBACK - so a pooled
 * connection hands the next request a clean owner session, never this
 * request's role or tenant. That property is what makes this safe behind
 * Supabase's transaction pooler; tests/scope.integration.test.ts asserts it.
 */
export type TenantScope = {
  /** The institution the transaction may touch; null for none. */
  institutionId: string | null;
  /** The signed-in user, for "my own memberships" reads. */
  userId: string;
  /** Platform operator: may create and list institutions. */
  platformAdmin?: boolean;
};

export type TenantTx = Prisma.TransactionClient;

export async function withTenantScope<T>(
  scope: TenantScope,
  fn: (tx: TenantTx) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SET LOCAL ROLE te_tenant");
    await setScope(tx, scope);
    return fn(tx);
  });
}

/**
 * Re-points the current tenant transaction at another institution. Only
 * for flows that have just looked the institution up through one of the
 * definer functions (domain enrolment, invitation acceptance) or created it.
 */
export async function setScope(tx: TenantTx, scope: TenantScope): Promise<void> {
  await tx.$queryRaw`
    SELECT
      set_config('app.institution_id', ${scope.institutionId ?? ""}, true),
      set_config('app.user_id', ${scope.userId}, true),
      set_config('app.platform_admin', ${scope.platformAdmin ? "on" : "off"}, true)
  `;
}
