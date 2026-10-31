-- CreateEnum
CREATE TYPE "CohortRole" AS ENUM ('STUDENT', 'INSTRUCTOR');

-- CreateEnum
CREATE TYPE "CohortAssignmentKind" AS ENUM ('COURSE', 'CHAPTER', 'PROBLEM');

-- CreateEnum
CREATE TYPE "BankQuestionKind" AS ENUM ('CHOICE', 'CODING');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "AttemptFinish" AS ENUM ('SUBMITTED', 'TIME_EXPIRED', 'DEADLINE', 'CLOSED_BY_STAFF');

-- CreateEnum
CREATE TYPE "ScorePolicy" AS ENUM ('BEST', 'LATEST');

-- CreateTable
CREATE TABLE "cohorts" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cohorts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohort_members" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CohortRole" NOT NULL,
    "removedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cohort_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohort_assignments" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "kind" "CohortAssignmentKind" NOT NULL,
    "courseId" TEXT,
    "chapterId" TEXT,
    "problemId" TEXT,
    "title" TEXT NOT NULL,
    "instructions" TEXT,
    "dueAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cohort_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_banks" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_questions" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "kind" "BankQuestionKind" NOT NULL,
    "type" "QuestionType",
    "category" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "code" TEXT,
    "options" JSONB NOT NULL DEFAULT '[]',
    "answer" JSONB,
    "explanation" TEXT,
    "problemId" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "items" JSONB NOT NULL DEFAULT '[]',
    "opensAt" TIMESTAMP(3),
    "closesAt" TIMESTAMP(3) NOT NULL,
    "lateUntil" TIMESTAMP(3),
    "latePenaltyPercent" INTEGER NOT NULL DEFAULT 0,
    "durationMinutes" INTEGER,
    "maxAttempts" INTEGER NOT NULL DEFAULT 1,
    "scorePolicy" "ScorePolicy" NOT NULL DEFAULT 'BEST',
    "showScoreOnSubmit" BOOLEAN NOT NULL DEFAULT false,
    "resultsReleasedAt" TIMESTAMP(3),
    "currentVersionId" TEXT,
    "createdById" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_versions" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "questions" JSONB NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "publishedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_answer_keys" (
    "versionId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "key" JSONB NOT NULL,

    CONSTRAINT "assessment_answer_keys_pkey" PRIMARY KEY ("versionId")
);

-- CreateTable
CREATE TABLE "assessment_attempts" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadlineAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "finish" "AttemptFinish",
    "late" BOOLEAN NOT NULL DEFAULT false,
    "score" DOUBLE PRECISION,
    "maxScore" INTEGER NOT NULL,
    "needsGrading" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "assessment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_answers" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionKey" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "seq" INTEGER NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autoPoints" DOUBLE PRECISION,
    "autoResult" JSONB,
    "points" DOUBLE PRECISION,
    "feedback" TEXT,
    "gradedById" TEXT,
    "gradedAt" TIMESTAMP(3),

    CONSTRAINT "attempt_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cohorts_institutionId_archivedAt_idx" ON "cohorts"("institutionId", "archivedAt");

