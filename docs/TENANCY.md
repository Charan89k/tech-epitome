# Institution tenancy

A college is a workspace a user joins. The user, their account and their own
learning stay global and private; a membership adds a college role and
nothing else. A user can be an individual learner and a member of any number
of colleges at once.

## Model

| Table | Purpose |
| --- | --- |
| `users.status`, `suspendedAt`, `sessionVersion` | Platform suspension; `sessionVersion` is stamped into the JWT and bumped to revoke every session |
| `institutions` | The college (`ACTIVE` / `SUSPENDED`) |
| `institution_domains` | Email domains; count only after a DNS TXT check sets `verifiedAt` |
| `institution_memberships` | `(institution, user)` → role `STUDENT` / `FACULTY` / `INSTITUTION_ADMIN`, status `ACTIVE` / `SUSPENDED` / `REVOKED`, source |
| `institution_invitations` | Single-use, 7-day, SHA-256-hashed token bound to one email address |
| `institution_audit_logs` | Append-only (trigger blocks UPDATE/DELETE for every role) |

Platform admin is the existing `users.role = ADMIN`.

## Authorization matrix

| Action | Student | Faculty | Inst. admin | Platform admin |
| --- | :-: | :-: | :-: | :-: |
| View the institution and own membership | ✓ | ✓ | ✓ | ✓ |
| List the roster | | ✓ | ✓ | ✓ |
| Invite students | | ✓ | ✓ | ✓ |
| Invite faculty / institution admins | | | ✓ | ✓ |
| Change roles, suspend, reactivate, revoke | | | ✓ | ✓ |
| Export the roster (CSV, audited) | | | ✓ | ✓ |
| Read the institution audit log | | | ✓ | ✓ |
| Create / suspend institutions, add and verify domains | | | | ✓ |
| Suspend accounts platform-wide | | | | ✓ |
| Read anyone's notes, submissions, tutor or interview data | | | | |

Source of truth: `src/lib/tenancy/permissions.ts` (tested cell by cell).
Rules that are not in the table: nobody changes their own membership; an
institution always keeps one active admin; `REVOKED` is terminal except via a
new invitation, and only someone who may manage members can send that one;
an invitation never changes an active member's role and never lifts a
suspension (reactivate instead); faculty cannot cancel a pending invitation
for a role they could not grant; suspending or revoking a member cancels
their pending invitations; email-domain enrolment only ever creates `STUDENT`
and never reactivates a suspended or revoked membership. The last-admin
check locks the admin rows (`FOR UPDATE`) so concurrent demotions cannot
race past it.

## Enforcement, three layers

1. **Session.** `getCurrentUser` rejects a suspended account or a token whose
   `sessionVersion` is stale, on every request. `requireMember*` re-reads the
   membership on every request, so a revoked or suspended membership stops
   working immediately.
2. **Service.** Every function takes a context built from the session and
   re-asserts its permission. Client ids are looked up *within* the
   institution, so another college's id reads as "not found".
3. **Database.** Tenant work runs in `withTenantScope`: one transaction,
   `SET LOCAL ROLE te_tenant`, tenant stamped with transaction-local
   `set_config`. `te_tenant` is NOLOGIN, not a superuser, no BYPASSRLS, owns
   nothing, has no DELETE, sees four `users` columns and has no grant on any
   personal-learning table. RLS policies confine it to the current
   institution. Both settings end with the transaction, so a pooled
   connection (Supabase transaction pooler included) cannot leak tenant scope.

## Migrations (forward-only, additive)

| Migration | Does | Risk |
| --- | --- | --- |
| `20261028120000_institution_tenancy` | Enums, three `users` columns with defaults, five new tables, RLS on | None for existing rows: every user becomes `ACTIVE` / version `0`, which every existing JWT already matches, so nobody is signed out |
| `20261028120100_tenant_rls_role` | Creates `te_tenant`, grants, policies, definer lookups, audit trigger | `GRANT te_tenant TO CURRENT_USER` must succeed for the pooled login role |
| `20261028120200_tenant_role_dev_capture` | Grants for `prisma dev`'s capture schema | No-op on any database without `_prisma_dev_wal` |
| `20261028120300_tenant_functions_api_lockdown` | Revokes the new functions from Supabase `anon` / `authenticated` | No-op where those roles do not exist |

## Production rollout (needs approval; not done)

1. Back up the database.
2. Create a Supabase **branch** and run `prisma migrate deploy` there with the
   session-pooler `DIRECT_URL` plus `?connect_timeout=30`.
3. On the branch, check that `SELECT current_user` through the **transaction
   pooler** can `SET ROLE te_tenant` (that's the step most likely to differ
   from local Postgres), then run
   `DATABASE_URL=<branch> npx vitest run src/lib/tenancy src/services/institutions.integration.test.ts`.
4. Apply to production, deploy the app, and smoke-test `/campus` and
   `/admin/institutions`.

## Rollback and forward recovery

- **App rollback:** redeploy the previous build. It ignores the new tables and
  columns, so it keeps working against the migrated schema. Users suspended
  meanwhile would regain access under the old build. Re-suspend them after
  rolling forward.
- **Migration failure mid-deploy:** each migration runs in its own
  transaction; fix and re-run `migrate deploy`. If 120100 fails on the role
  grant, the tables from 120000 are harmless and unused until it succeeds.
- **Never** drop the new tables to roll back. The audit log is append-only by
  design, and institutions with audit rows cannot be deleted (FK `RESTRICT`).
- To disable tenancy without a schema change, suspend the institutions from
  `/admin/institutions`. Members lose access; individual learning is
  untouched.

## Known limits

- The application still connects as the table owner; RLS binds only inside
  `withTenantScope`. Moving the whole app to a least-privilege login role is
  a separate cut-over.
- `app.platform_admin` is a session setting the server sets after checking
  `users.role`. RLS stops query mistakes, not SQL injection, and Prisma
  parameterises everything.
- Locally, PGlite serves one backend session, so run tenancy e2e with
  `--workers=1`.
