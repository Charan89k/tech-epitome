import {
  dimensionsFor,
  type EvaluationDimension,
  type InterviewKind,
  type RatingBand,
} from "@/lib/interview/types";

/**
 * Strengths and improvement areas across a learner's interviews, computed
 * only from feedback they actually received. No composite score: each
 * dimension keeps its own history, and a dimension the interviews never
 * reached is reported as "not yet shown", not as a weakness.
 */

export type EvaluationRecord = {
  type: InterviewKind;
  at: Date;
  dimensions: { dimension: string; band: string }[];
};

export type DimensionHistory = {
  dimension: EvaluationDimension;
  type: InterviewKind;
  /** Oldest first. not_demonstrated included, so the history is honest. */
  bands: RatingBand[];
  latest: RatingBand;
  /** Sessions where it was actually assessed (not not_demonstrated). */
  shown: number;
};

export type CareerSummary = {
  sessions: number;
  byType: Record<InterviewKind, number>;
  strengths: DimensionHistory[];
  improvements: DimensionHistory[];
  notYetShown: DimensionHistory[];
};

const BANDS: RatingBand[] = ["not_demonstrated", "developing", "solid", "strong"];

export function summarizeEvaluations(records: EvaluationRecord[]): CareerSummary {
  const byType: Record<InterviewKind, number> = {
    DSA: 0,
    BEHAVIORAL: 0,
    SYSTEM_DESIGN: 0,
    LLD: 0,
  };
  const history = new Map<string, DimensionHistory>();

  for (const record of [...records].sort((a, b) => a.at.getTime() - b.at.getTime())) {
    byType[record.type] += 1;
    const allowed = dimensionsFor(record.type);
    for (const d of record.dimensions) {
      const dimension = d.dimension as EvaluationDimension;
      const band = d.band as RatingBand;
      // Stored feedback is validated, but old rows predate the rubric check.
      if (!allowed.includes(dimension) || !BANDS.includes(band)) continue;
      const key = `${record.type}:${dimension}`;
      const entry = history.get(key) ?? {
        dimension,
        type: record.type,
        bands: [],
        latest: band,
        shown: 0,
      };
      entry.bands.push(band);
      entry.latest = band;
      if (band !== "not_demonstrated") entry.shown += 1;
      history.set(key, entry);
    }
  }

  const all = [...history.values()];
  return {
    sessions: records.length,
    byType,
    strengths: all.filter((h) => h.latest === "solid" || h.latest === "strong"),
    improvements: all.filter((h) => h.latest === "developing"),
    notYetShown: all.filter((h) => h.shown === 0),
  };
}