-- CreateIndex
CREATE INDEX "cohort_members_institutionId_userId_idx" ON "cohort_members"("institutionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "cohort_members_cohortId_userId_key" ON "cohort_members"("cohortId", "userId");

-- CreateIndex
CREATE INDEX "cohort_assignments_cohortId_archivedAt_idx" ON "cohort_assignments"("cohortId", "archivedAt");

-- CreateIndex
CREATE INDEX "question_banks_institutionId_archivedAt_idx" ON "question_banks"("institutionId", "archivedAt");

-- CreateIndex
CREATE INDEX "bank_questions_bankId_archivedAt_idx" ON "bank_questions"("bankId", "archivedAt");

-- CreateIndex
CREATE INDEX "assessments_cohortId_status_idx" ON "assessments"("cohortId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_versions_assessmentId_version_key" ON "assessment_versions"("assessmentId", "version");

-- CreateIndex
CREATE INDEX "assessment_attempts_assessmentId_status_idx" ON "assessment_attempts"("assessmentId", "status");

-- CreateIndex
CREATE INDEX "assessment_attempts_userId_idx" ON "assessment_attempts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_attempts_assessmentId_userId_number_key" ON "assessment_attempts"("assessmentId", "userId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "attempt_answers_attemptId_questionKey_key" ON "attempt_answers"("attemptId", "questionKey");

-- AddForeignKey
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_members" ADD CONSTRAINT "cohort_members_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_members" ADD CONSTRAINT "cohort_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_assignments" ADD CONSTRAINT "cohort_assignments_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_assignments" ADD CONSTRAINT "cohort_assignments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_assignments" ADD CONSTRAINT "cohort_assignments_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_assignments" ADD CONSTRAINT "cohort_assignments_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_banks" ADD CONSTRAINT "question_banks_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_questions" ADD CONSTRAINT "bank_questions_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "question_banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_questions" ADD CONSTRAINT "bank_questions_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_versions" ADD CONSTRAINT "assessment_versions_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_answer_keys" ADD CONSTRAINT "assessment_answer_keys_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "assessment_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "assessment_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "assessment_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ===========================================================================
-- Security (hand-written; everything above is generated and purely additive).
--
-- The rules below are the database half of docs/CAMPUS.md. The services
-- check the same things first; these hold even if a query forgets to.
--   * Students see their own classes, published assessments, their own
--     attempts and answers. Never a classmate's attempt, never an answer key,
--     never a question bank, and never a question paper before they have
--     started an attempt on it (so a scheduled exam's questions stay sealed).
--   * Answers can only be written to your own IN_PROGRESS attempt before its
--     deadline, by the database clock.
--   * Attempts can only be created while the assessment is open, for its
--     current version, within the attempt limit.
--   * Published versions and answer keys are immutable, and a non-draft
--     assessment's question list cannot change.
--   * Only a class's instructors (or the institution's admins) can change
--     scores, points and feedback.
-- te_tenant gets SELECT/INSERT/UPDATE only; removal is a timestamp.
-- ===========================================================================

ALTER TABLE "cohorts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cohort_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cohort_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "question_banks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bank_questions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assessments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assessment_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assessment_answer_keys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assessment_attempts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attempt_answers" ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON
  "cohorts", "cohort_members", "cohort_assignments", "question_banks",
  "bank_questions", "assessments", "assessment_versions",
  "assessment_answer_keys", "assessment_attempts", "attempt_answers"
TO te_tenant;

-- One open attempt per student per assessment.
CREATE UNIQUE INDEX "assessment_attempts_one_open"
  ON "assessment_attempts" ("assessmentId", "userId")
  WHERE status = 'IN_PROGRESS';

-- ---------------------------------------------------------------------------
-- Role checks. SECURITY DEFINER so policies can consult memberships without
-- recursing through their own RLS; each reads only the caller's own rows.
-- ---------------------------------------------------------------------------

-- FACULTY or INSTITUTION_ADMIN, active, in the current institution.
CREATE FUNCTION te_is_staff() RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public, pg_temp
  AS $$
    SELECT te_is_platform_admin() OR EXISTS (
      SELECT 1 FROM "institution_memberships" m
      JOIN "institutions" i ON i.id = m."institutionId"
      WHERE m."institutionId" = te_institution_id()
        AND m."userId" = te_user_id()
        AND m.status = 'ACTIVE' AND i.status = 'ACTIVE'
        AND m.role IN ('FACULTY', 'INSTITUTION_ADMIN')
    )
  $$;

-- May manage this class: an institution admin, or active faculty who is an
-- instructor of it. The class must belong to the current institution.
CREATE FUNCTION te_teaches(p_cohort text) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public, pg_temp
  AS $$
    SELECT EXISTS (
      SELECT 1 FROM "cohorts" c
      WHERE c.id = p_cohort AND c."institutionId" = te_institution_id()
        AND (
          te_is_platform_admin()
          OR EXISTS (
            SELECT 1 FROM "institution_memberships" m
            JOIN "institutions" i ON i.id = m."institutionId"
            WHERE m."institutionId" = c."institutionId"
              AND m."userId" = te_user_id()
              AND m.status = 'ACTIVE' AND i.status = 'ACTIVE'
              AND (
                m.role = 'INSTITUTION_ADMIN'
                OR (m.role = 'FACULTY' AND EXISTS (
                  SELECT 1 FROM "cohort_members" cm
                  WHERE cm."cohortId" = c.id AND cm."userId" = m."userId"
                    AND cm.role = 'INSTRUCTOR' AND cm."removedAt" IS NULL
                ))
              )
          )
        )
    )
  $$;

-- An active member of this class (either role) with an active membership.
CREATE FUNCTION te_in_cohort(p_cohort text) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public, pg_temp
  AS $$
    SELECT EXISTS (
      SELECT 1 FROM "cohort_members" cm
      JOIN "institution_memberships" m
        ON m."institutionId" = cm."institutionId" AND m."userId" = cm."userId"
      WHERE cm."cohortId" = p_cohort
        AND cm."institutionId" = te_institution_id()
        AND cm."userId" = te_user_id()
        AND cm."removedAt" IS NULL
        AND m.status = 'ACTIVE'
    )
  $$;

-- Per student, per assigned item: done / total. Empty unless the caller
-- teaches the class. The only read of personal learning data an institution
-- gets, and only for content the class was assigned.
CREATE FUNCTION te_cohort_progress(p_cohort text)
  RETURNS TABLE (user_id text, assignment_id text, done int, total int)
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public, pg_temp
  AS $$
    SELECT m."userId", a.id,
      CASE a.kind
        WHEN 'PROBLEM' THEN (
          SELECT count(*)::int FROM "user_problem_progress" p
          WHERE p."userId" = m."userId" AND p."problemId" = a."problemId"
            AND p.status = 'SOLVED')
        WHEN 'CHAPTER' THEN (
          SELECT count(*)::int FROM "user_chapter_progress" p
          WHERE p."userId" = m."userId" AND p."chapterId" = a."chapterId"
            AND p.status = 'COMPLETED')
        ELSE (
          SELECT count(*)::int FROM "user_chapter_progress" p
          JOIN "chapters" ch ON ch.id = p."chapterId"
          JOIN "course_sections" s ON s.id = ch."sectionId"
          WHERE p."userId" = m."userId" AND s."courseId" = a."courseId"
            AND ch.status = 'PUBLISHED' AND p.status = 'COMPLETED')
      END,
      CASE a.kind
        WHEN 'COURSE' THEN (
          SELECT count(*)::int FROM "chapters" ch
          JOIN "course_sections" s ON s.id = ch."sectionId"
          WHERE s."courseId" = a."courseId" AND ch.status = 'PUBLISHED')
        ELSE 1
      END
    FROM "cohort_members" m
    JOIN "cohort_assignments" a ON a."cohortId" = m."cohortId"
    WHERE m."cohortId" = p_cohort AND m.role = 'STUDENT'
      AND m."removedAt" IS NULL AND a."archivedAt" IS NULL
      AND te_teaches(p_cohort)
  $$;

REVOKE ALL ON FUNCTION te_is_staff() FROM PUBLIC;
REVOKE ALL ON FUNCTION te_teaches(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION te_in_cohort(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION te_cohort_progress(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION te_is_staff() TO te_tenant;
GRANT EXECUTE ON FUNCTION te_teaches(text) TO te_tenant;
GRANT EXECUTE ON FUNCTION te_in_cohort(text) TO te_tenant;
GRANT EXECUTE ON FUNCTION te_cohort_progress(text) TO te_tenant;

-- ---------------------------------------------------------------------------
-- Policies (te_tenant only).
-- ---------------------------------------------------------------------------

CREATE POLICY tenant_select ON "cohorts" FOR SELECT TO te_tenant
  USING ("institutionId" = te_institution_id() AND (te_is_staff() OR te_in_cohort(id)));
CREATE POLICY tenant_insert ON "cohorts" FOR INSERT TO te_tenant
  WITH CHECK ("institutionId" = te_institution_id() AND te_is_staff());
CREATE POLICY tenant_update ON "cohorts" FOR UPDATE TO te_tenant
  USING ("institutionId" = te_institution_id() AND te_teaches(id))
  WITH CHECK ("institutionId" = te_institution_id() AND te_teaches(id));

CREATE POLICY tenant_select ON "cohort_members" FOR SELECT TO te_tenant
  USING ("institutionId" = te_institution_id()
    AND ("userId" = te_user_id() OR te_teaches("cohortId")));
-- A class's creator may add themself as its first instructor.
CREATE POLICY tenant_insert ON "cohort_members" FOR INSERT TO te_tenant
  WITH CHECK ("institutionId" = te_institution_id() AND (
    te_teaches("cohortId")
    OR (role = 'INSTRUCTOR' AND "userId" = te_user_id() AND te_is_staff()
        AND EXISTS (SELECT 1 FROM "cohorts" c
                    WHERE c.id = "cohortId" AND c."createdById" = te_user_id()))
  ));
CREATE POLICY tenant_update ON "cohort_members" FOR UPDATE TO te_tenant
  USING ("institutionId" = te_institution_id() AND te_teaches("cohortId"))
  WITH CHECK ("institutionId" = te_institution_id() AND te_teaches("cohortId"));

CREATE POLICY tenant_select ON "cohort_assignments" FOR SELECT TO te_tenant
  USING ("institutionId" = te_institution_id()
    AND (te_teaches("cohortId") OR te_in_cohort("cohortId")));
CREATE POLICY tenant_insert ON "cohort_assignments" FOR INSERT TO te_tenant
  WITH CHECK ("institutionId" = te_institution_id() AND te_teaches("cohortId"));
CREATE POLICY tenant_update ON "cohort_assignments" FOR UPDATE TO te_tenant
  USING ("institutionId" = te_institution_id() AND te_teaches("cohortId"))
  WITH CHECK ("institutionId" = te_institution_id() AND te_teaches("cohortId"));

CREATE POLICY tenant_all ON "question_banks" FOR ALL TO te_tenant
  USING ("institutionId" = te_institution_id() AND te_is_staff())
  WITH CHECK ("institutionId" = te_institution_id() AND te_is_staff());
CREATE POLICY tenant_all ON "bank_questions" FOR ALL TO te_tenant
  USING ("institutionId" = te_institution_id() AND te_is_staff())
  WITH CHECK ("institutionId" = te_institution_id() AND te_is_staff());

CREATE POLICY tenant_select ON "assessments" FOR SELECT TO te_tenant
  USING ("institutionId" = te_institution_id() AND (
    te_teaches("cohortId")
    OR (status <> 'DRAFT' AND te_in_cohort("cohortId"))
  ));
CREATE POLICY tenant_insert ON "assessments" FOR INSERT TO te_tenant
  WITH CHECK ("institutionId" = te_institution_id() AND te_teaches("cohortId"));
CREATE POLICY tenant_update ON "assessments" FOR UPDATE TO te_tenant
  USING ("institutionId" = te_institution_id() AND te_teaches("cohortId"))
  WITH CHECK ("institutionId" = te_institution_id() AND te_teaches("cohortId"));

-- A student reads a question paper only through an attempt of their own.
CREATE POLICY tenant_select ON "assessment_versions" FOR SELECT TO te_tenant
  USING ("institutionId" = te_institution_id() AND (
    te_teaches("cohortId")
    OR EXISTS (SELECT 1 FROM "assessment_attempts" t
               WHERE t."versionId" = "assessment_versions".id
                 AND t."userId" = te_user_id())
  ));
CREATE POLICY tenant_insert ON "assessment_versions" FOR INSERT TO te_tenant
  WITH CHECK ("institutionId" = te_institution_id() AND te_teaches("cohortId"));

CREATE POLICY tenant_all ON "assessment_answer_keys" FOR ALL TO te_tenant
  USING ("institutionId" = te_institution_id() AND te_teaches("cohortId"))
  WITH CHECK ("institutionId" = te_institution_id() AND te_teaches("cohortId"));

CREATE POLICY tenant_select ON "assessment_attempts" FOR SELECT TO te_tenant
  USING ("institutionId" = te_institution_id()
    AND ("userId" = te_user_id() OR te_teaches("cohortId")));
-- Only your own, only while open, only the current version, within the limit.
CREATE POLICY tenant_insert ON "assessment_attempts" FOR INSERT TO te_tenant
  WITH CHECK (
    "institutionId" = te_institution_id()
    AND "userId" = te_user_id()
    AND status = 'IN_PROGRESS'
    AND te_in_cohort("cohortId")
    AND EXISTS (
      SELECT 1 FROM "assessments" a
      WHERE a.id = "assessmentId" AND a."cohortId" = "assessment_attempts"."cohortId"
        AND a.status = 'PUBLISHED'
        AND a."currentVersionId" = "assessment_attempts"."versionId"
        AND coalesce(a."opensAt", '-infinity') <= now()
        AND now() < coalesce(a."lateUntil", a."closesAt")
        AND "assessment_attempts".number BETWEEN 1 AND a."maxAttempts"
        AND "assessment_attempts"."deadlineAt" <= coalesce(a."lateUntil", a."closesAt")
    )
  );
CREATE POLICY tenant_update ON "assessment_attempts" FOR UPDATE TO te_tenant
  USING ("institutionId" = te_institution_id()
    AND ("userId" = te_user_id() OR te_teaches("cohortId")))
  WITH CHECK ("institutionId" = te_institution_id()
    AND ("userId" = te_user_id() OR te_teaches("cohortId")));

-- Visible with its attempt. A student writes only to their own open attempt
-- before its deadline, by the database clock.
CREATE POLICY tenant_select ON "attempt_answers" FOR SELECT TO te_tenant
  USING ("institutionId" = te_institution_id()
    AND EXISTS (SELECT 1 FROM "assessment_attempts" t WHERE t.id = "attemptId"));
CREATE POLICY tenant_insert ON "attempt_answers" FOR INSERT TO te_tenant
  WITH CHECK ("institutionId" = te_institution_id() AND EXISTS (
    SELECT 1 FROM "assessment_attempts" t
    WHERE t.id = "attemptId" AND t."userId" = te_user_id()
      AND t.status = 'IN_PROGRESS' AND t."deadlineAt" > now()
  ));
CREATE POLICY tenant_update ON "attempt_answers" FOR UPDATE TO te_tenant
  USING ("institutionId" = te_institution_id() AND EXISTS (
    SELECT 1 FROM "assessment_attempts" t
    WHERE t.id = "attemptId" AND (
      (t."userId" = te_user_id() AND t.status = 'IN_PROGRESS' AND t."deadlineAt" > now())
      OR te_teaches(t."cohortId"))
  ))
  WITH CHECK ("institutionId" = te_institution_id());

-- ---------------------------------------------------------------------------
-- Integrity triggers (bind every role, owner included, unless noted).
-- ---------------------------------------------------------------------------

CREATE FUNCTION te_immutable_row() RETURNS trigger
  LANGUAGE plpgsql
  AS $$
  BEGIN
    RAISE EXCEPTION '% rows are immutable once published', TG_TABLE_NAME;
  END
  $$;

CREATE TRIGGER assessment_versions_immutable
  BEFORE UPDATE OR DELETE ON "assessment_versions"
  FOR EACH ROW EXECUTE FUNCTION te_immutable_row();
CREATE TRIGGER assessment_answer_keys_immutable
  BEFORE UPDATE OR DELETE ON "assessment_answer_keys"
  FOR EACH ROW EXECUTE FUNCTION te_immutable_row();

-- A published paper cannot be swapped or edited in place: the question list
-- and version change only while DRAFT.
CREATE FUNCTION te_assessment_freeze() RETURNS trigger
  LANGUAGE plpgsql
  AS $$
  BEGIN
    IF OLD.status <> 'DRAFT' AND (
      NEW.items IS DISTINCT FROM OLD.items
      OR NEW."currentVersionId" IS DISTINCT FROM OLD."currentVersionId"
    ) THEN
      RAISE EXCEPTION 'assessment % is published; its questions are frozen', OLD.id;
    END IF;
    RETURN NEW;
  END
  $$;

CREATE TRIGGER assessments_freeze
  BEFORE UPDATE ON "assessments"
  FOR EACH ROW EXECUTE FUNCTION te_assessment_freeze();

-- Under te_tenant, only a class's teacher may touch grading columns. The
-- auto-grader runs as the owner (it must read the answer key) and is
-- unaffected.
CREATE FUNCTION te_guard_attempt_grades() RETURNS trigger
  LANGUAGE plpgsql
  AS $$
  BEGIN
    IF current_user = 'te_tenant' AND NOT te_teaches(OLD."cohortId") AND (
      NEW.score IS DISTINCT FROM OLD.score
      OR NEW."maxScore" IS DISTINCT FROM OLD."maxScore"
      OR NEW."needsGrading" IS DISTINCT FROM OLD."needsGrading"
      OR NEW."versionId" IS DISTINCT FROM OLD."versionId"
      OR NEW."deadlineAt" IS DISTINCT FROM OLD."deadlineAt"
      OR NEW."userId" IS DISTINCT FROM OLD."userId"
      OR NEW.number IS DISTINCT FROM OLD.number
      OR (OLD.status = 'SUBMITTED' AND NEW IS DISTINCT FROM OLD)
    ) THEN
      RAISE EXCEPTION 'not allowed to change this attempt';
    END IF;
    RETURN NEW;
  END
  $$;

CREATE TRIGGER assessment_attempts_guard
  BEFORE UPDATE ON "assessment_attempts"
  FOR EACH ROW EXECUTE FUNCTION te_guard_attempt_grades();

CREATE FUNCTION te_guard_answer_grades() RETURNS trigger
  LANGUAGE plpgsql
  AS $$
  BEGIN
    IF current_user = 'te_tenant' AND (
      NEW."autoPoints" IS DISTINCT FROM OLD."autoPoints"
      OR NEW."autoResult" IS DISTINCT FROM OLD."autoResult"
      OR NEW.points IS DISTINCT FROM OLD.points
      OR NEW.feedback IS DISTINCT FROM OLD.feedback
      OR NEW."gradedById" IS DISTINCT FROM OLD."gradedById"
      OR NEW."gradedAt" IS DISTINCT FROM OLD."gradedAt"
    ) AND NOT EXISTS (
      SELECT 1 FROM "assessment_attempts" t
      WHERE t.id = OLD."attemptId" AND te_teaches(t."cohortId")
    ) THEN
      RAISE EXCEPTION 'not allowed to grade this answer';
    END IF;
    IF current_user = 'te_tenant' AND (
      NEW.value IS DISTINCT FROM OLD.value OR NEW.seq IS DISTINCT FROM OLD.seq
    ) AND EXISTS (
      SELECT 1 FROM "assessment_attempts" t
      WHERE t.id = OLD."attemptId" AND t."userId" <> te_user_id()
    ) THEN
      RAISE EXCEPTION 'only the student may change their answer';
    END IF;
    RETURN NEW;
  END
  $$;

CREATE TRIGGER attempt_answers_guard
  BEFORE UPDATE ON "attempt_answers"
  FOR EACH ROW EXECUTE FUNCTION te_guard_answer_grades();

-- Keep the new functions off Supabase's Data API (see 20261028120300).
DO $$
DECLARE
  api_role text;
  fn text;
BEGIN
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
      FOREACH fn IN ARRAY ARRAY[
        'te_is_staff()', 'te_teaches(text)', 'te_in_cohort(text)',
        'te_cohort_progress(text)', 'te_immutable_row()',
        'te_assessment_freeze()', 'te_guard_attempt_grades()',
        'te_guard_answer_grades()'
      ] LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM %I', fn, api_role);
      END LOOP;
    END IF;
  END LOOP;
END $$;
