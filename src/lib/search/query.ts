/**
 * Turns user input into a Postgres `tsquery`.
 *
 * Kept separate from the service so it can be tested without a database —
 * it is the part with all the edge cases, and the part where a mistake is a
 * security problem rather than a bad ranking.
 *
 * `websearch_to_tsquery` would handle quoting and operators for us, but it
 * does no prefix matching, and a palette that only matches whole words feels
 * broken while you are still typing. So terms are extracted and each is
 * given a `:*` prefix marker.
 *
 * Input is tokenised to alphanumerics before interpolation, so tsquery
 * operators (`&`, `|`, `!`, `:`, parentheses) and quotes cannot survive the
 * split. That is what makes the interpolation safe.
 */
export function toPrefixQuery(raw: string): string | null {
  const terms = raw
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((term) => term.length > 0)
    // A bound, so a pathological paste cannot build an enormous query.
    .slice(0, 8);

  if (terms.length === 0) return null;
  return terms.map((term) => `${term}:*`).join(" & ");
}
