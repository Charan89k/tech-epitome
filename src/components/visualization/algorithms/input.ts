/** Shared parsing for visualizations that take a list of numbers. */
export function parseNumbers(
  raw: string,
  max: number
): { ok: true; value: number[] } | { ok: false; error: string } {
  const values = raw
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number);
  if (values.length === 0 || values.some((v) => !Number.isFinite(v))) {
    return { ok: false, error: "Enter numbers separated by spaces." };
  }
  if (values.length > max) {
    return { ok: false, error: `Keep it to ${max} values so it stays readable.` };
  }
  return { ok: true, value: values };
}

export const formatNumbers = (values: number[]): string => values.join(" ");
