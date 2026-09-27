-- Multi-type mock interviews.
--
-- Adds the stages the behavioural, system-design and low-level-design
-- interviewers need, and turns the three brief columns that were already on
-- interview_sessions into real foreign keys. SET NULL on all of them: retiring
-- a brief must never delete somebody's interview history.
--
-- Only ADD VALUE on the enum, never a rename or a drop, so this replays onto a
-- database holding existing DSA sessions without touching them.

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "InterviewStage" ADD VALUE 'QUESTION';
ALTER TYPE "InterviewStage" ADD VALUE 'PROBING';
ALTER TYPE "InterviewStage" ADD VALUE 'ESTIMATION';
ALTER TYPE "InterviewStage" ADD VALUE 'HIGH_LEVEL_DESIGN';
ALTER TYPE "InterviewStage" ADD VALUE 'DEEP_DIVE';
ALTER TYPE "InterviewStage" ADD VALUE 'SCALING';
ALTER TYPE "InterviewStage" ADD VALUE 'DOMAIN_MODEL';
ALTER TYPE "InterviewStage" ADD VALUE 'CLASS_DESIGN';
ALTER TYPE "InterviewStage" ADD VALUE 'SOLID_REVIEW';
ALTER TYPE "InterviewStage" ADD VALUE 'EXTENSIBILITY';
ALTER TYPE "InterviewStage" ADD VALUE 'TRADEOFFS';

-- CreateIndex
CREATE INDEX "behavioral_questions_status_order_idx" ON "behavioral_questions"("status", "order");

-- CreateIndex
CREATE INDEX "interview_sessions_userId_type_startedAt_idx" ON "interview_sessions"("userId", "type", "startedAt");

-- AddForeignKey
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_systemDesignProblemId_fkey" FOREIGN KEY ("systemDesignProblemId") REFERENCES "system_design_problems"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_lldProblemId_fkey" FOREIGN KEY ("lldProblemId") REFERENCES "lld_problems"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_behavioralQuestionId_fkey" FOREIGN KEY ("behavioralQuestionId") REFERENCES "behavioral_questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

