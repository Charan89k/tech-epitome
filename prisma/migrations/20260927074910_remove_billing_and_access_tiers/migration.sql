-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_userId_fkey";

-- DropIndex
DROP INDEX "chapters_status_access_idx";

-- AlterTable
ALTER TABLE "chapters" DROP COLUMN "access";

-- AlterTable
ALTER TABLE "courses" DROP COLUMN "access";

-- AlterTable
ALTER TABLE "lld_problems" DROP COLUMN "access";

-- AlterTable
ALTER TABLE "patterns" DROP COLUMN "access";

-- AlterTable
ALTER TABLE "problems" DROP COLUMN "access";

-- AlterTable
ALTER TABLE "quizzes" DROP COLUMN "access";

-- AlterTable
ALTER TABLE "system_design_problems" DROP COLUMN "access";

-- DropTable
DROP TABLE "subscriptions";

-- DropEnum
DROP TYPE "AccessTier";

-- DropEnum
DROP TYPE "PlanTier";

-- DropEnum
DROP TYPE "SubscriptionStatus";

-- CreateIndex
CREATE INDEX "chapters_status_idx" ON "chapters"("status");

