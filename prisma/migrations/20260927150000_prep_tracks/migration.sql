-- Companies become preparation tracks.
--
-- The `companies` tables were built to answer "what does <employer> ask?".
-- CodeForge has no sourced, dated report of any company's questions, and
-- filling the provenance columns with invented citations would have been a
-- fabrication. What it can describe honestly is the SHAPE interview loops
-- come in, so the tables are renamed to what they actually hold.
--
-- Written as RENAMEs rather than DROP/CREATE. The tables are empty today, so
-- a drop would have worked here — but a migration that destroys a table is
-- the wrong habit, and this one replays safely onto a database that has rows.

ALTER TABLE "companies" RENAME TO "prep_tracks";
ALTER TABLE "company_problems" RENAME TO "prep_track_problems";
ALTER TABLE "company_system_design_topics" RENAME TO "prep_track_system_design_topics";

ALTER TABLE "prep_track_problems" RENAME COLUMN "companyId" TO "trackId";
ALTER TABLE "prep_track_system_design_topics" RENAME COLUMN "companyId" TO "trackId";

-- Every recommendation must carry its reason. Backfilled rather than
-- defaulted-then-dropped because the tables are empty; the column is NOT NULL
-- from the start so no row can ever exist without one.
ALTER TABLE "prep_track_problems" ADD COLUMN "rationale" TEXT NOT NULL DEFAULT '';
ALTER TABLE "prep_track_problems" ALTER COLUMN "rationale" DROP DEFAULT;
ALTER TABLE "prep_track_system_design_topics" ADD COLUMN "rationale" TEXT NOT NULL DEFAULT '';
ALTER TABLE "prep_track_system_design_topics" ALTER COLUMN "rationale" DROP DEFAULT;

-- Constraints and indexes carry the old names after a table rename.
ALTER TABLE "prep_tracks" RENAME CONSTRAINT "companies_pkey" TO "prep_tracks_pkey";
ALTER TABLE "prep_track_problems" RENAME CONSTRAINT "company_problems_pkey" TO "prep_track_problems_pkey";
ALTER TABLE "prep_track_system_design_topics" RENAME CONSTRAINT "company_system_design_topics_pkey" TO "prep_track_system_design_topics_pkey";

ALTER TABLE "prep_track_problems" RENAME CONSTRAINT "company_problems_companyId_fkey" TO "prep_track_problems_trackId_fkey";
ALTER TABLE "prep_track_problems" RENAME CONSTRAINT "company_problems_problemId_fkey" TO "prep_track_problems_problemId_fkey";
ALTER TABLE "prep_track_system_design_topics" RENAME CONSTRAINT "company_system_design_topics_companyId_fkey" TO "prep_track_system_design_topics_trackId_fkey";
ALTER TABLE "prep_track_system_design_topics" RENAME CONSTRAINT "company_system_design_topics_systemDesignProblemId_fkey" TO "prep_track_system_design_topics_systemDesignProblemId_fkey";

ALTER INDEX "companies_slug_key" RENAME TO "prep_tracks_slug_key";
ALTER INDEX "companies_status_order_idx" RENAME TO "prep_tracks_status_order_idx";
ALTER INDEX "company_problems_companyId_problemId_key" RENAME TO "prep_track_problems_trackId_problemId_key";
ALTER INDEX "company_problems_problemId_idx" RENAME TO "prep_track_problems_problemId_idx";
ALTER INDEX "company_problems_companyId_reportedAt_idx" RENAME TO "prep_track_problems_trackId_reportedAt_idx";
-- Postgres truncates identifiers at 63 characters, and it truncates the OLD
-- and NEW names at different points, so this one is spelled out rather than
-- left to the obvious substitution.
ALTER INDEX "company_system_design_topics_companyId_systemDesignProblemI_key" RENAME TO "prep_track_system_design_topics_trackId_systemDesignProblem_key";
ALTER INDEX "company_system_design_topics_systemDesignProblemId_idx" RENAME TO "prep_track_system_design_topics_systemDesignProblemId_idx";
