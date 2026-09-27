-- Spaced revision scheduler support.
--
-- Written by hand rather than generated, because Prisma cannot detect an
-- enum value rename: it would see FORGOT removed and AGAIN added, and
-- generate a destructive drop-and-recreate of the type. RENAME VALUE
-- preserves any existing rows and the column's type identity.
--
-- Renaming is safe here in a stronger sense too: nothing has ever written a
-- review_items row, so the enum has no values in use anywhere. The rename is
-- about vocabulary, not data - AGAIN/HARD/GOOD/EASY is the grading ladder
-- the UI presents, and having the database say FORGOT/DIFFICULT while the
-- product says AGAIN/HARD is the kind of mismatch that costs an afternoon
-- two years from now.

ALTER TYPE "ReviewGrade" RENAME VALUE 'FORGOT' TO 'AGAIN';
ALTER TYPE "ReviewGrade" RENAME VALUE 'DIFFICULT' TO 'HARD';

-- GOOD sits between HARD and EASY so the enum's natural sort order matches
-- the grading ladder. Safe in a transaction on PostgreSQL 12+ provided the
-- new value is not referenced in the same transaction, which it is not.
ALTER TYPE "ReviewGrade" ADD VALUE 'GOOD' BEFORE 'EASY';

-- Lifecycle state. Derivable from repetitions and intervalDays, but stored
-- so the queue can filter and group on it without recomputing per row.
CREATE TYPE "ReviewStage" AS ENUM ('NEW', 'LEARNING', 'REVIEW', 'MATURE');

ALTER TABLE "review_items"
  ADD COLUMN "stage"        "ReviewStage" NOT NULL DEFAULT 'NEW',
  -- Total AGAIN ratings ever. Never reset: it is the "this one keeps
  -- catching me out" signal the queue orders on.
  ADD COLUMN "lapses"       INTEGER       NOT NULL DEFAULT 0,
  ADD COLUMN "totalReviews" INTEGER       NOT NULL DEFAULT 0;

-- No new index. The queue reads `WHERE userId = ? AND dueAt <= now()
-- ORDER BY dueAt ASC, ...`, which the existing
-- review_items_userId_dueAt_idx already serves; lapses and ease are
-- tiebreakers within a day and sort in memory over a bounded page.
