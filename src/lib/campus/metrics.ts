/**
 * Metric arithmetic for institution analytics. Missing data is null, never
 * zero: "no students yet" and "no student finished" are different facts and
 * the page must be able to tell them apart. Medians, not means, for scores,
 * so one outlier does not move the headline figure.
 */

/** numerator / denominator as 0-100, or null when there is nothing to divide by. */
export function rate(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const value =
    sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
  return Math.round(value * 10) / 10;
}

/** "—" for missing data, so it never reads as a zero. */
export function show(value: number | null, suffix = ""): string {
  return value === null ? "—" : `${value}${suffix}`;
}
