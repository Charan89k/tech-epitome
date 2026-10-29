-- AlterTable
ALTER TABLE "interview_sessions" ADD COLUMN     "transcriptDeletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "share_links" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "share_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "share_links_tokenHash_key" ON "share_links"("tokenHash");

-- CreateIndex
CREATE INDEX "share_links_userId_idx" ON "share_links"("userId");

-- AddForeignKey
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Hand-written: RLS on with no policies, like every application table
-- (see 20261008150000_lock_down_data_api). The app reaches this table as
-- the owner; Supabase's Data API roles get nothing.
ALTER TABLE "share_links" ENABLE ROW LEVEL SECURITY;
