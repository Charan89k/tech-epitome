"use server";

import { getSearchService, type SearchResult } from "@/lib/search";

/**
 * Search, called from the command palette.
 *
 * A server action rather than a route handler so there is no hand-written
 * API surface to keep in sync. Results are public content only, so this
 * needs no authentication — but it is still rate limited by the palette's
 * own debounce rather than hammering the database on every keystroke.
 */
export async function searchAction(query: string): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  try {
    return await getSearchService().search(trimmed, 18);
  } catch (error) {
    console.error("[search] query failed", error);
    return [];
  }
}
