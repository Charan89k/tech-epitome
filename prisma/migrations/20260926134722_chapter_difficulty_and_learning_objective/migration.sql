-- AlterTable
ALTER TABLE "chapters" ADD COLUMN     "difficulty" "Difficulty" NOT NULL DEFAULT 'EASY';

-- AlterTable
ALTER TABLE "problems" ADD COLUMN     "learningObjective" TEXT;
