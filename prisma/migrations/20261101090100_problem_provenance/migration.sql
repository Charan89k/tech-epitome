-- AlterTable
ALTER TABLE "problems" ADD COLUMN     "attribution" TEXT,
ADD COLUMN     "license" TEXT,
ADD COLUMN     "sourceName" TEXT,
ADD COLUMN     "sourceType" "ProblemSourceType" NOT NULL DEFAULT 'ORIGINAL',
ADD COLUMN     "sourceUrl" TEXT;

