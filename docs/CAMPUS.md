# Campus learning: classes, assignments, question banks, assessments

Built on the institution tenancy in [TENANCY.md](TENANCY.md): every table
here carries `institutionId`, every query runs inside `withTenantScope` as
the `te_tenant` role, and row-level security confines it. Individual
learning stays free and private; nothing here charges for anything.

## Model

| Table | Purpose |
| --- | --- |
| `cohorts` | A class in one institution. Archived, never deleted |
| `cohort_members` | `STUDENT` or `INSTRUCTOR` in a class. Removal sets `removedAt` |
| `cohort_assignments` | A published course, lesson (chapter) or problem set for a class, with instructions and an optional due date |
| `question_banks`, `bank_questions` | Reusable questions: choice (multiple choice, select all, true/false, code output, complexity; "Aptitude" and the like are categories) and coding (a published problem) |
| `assessments` | Settings and the draft question list |
| `assessment_versions` | The frozen, student-safe paper (no answers). Immutable |
| `assessment_answer_keys` | The answers for one version, in their own table so students cannot read it at all. Immutable |
| `assessment_attempts` | One student's attempt: server start time, deadline, how it finished, late flag, score |
| `attempt_answers` | One answer per question per attempt: value, sequence number, automatic points, staff points, feedback |

Services: `src/services/campus-classes.ts`, `campus-banks.ts`,
`campus-assessments.ts` (staff), `campus-attempts.ts` (students) and
`campus-grading.ts`. Pure rules: `src/lib/campus/rules.ts`.

## Authorization matrix

"Teaches" means an institution admin, or active faculty who is an
instructor of that class. Being faculty in the institution does not let
you see inside a class.

| Action | Student in class | Student not in class | Faculty, not teaching | Teaches the class | Other institution |
| --- | :-: | :-: | :-: | :-: | :-: |
| See that the class exists | ✓ | | ✓ | ✓ | |
| See assignments, due dates and own progress | ✓ | | | ✓ | |
| See the roster and each student's progress on assigned items | | | | ✓ | |
| Create a class | | | ✓ | ✓ | |
| Add or remove members, assign content, archive | | | | ✓ | |
| Read or use question banks | | | ✓ | ✓ | |
| Edit a bank | | | creator only | creator or admin | |
| See a draft assessment | | | | ✓ | |
| See a published assessment's rules | ✓ | | | ✓ | |
| Read the questions | own attempt only | | | ✓ | |
| Read the answer key | own attempt, after release | | | ✓ | |
| Author, publish, close, release, grade | | | | ✓ | |
| Read an attempt | own | | | ✓ | |

Platform admins operate any institution with an institution admin's rights.
A refusal reads as "not found" wherever existence itself would leak
(another institution, a class you are not in, a draft), and as "forbidden"
where the caller can already see that the thing exists (a student opening
the preview).

Source of truth, tested: `src/lib/tenancy/permissions.ts`
(`classes.create`, `banks.manage`), the `te_teaches()`, `te_in_cohort()`
and `te_is_staff()` functions in the migration, and
`src/services/campus.integration.test.ts`.

## Exam integrity

**Versioning.** Publishing copies the questions into an
`assessment_versions` row and the answers into `assessment_answer_keys`.
Both are immutable: a trigger blocks UPDATE and DELETE for every role. Once
an assessment leaves draft, its question list and current version cannot
change (another trigger). Editing a bank question later never reaches a
published exam. Unpublishing works only while no student has started.
After that, the only change allowed is moving the deadline window, which
is audited and applied to attempts already in progress.

**Time.** Every decision uses the server clock, and the database re-checks
with its own `now()`:

- An attempt can be created only while the assessment is open, for its
  current version, within the attempt limit.
- An answer can be written only to your own `IN_PROGRESS` attempt, before
  its `deadlineAt`.

The browser countdown is drawn from the server's time at page load and
decides nothing.

**Deadline per attempt.** `deadlineAt = min(startedAt + time limit,
lateUntil ?? closesAt)`.

**Attempt limits.** `(assessment, student, number)` is unique, and a
partial unique index allows only one `IN_PROGRESS` attempt per student per
assessment. Two simultaneous "Start" clicks get the same attempt.

