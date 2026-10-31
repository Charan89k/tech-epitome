export type ContestPhase = "upcoming" | "live" | "ended";

export function contestPhase(
  contest: { startsAt: Date; endsAt: Date },
  now: Date
): ContestPhase {
  if (now < contest.startsAt) return "upcoming";
  return now > contest.endsAt ? "ended" : "live";
}

/** These never reached a verdict about the code, so they cost no penalty. */
const NOT_A_VERDICT = new Set(["QUEUED", "RUNNING", "INTERNAL_ERROR"]);

export type StandingRow = {
  userId: string;
  rank: number;
  score: number;
  solved: number;
  /** Minutes from the start to each solve, plus penalties. Lower wins ties. */
  penalty: number;
};

/**
 * ICPC-style standings: points for each problem solved, ties broken by time
 * to solve plus a penalty per failed attempt before the solve. Failed attempts
 * on a problem never solved cost nothing. Equal entrants share a rank.
 *
 * Expects submissions in chronological order.
 */
export function computeStandings(
  contest: {
    startsAt: Date;
    penaltyMinutes: number;
    problems: readonly { problemId: string; points: number }[];
  },
  entrants: readonly string[],
  submissions: readonly {
    userId: string;
    problemId: string;
    status: string;
    createdAt: Date;
  }[]
): StandingRow[] {
  const points = new Map(contest.problems.map((p) => [p.problemId, p.points]));
  const totals = new Map(
    entrants.map((id) => [id, { score: 0, solved: 0, penalty: 0 }])
  );
  const failures = new Map<string, number>();
  const solved = new Set<string>();

  for (const s of submissions) {
    const total = totals.get(s.userId);
    const worth = points.get(s.problemId);
    const key = `${s.userId}:${s.problemId}`;
    if (!total || worth === undefined || solved.has(key) || NOT_A_VERDICT.has(s.status))
      continue;

    if (s.status !== "ACCEPTED") {
      failures.set(key, (failures.get(key) ?? 0) + 1);
      continue;
    }
    solved.add(key);
    total.score += worth;
    total.solved += 1;
    total.penalty +=
      Math.floor((s.createdAt.getTime() - contest.startsAt.getTime()) / 60_000) +
      (failures.get(key) ?? 0) * contest.penaltyMinutes;
  }

  const rows = [...totals.entries()]
    .map(([userId, t]) => ({ userId, ...t }))
    .sort((a, b) => b.score - a.score || a.penalty - b.penalty);

  let rank = 0;
  return rows.map((row, i) => {
    const previous = rows[i - 1];
    if (!previous || previous.score !== row.score || previous.penalty !== row.penalty) {
      rank = i + 1;
    }
    return { ...row, rank };
  });
}
