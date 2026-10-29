# Institution administration, analytics and operations

Phase 7 extends the existing tenancy ([TENANCY.md](TENANCY.md)) and campus
learning ([CAMPUS.md](CAMPUS.md)) features; it adds no second management
system. Every institution operation resolves the institution from the URL
slug against the signed-in user's membership. No institution id is ever
taken from the client, and every query runs under `te_tenant` row-level
security.

## Authorization

| Action | Student | Faculty | Inst. admin | Platform admin |
| --- | :-: | :-: | :-: | :-: |
| Import a roster (students only for faculty) | | ✓ | ✓ | ✓ |
| Enrol into a class from an import | | own classes | ✓ | ✓ |
| Analytics for classes they teach | | ✓ | ✓ | ✓ |
| Institution-wide enrolment figures | | | ✓ | ✓ |
| Per-class student results export | | own classes | ✓ | ✓ |
| Operations page (jobs, email) | | | | ✓ |

Institution admins never see platform functions: `/admin` is gated by
`requireAdmin` (platform `ADMIN` role) in its layout.

## Roster import

`/campus/<slug>/import` takes a CSV with an `email` column, an optional
`role` column (STUDENT by default) and an optional `class` column.

- **Limits.** At most 200 rows and 100 KB. Any other column, a missing
  `email` header or a broken quote rejects the whole file.
- **Preview.** Each row is classified as *invite*, *add to class*, *skip*
  or *error*, with the reason.
  - **Errors:** an invalid email, a duplicate within the file (the error
    names the first line), an unknown role, a role the importer cannot
    grant, an unknown class or one the importer does not teach, or a
    suspended or revoked member. Reactivating someone is a roster decision,
    not a side effect of a file.
- **Import.** The import re-validates the whole file on the server and never
  trusts the preview.
- **Safe to retry.** Members and people already invited with the same role
  are skipped, so importing the same file twice sends nothing new.
- **Rate limits.** Imports bypass the per-inviter invitation limit but not
  the per-institution limit.
- **Audit.** One `members.imported` audit entry records the counts, in
  addition to an `invitation.created` entry per invitation.
- **Email failures.** An invitation whose email was not delivered is
  recorded (`emailStatus`, `emailReason`) and flagged on the institution
  page. Inviting again resends it with a new link.

## Membership lifecycle

Suspend, reactivate and revoke are unchanged in behaviour. The roster now
spells out the consequences before anyone acts:

- **Suspend** ends access on the member's next request and cancels their
  pending invitations, but keeps class places and grades.
- **Revoke** is final and needs a confirmation step.

An institution always keeps one active admin, and every change is audited.

## Analytics

`/campus/<slug>/analytics`, filtered by date range (at most 2 years; dates
in UTC) and optionally by one class, 10 classes per page.

- **Enrolment** (admins only): members by role and status, and how many
  joined in the date range.
- **Assigned learning:** per assignment, the share of the class's active
  students who have finished it.
- **Assessments due in the range:**
  - **Participation:** students with a submitted attempt, out of active
    students.
  - **Median score:** the median of counted, graded attempts (best or latest,
    per the assessment), with *n* shown beside it.
  - **Awaiting grading:** counted separately, never as zero.

Honesty rules (`src/lib/campus/metrics.ts`):

- Any figure with no denominator shows "—", not 0.
- Scores use the median, never a mean.
- Only students whose institution membership is still active count.

Student-level detail exists only in the class pages and in the per-class
CSV export at `/campus/<slug>/analytics/export?class=…`. The export:

- is only for someone who teaches that class;
- is audited (`analytics.exported`);
- refuses cross-site requests;
- is formula-safe: a cell starting `=`, `+`, `-`, `@` or a control
  character is prefixed with `'`;
- is capped at 5,000 rows.

## Operations

- **Job runs.** `job_runs` records every run of a scheduled job. A partial
  unique index allows one `RUNNING` row per job, so a second scheduler firing
  at the same time gets `409` and does nothing. A run left `RUNNING` for 30
  minutes is marked `STALE` and the next run proceeds. Both cron routes
  (`/api/cron/notifications`, `/api/cron/retention`) run through this.
- **Email retries.** A review reminder rejected with a *retryable* reason (a
  provider 5xx, a timeout) is sent again by a later run, up to 3 sends.
  - The retry claim is a conditional update, so two racing runs cannot both
    send.
  - A send whose outcome is unknown (the process died mid-send) is never
    retried, because the first attempt may have gone out.
- **`/admin/operations`** (platform admins) shows:
  - the latest run of each job;
  - email outcomes by kind over 7 days;
  - invitation email outcomes;
  - sends waiting for a retry and sends with an unknown outcome;
  - recent failures with the provider's status reason.

  It shows counts and statuses only: no addresses, names, message bodies or
  user ids.

## Migration

`20261029004451_admin_ops` is additive and has not been applied to
production. It adds:

- `email_deliveries.attempts` and `email_deliveries.retryable`;
- `institution_invitations.emailStatus` and `emailReason`;
- the `job_runs` table, with its single-running index and RLS on.

## Evidence (local, 2026-10-29)

`src/services/admin-ops.integration.test.ts` (12 tests), against the real
database:

- **CSV and import:** whole-file rejections, every row outcome, the limits
  on faculty roles and classes, import with a failed email recorded,
  rerun-safe, audited.
- **Isolation:** students refused; one institution cannot see another's
  classes.
- **Analytics:** exact participation and median figures, enrolment for
  admins only, null for no data, date-range filtering, and refusals for
  faculty, students and other tenants.
- **Export:** formula injection neutralised, audited, refused to
  non-teachers and other tenants.
- **Operations:** racing job runs execute once, failures are recorded, a
  stale run is taken over, email retries do not duplicate in a race, and a
  non-retryable rejection is not retried.

Also `src/lib/csv.test.ts`, `src/lib/campus/metrics.test.ts` and the
permission matrix in `src/lib/tenancy/permissions.test.ts`.

## Remaining operational gaps

- **No background processing.** Imports send invitations synchronously, up
  to 200 per request, which takes seconds. Exports are built in memory, up
  to 5,000 rows. Larger institutions need a queue.
- **Retries need a scheduler.** Email retries happen only when the cron
  route is called again. Invitation emails are not retried automatically.
- **No alerting.** The operations page shows failures but nothing pages
  anyone, and there is no uptime or error monitoring. Phase 8 covers that.
- **Local races only.** PGlite serialises concurrent requests, so the job and
  email races are guarded by constraints but not exercised under true
  parallelism. Re-run the suite on real PostgreSQL.
- **Analytics are computed per request.** At hundreds of classes, the page
  will need precomputed aggregates.
- **Templates unchanged.** The email templates themselves were not changed
  in this phase.