**Autosave.** Each change is sent with a sequence number that only grows.
The server stores an answer only if its number is higher than the stored
one, so retries, duplicates and out-of-order requests cannot overwrite
newer work. Failed saves retry with backoff. A save from an outdated second
tab is refused, and the page says so.

**Finalisation.** An attempt becomes final, exactly once, when one of
these happens:

- The student submits. Submitting twice returns the same result.
- Its time limit or the deadline passes. This is applied on the next read
  by the student or by staff; the answers saved before the deadline are the
  submission.
- Staff close the assessment. Every open attempt is finalised with what it
  has.

**Disconnection.** Nothing already saved is lost. A student who drops out
gets the answers saved so far, finalised at their deadline. Answers typed
but not yet saved when the connection dropped are not recorded.

**Late work.** Accepted only if the assessment has a late window
(`lateUntil`). An attempt is late if any answer was saved after
`closesAt`; submitting late without changing anything is not late. The late
penalty applies to the attempt's total.

**Scoring.**

- Choice questions are all or nothing. A select-all answer is compared as
  a set, like the platform quizzes.
- Coding answers are run against the problem's hidden tests after
  submission, if code execution is enabled (see [EXECUTION.md](EXECUTION.md)).
  Otherwise they wait for staff, and the attempt shows "needs grading" with
  a provisional score.
- Staff points override automatic points.
- With several attempts, the best or the latest counts, as configured.

**Answer keys.** Students never receive answers before results are
released, and results can be released only after the assessment has
closed. "Show score on submit" reveals the score only.

Auto-grading reads the key as the database owner, because no role a
student acts under can read it. It is reachable only from server code,
after the tenant transaction has authorised the attempt.

**What this does not do.** It does not detect or prevent cheating. There is
no proctoring, no lockdown browser and no plagiarism check, and nothing
stops a student from using another device or another person. The system
enforces timing, attempts, answer secrecy and who sees what. Treat
unsupervised results accordingly.

## Audit

Each of these is written to `institution_audit_logs` (append-only) in the
same transaction as the change:

- Classes: create, archive, member add and remove, assign and unassign.
- Banks: create.
- Assessments: create, publish (with version and maximum score), unpublish,
  deadline change (old and new), close (with the number of attempts
  finalised), archive and results release.
- Grades: every change, with the question, old and new points, old and new
  score, and whether feedback changed.

Bank question edits are not audited; they cannot affect a published exam.

## Migration (forward-only, additive)

`20261028230149_campus_learning`:

- Creates seven enums and ten tables. No existing table or row changes.
- Enables RLS on all ten and grants `te_tenant` SELECT, INSERT and UPDATE
  (no DELETE).
- Adds the role-check and progress functions, the policies above, the
  immutability, freeze and grade-guard triggers, and the Supabase Data API
  revocations.

Rehearse it on a Supabase branch exactly as described in
[TENANCY.md](TENANCY.md) before production. It has not been applied to
production.

## Evidence (local, 2026-10-29)

- `src/services/campus.integration.test.ts`: 20 tests against the real
  database and its policies. They cover the lifecycle, the freeze, the
  sealed paper before opening, concurrent starts and submits, autosave
  ordering, timeouts, the late window and penalty, grading audit, release,
  cross-tenant and cross-student denial, and direct `te_tenant` writes
  being refused.
- `src/lib/campus/rules.test.ts`: the timing and scoring rules.
- `e2e/campus-learning.spec.ts`: the faculty-to-student lifecycle in the
  browser, on desktop and mobile, including a reload mid-exam and the
  refusals.

## Known limits

- Local tests run on PGlite, which has one backend session, so concurrent
  requests are serialised. The races are guarded by the unique indexes and
  row locks but are not exercised under true parallelism. Re-run the
  integration suite on a real PostgreSQL branch.
- Code does not run during an exam; there is no "Run samples" button.
- Coding answers are graded against the problem's tests as they are at
  grading time; the tests are not frozen with the version.
- An automatic grade in progress cannot be cancelled, and there is no
  regrade button (staff override each answer instead).
- No question shuffling, per-student extensions or accommodations.
- Assigned-content progress is read through a definer function that sees
  only assigned items, for students of a class the caller teaches. Nothing
  else of a student's learning is visible to the institution.
