-- CreateTable
CREATE TABLE "system_design_submissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "diagram" JSONB NOT NULL DEFAULT '{"nodes":[],"edges":[]}',
    "notes" TEXT NOT NULL DEFAULT '',
    "status" "ProgressStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_design_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "system_design_submissions_userId_updatedAt_idx" ON "system_design_submissions"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "system_design_submissions_userId_problemId_key" ON "system_design_submissions"("userId", "problemId");

-- AddForeignKey
ALTER TABLE "system_design_submissions" ADD CONSTRAINT "system_design_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_design_submissions" ADD CONSTRAINT "system_design_submissions_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "system_design_problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
