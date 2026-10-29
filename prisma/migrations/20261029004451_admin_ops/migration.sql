-- AlterTable
ALTER TABLE "email_deliveries" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "retryable" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "institution_invitations" ADD COLUMN     "emailReason" TEXT,
ADD COLUMN     "emailStatus" TEXT;

-- CreateTable
CREATE TABLE "job_runs" (
    "id" TEXT NOT NULL,
    "job" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "summary" JSONB,
    "error" TEXT,

    CONSTRAINT "job_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_runs_job_startedAt_idx" ON "job_runs"("job", "startedAt");

-- Hand-written. One RUNNING row per job: the insert is the lock, so a
-- second scheduler firing at the same moment fails here instead of
-- repeating the work.
CREATE UNIQUE INDEX "job_runs_one_running" ON "job_runs" ("job") WHERE status = 'RUNNING';

-- RLS on with no policies, like every application table.
ALTER TABLE "job_runs" ENABLE ROW LEVEL SECURITY;
