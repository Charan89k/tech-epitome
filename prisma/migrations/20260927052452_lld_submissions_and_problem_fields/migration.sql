-- AlterTable
ALTER TABLE "lld_problems" ADD COLUMN     "constraints" TEXT[],
ADD COLUMN     "hints" TEXT[],
ADD COLUMN     "objectives" TEXT[],
ADD COLUMN     "principles" TEXT[];

-- CreateTable
CREATE TABLE "lld_submissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "classDiagram" JSONB NOT NULL DEFAULT '{"types":[],"relationships":[]}',
    "code" TEXT NOT NULL DEFAULT '',
    "language" "Language" NOT NULL DEFAULT 'JAVA',
    "rationale" TEXT NOT NULL DEFAULT '',
    "hintsRevealed" INTEGER NOT NULL DEFAULT 0,
    "status" "ProgressStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lld_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lld_submissions_userId_updatedAt_idx" ON "lld_submissions"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "lld_submissions_userId_problemId_key" ON "lld_submissions"("userId", "problemId");

-- AddForeignKey
ALTER TABLE "lld_submissions" ADD CONSTRAINT "lld_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lld_submissions" ADD CONSTRAINT "lld_submissions_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "lld_problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
