/*
  Warnings:

  - You are about to drop the column `codeQuality` on the `interview_evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `communication` on the `interview_evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `complexityAnalysis` on the `interview_evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `edgeCases` on the `interview_evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `overall` on the `interview_evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `problemSolving` on the `interview_evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `problemUnderstanding` on the `interview_evaluations` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "InterviewStage" AS ENUM ('INTRO', 'CLARIFYING', 'APPROACH', 'SOLVING', 'TESTING', 'COMPLEXITY', 'FOLLOW_UP', 'WRAP_UP', 'ENDED');

-- AlterTable
ALTER TABLE "interview_evaluations" DROP COLUMN "codeQuality",
DROP COLUMN "communication",
DROP COLUMN "complexityAnalysis",
DROP COLUMN "edgeCases",
DROP COLUMN "overall",
DROP COLUMN "problemSolving",
DROP COLUMN "problemUnderstanding",
ADD COLUMN     "dimensions" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "interview_sessions" ADD COLUMN     "stage" "InterviewStage" NOT NULL DEFAULT 'INTRO';
