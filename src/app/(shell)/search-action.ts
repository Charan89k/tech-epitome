"use server";

import { auth } from "@/lib/auth";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-context";
import { getSearchService, type SearchResult } from "@/lib/search";

/** Longer than any real title search; the tsquery keeps only 8 terms anyway. */
const MAX_QUERY_LENGTH = 200;

/**
 * Search, called from the command palette.
 *
 * A server action rather than a route handler so there is no hand-written
 * API surface to keep in sync. Results are public content only, so this
 * needs no authentication — but a server action is a public POST endpoint,
 * so the length cap and rate limit are enforced here rather than trusted to
 * the palette's debounce. Signed-in learners are keyed by account, so a
 * shared campus IP does not exhaust one budget for everyone.
 */
export async function searchAction(query: unknown): Promise<SearchResult[]> {
  if (typeof query !== "string") return [];
  const trimmed = query.trim();
  if (trimmed.length < 2 || trimmed.length > MAX_QUERY_LENGTH) return [];

  // `auth()` decodes the session cookie without a database round trip.
  const session = await auth();
  const key = session?.user?.id
    ? `search:${session.user.id}`
    : `search:${await getClientIp()}`;
  const limited = await rateLimit(key, RATE_LIMITS.SEARCH);
  if (!limited.success) return [];

  try {
    return await getSearchService().search(trimmed, 18);
  } catch (error) {
    console.error("[search] query failed", error);
    return [];
  }
}
