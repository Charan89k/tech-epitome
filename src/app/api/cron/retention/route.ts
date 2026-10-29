import { NextResponse, type NextRequest } from "next/server";

import { refuseCron } from "@/lib/cron-auth";
import { getEnv } from "@/lib/env";
import { purgeExpiredTranscripts } from "@/services/interview";

/**
 * The transcript retention job. Deletes interview transcripts and code
 * INTERVIEW_TRANSCRIPT_RETENTION_DAYS after the interview ended; the
 * written feedback stays. Same contract as /api/cron/notifications: POST
 * with `Authorization: Bearer $CRON_SECRET`, called by the deployment's
 * scheduler. **If nothing calls it, nothing is deleted**, which is stated
 * in docs/CAREER.md and on the interviews page.
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const refused = refuseCron(request);
  if (refused) return refused;

  const days = getEnv().INTERVIEW_TRANSCRIPT_RETENTION_DAYS;
  const transcriptsDeleted = await purgeExpiredTranscripts(days);
  return NextResponse.json({ retentionDays: days, transcriptsDeleted });
}
