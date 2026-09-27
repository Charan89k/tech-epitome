-- Admin audit trail, in-app notifications, and onboarding answers.
--
-- Three additive changes, no drops:
--   * `profiles` gains the onboarding answers and the notification
--     preferences. Every onboarding column is NULLABLE, because onboarding
--     is genuinely skippable — a default would record an answer the learner
--     never gave.
--   * `notifications` is per-user and cascades with the user.
--   * `audit_logs` deliberately has NO foreign key to users. Deleting an
--     admin account must not erase the record of what they did, so the
--     actor's id and email are plain denormalised columns.

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('BEGINNER', 'SOME_EXPERIENCE', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "LearningGoal" AS ENUM ('INTERVIEW_PREP', 'FUNDAMENTALS', 'SYSTEM_DESIGN', 'KEEP_SHARP');

-- CreateEnum
CREATE TYPE "NotificationKind" AS ENUM ('REVIEW_DUE', 'INTERVIEW_GRADED', 'MILESTONE', 'ACCOUNT');

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "experienceLevel" "ExperienceLevel",
ADD COLUMN     "notifyInterviewGraded" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyMilestones" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyReviewDue" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "onboardedAt" TIMESTAMP(3),
ADD COLUMN     "primaryGoal" "LearningGoal",
ADD COLUMN     "targetInterview" "InterviewType",
ADD COLUMN     "weeklyTarget" INTEGER;

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "NotificationKind" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_createdAt_idx" ON "notifications"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_createdAt_idx" ON "audit_logs"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

