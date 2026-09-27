import "dotenv/config";

import { Pool } from "pg";

/**
 * Direct database access for end-to-end test setup.
 *
 * Plain SQL over `pg` rather than Prisma Client: Playwright compiles test
 * files to CommonJS, and Prisma 7's generated client is ESM that uses
 * `import.meta`. Restructuring the whole project to ESM to give a test
 * helper four queries would be the tail wagging the dog, and `pg` is
 * already a dependency via the Prisma driver adapter.
 *
 * Used only for the two things a browser cannot do: assert what was
 * persisted, and make a review item due without waiting a day. Nothing here
 * substitutes for exercising the app through the UI.
 */

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set; e2e tests need the same database.");
}

/**
 * A single connection, used strictly sequentially, created on demand.
 *
 * The local `prisma dev` stand-in is PGlite-backed and desynchronises the
 * wire protocol when several connections are in flight at once; this helper
 * runs alongside the application's own pool, so it keeps its footprint to
 * one. Harmless against real PostgreSQL. See README "Known limitations".
 *
 * Lazy, and re-created after a close, because Playwright shares a module
 * registry across the spec files a worker runs. With more than one spec
 * importing this helper, the first file's `afterAll` would otherwise end
 * the pool out from under the next one — which surfaces as "Cannot use a
 * pool after calling end on the pool" in a test that never touched the
 * database directly.
 */
let activePool: Pool | null = null;

function pool(): Pool {
  activePool ??= new Pool({ connectionString, max: 1 });
  return activePool;
}

/**
 * Retries a query once past a known defect in the local stand-in database.
 *
 * `prisma dev` is PGlite-backed and cannot service concurrent connections:
 * with the application's pool and this helper both talking to it, the wire
 * protocol occasionally desynchronises and Postgres reports "bind message
 * supplies N parameters, but prepared statement requires 0". The statement
 * is fine; the connection is confused.
 *
 * This is a workaround for the test database, not for the application —
 * nothing in `src/` retries, and against real PostgreSQL this never fires.
 * It lives here so a flaky stand-in cannot masquerade as a product bug.
 */
async function withRetry<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/prepared statement|bind message/i.test(message)) throw error;
    await new Promise((resolve) => setTimeout(resolve, 120));
    return run();
  }
}

export type ReviewItemRow = {
  id: string;
  entityType: string;
  entityId: string;
  stage: string;
  /**
   * ISO-8601, UTC.
   *
   * Read as a string on purpose. Prisma maps `DateTime` to `timestamp`
   * (without time zone) and writes UTC into it; node-postgres, reading the
   * same column, parses a bare timestamp as *local* time and hands back a
   * Date shifted by the machine's offset. Formatting in SQL sidesteps the
   * driver entirely, so an assertion here means what it says on a laptop in
   * any timezone.
   */
  dueAtIso: string;
  intervalDays: number;
  repetitions: number;
  ease: number;
  lapses: number;
  totalReviews: number;
  lastGrade: string | null;
};

export async function userIdFor(email: string): Promise<string> {
  const result = await withRetry(() =>
    pool().query<{ id: string }>(`SELECT id FROM users WHERE email = $1`, [
      email.toLowerCase(),
    ])
  );
  const id = result.rows[0]?.id;
  if (!id) throw new Error(`No user with email ${email}`);
  return id;
}

export async function reviewItemsFor(email: string): Promise<ReviewItemRow[]> {
  const userId = await userIdFor(email);
  const result = await withRetry(() =>
    pool().query<ReviewItemRow>(
      `SELECT id,
            "entityType",
            "entityId",
            stage::text        AS stage,
            to_char("dueAt" AT TIME ZONE 'UTC',
                    'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "dueAtIso",
            "intervalDays",
            repetitions,
            ease,
            lapses,
            "totalReviews",
            "lastGrade"::text  AS "lastGrade"
       FROM review_items
      WHERE "userId" = $1
      ORDER BY "entityType" ASC, "entityId" ASC`,
      [userId]
    )
  );
  return result.rows;
}

/**
 * Makes every review item for a user due.
 *
 * New items are scheduled for tomorrow on purpose — recalling something
 * minutes after reading it measures nothing. Rather than weaken that rule
 * to make it testable, the test moves the clock the only way it can:
 * backdating the schedule, exactly as a day passing would.
 */
export async function makeReviewsDue(email: string, daysAgo = 1): Promise<number> {
  const userId = await userIdFor(email);
  const result = await withRetry(() =>
    pool().query(
      `UPDATE review_items
          SET "dueAt" = date_trunc('day', now() AT TIME ZONE 'utc')
                        - ($2 || ' days')::interval
        WHERE "userId" = $1`,
      [userId, String(daysAgo)]
    )
  );
  return result.rowCount ?? 0;
}

/** Idempotent: several spec files share this module and each closes it. */
export async function closeDb(): Promise<void> {
  const current = activePool;
  activePool = null;
  await current?.end();
}

/** Milliseconds since the epoch for a row's due date. */
export function dueAtMs(row: ReviewItemRow): number {
  return Date.parse(row.dueAtIso);
}

/**
 * Puts a freshly registered account on the Pro plan.
 *
 * The AI tutor is a Pro entitlement, and every end-to-end account is born
 * on the free plan through the real signup flow. Rather than weaken the
 * entitlement so the tests can reach the feature — which would test a
 * product nobody ships — the test buys the plan the only way a test can,
 * by writing the subscription row a checkout would have written.
 *
 * `currentPeriodEnd` is set well ahead because `getCurrentUser` treats an
 * elapsed period as not-Pro, which is exactly the behaviour under test
 * everywhere else.
 */
export async function makePro(email: string): Promise<void> {
  const userId = await userIdFor(email);
  await withRetry(() =>
    pool().query(
      `INSERT INTO subscriptions (id, "userId", plan, status, "currentPeriodEnd", "createdAt", "updatedAt")
            VALUES ($1, $2, 'PRO_MONTHLY', 'ACTIVE', now() + interval '30 days', now(), now())
       ON CONFLICT ("userId")
         DO UPDATE SET plan = 'PRO_MONTHLY',
                       status = 'ACTIVE',
                       "currentPeriodEnd" = now() + interval '30 days',
                       "updatedAt" = now()`,
      [`e2e-sub-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`, userId]
    )
  );
}

/** How many tutor messages a learner has, for asserting persistence. */
export async function tutorMessageCountFor(email: string): Promise<number> {
  const userId = await userIdFor(email);
  const result = await withRetry(() =>
    pool().query<{ count: string }>(
      `SELECT count(*)::text AS count
         FROM ai_messages m
         JOIN ai_conversations c ON c.id = m."conversationId"
        WHERE c."userId" = $1`,
      [userId]
    )
  );
  return Number(result.rows[0]?.count ?? "0");
}

/** Usage ledger rows written by the tutor, for asserting observability. */
export async function tutorUsageFor(
  email: string
): Promise<{ provider: string; model: string; feature: string; success: boolean }[]> {
  const userId = await userIdFor(email);
  const result = await withRetry(() =>
    pool().query<{
      provider: string;
      model: string;
      feature: string;
      success: boolean;
    }>(
      `SELECT provider, model, feature, success
         FROM ai_usage_records
        WHERE "userId" = $1
        ORDER BY "createdAt" ASC`,
      [userId]
    )
  );
  return result.rows;
}
