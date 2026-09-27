# CodeForge

**Master Algorithms. Build Better Systems.**

An interactive platform for learning data structures and algorithms, coding
patterns, system design, and software engineering interviews.

CodeForge is built around one idea: interviews test whether you can look at an
unfamiliar problem and recognise its shape. So the product teaches recognition
first and code second, and it measures progress from what you actually did —
attempts, hints opened, recall quality — never from a guess.

```
See → Understand → Recognise → Attempt → Struggle → Hint
                                                      ↓
        Recall ← Review ← Explain ← Solve ←───────────┘
```

---

## Status

| Phase | Scope | State |
|---|---|---|
| 1 | Foundation: app shell, design system, database, authentication, authorization | **Complete, verified** |
| 2 | DSA curriculum, patterns, problem catalogue, progress, search | **Complete, verified** |
| 3 | Monaco editor, code execution, test harness, submissions | **Complete, verified** |
| 4 | Visualization engine + six algorithms | **Complete, verified** |
| 5 | Quiz engine and spaced revision | **Complete, verified** |
| 6 | AI tutor: Socratic tutoring in chapter, problem and code context | **Complete, verified** |
| 7 | System Design: curriculum, diagram engine, design workspace, AI review | **Complete, verified** |
| 8 | Low-Level Design: curriculum, class-diagram engine, design workspace, AI review | **Complete, verified** |
| 9 | Mock interviews: DSA interviewer, server-owned state machine, banded feedback | **Partial** — see below |
| 10 | Admin, billing, production hardening | Not started |

**Phase 9 is partial and the table says so.** What is implemented and
verified: DSA mock interviews end to end — session creation, an AI
interviewer whose stage machine lives on the server, transcript
persistence, and written feedback with per-dimension bands and evidence
from the transcript. What is **not** implemented: behavioural
interviews, company preparation, and the System Design / LLD interview
types. Those models exist in the schema from Phase 1 and carry no
implementation; the UI does not offer them and the service refuses to
create them rather than opening a session that cannot be conducted.

Navigation only ever lists routes that exist. A section absent from the
sidebar has not shipped yet — there are no "coming soon" buttons.

### What exists today

A learner can create an account, work through a 29-chapter DSA curriculum,
take a quiz at the end of a chapter, mark it complete, open a linked problem,
open hints one at a time, write code in four languages, run it against the
sample tests, submit against the full suite, and watch progress and pattern
mastery update on the dashboard. Completing a chapter or solving a problem
then schedules it for spaced revision, and `/review` brings it back the day
after — recall first, answer second, graded on a four-point ladder that sets
the next interval. That entire loop is covered end to end by browser tests.

On Pro, an AI tutor sits alongside all of that. It reads the chapter being
studied or the problem being solved — including the code in the editor and
the last failing test — and works the learner towards the answer rather than
supplying it: a hint ladder that climbs one rung per ask, from a conceptual
nudge to a full walkthrough, and only reaches the walkthrough after the
learner has been through the three rungs before it.

Phase 7 adds a second track. System Design is the same reader — `Track` has
had `SYSTEM_DESIGN` since Phase 1, so `/learn/dsa/*` became `/learn/[track]/*`
with every existing URL preserved — plus two things that are new: diagrams
stored as nodes and edges rather than images, and a workspace where the
learner draws their own architecture, writes down what they traded away, and
submits it. **The reference architecture is withheld by the service until
they do**, so an exercise cannot be read as a worked example. The AI reviewer
gets their design as prose and never gets the reference.

Phase 8 adds a third track through the same reader. Low-Level Design
teaches responsibility assignment, SOLID and the patterns worth knowing —
each with the situation where it is the wrong choice — and its exercises
use a class-diagram engine built on the Phase 7 pattern: types and
relationships as data, deterministic layout, prose description doubling
as screen-reader text and AI context. Structural diagnostics
(duplicate names, inheritance cycles, unimplemented interfaces,
dependencies on a concrete class where an abstraction exists) are
observations, never a score. **The reference design, the reference
implementation and every unopened hint are withheld by the service**
until the learner submits.

Seeded content, all original: **3 courses, 22 sections, 53 chapters, 20
patterns, 50 problems** (377 test cases, 200 hints, 56 solutions), **15
quizzes**, **6 interactive visualizations**, **3 system-design
exercises** and **3 LLD exercises**.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router, Turbopack) | Server Components keep data fetching on the server; Server Actions remove a hand-written API layer for mutations |
| Language | TypeScript 5, strict | — |
| UI | Tailwind CSS v4, shadcn/ui (Radix), Lucide | Tokens in CSS, components owned in-repo rather than versioned as a dependency |
| Database | PostgreSQL 18, Prisma 7 | Relational data with real foreign keys; Postgres full-text search avoids a second datastore early on |
| Auth | Auth.js v5 + Prisma adapter | Self-hosted, no vendor account required; argon2id password hashing |
| AI | Provider registry (Ollama, Anthropic) | Switchable per deployment and per request |
| Tests | Vitest, Testing Library, Playwright | — |

**Prisma is pinned to 7.10.0.** The `latest` npm tag currently points at an
8.0.0 release candidate; installing it unpinned produces an RC CLI against a
stable client and pulls in a large, vulnerable dev-tooling tree.

---

## Getting started

Requires **Node 20.9+** and a PostgreSQL database.

```bash
git clone <your-remote> codeforge && cd codeforge
npm install
cp .env.example .env
npx auth secret            # writes AUTH_SECRET into .env
docker compose up -d       # PostgreSQL 18 on :5432
npm run db:migrate
npm run db:seed
npm run dev
```

Open <http://localhost:3000>.

Seeded accounts (change these before any deploy — they are set in `.env`):

| Account | Email | Password | Role |
|---|---|---|---|
| Admin | `admin@codeforge.local` | `forge-admin-dev` | ADMIN, Pro |
| Demo | `demo@codeforge.local` | `forge-demo-dev` | USER, Free |

### Without Docker

Prisma ships a local Postgres for development:

```bash
npx prisma dev --name codeforge     # prints a DATABASE_URL
```

Put that URL in `.env` and set `DATABASE_POOL_MAX=1` — see
[Known limitations](#known-limitations).

---

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build (runs `prisma generate` first) |
| `npm run verify` | typecheck + lint + unit tests |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest, once |
| `npm run test:watch` | Vitest, watch |
| `npm run test:e2e` | Playwright (starts its own server on :3100) |
| `npm run db:up` / `db:down` | Start / stop the Postgres container |
| `npm run db:migrate` | Create and apply a migration |
| `npm run db:deploy` | Apply migrations without generating (production) |
| `npm run db:seed` | Seed; idempotent |
| `npm run db:studio` | Prisma Studio |
| `npm run setup` | db:up + generate + migrate + seed |

---

## Architecture

```
src/
├── app/
│   ├── (marketing)/     public pages: landing, pricing
│   ├── (auth)/          login, signup
│   ├── (shell)/         the sidebar application shell
│   └── api/
├── components/
│   ├── ui/              shadcn primitives (owned, editable)
│   ├── brand/ layout/ common/
│   ├── learning/        content block renderers
│   ├── tutor/           AI tutor panel, launcher, markdown
│   ├── problems/ dashboard/ settings/ auth/ marketing/
├── lib/
│   ├── ai/              provider adapters: ollama, anthropic, mock
│   ├── tutor/           request types, Socratic policy, context builder
│   └── …                env, db, auth, billing, rate-limit, validation
├── services/            data access, one module per domain
├── types/               shared domain types
└── data/                seed content
```

**Pages never query Prisma directly.** They call a service in `src/services/`,
which owns the query, the `status: PUBLISHED` filter and the progress join.
This is what stops a forgotten `where` clause from leaking draft content.

### Authorization

One function decides everything:

```ts
canAccess(user, FEATURES.AI_TUTOR)   // → boolean
```

Components never test `user.plan === "PRO_MONTHLY"`. Subscription state is
read from the database per request, never from the JWT — a token minted
before an upgrade or a cancellation would otherwise be wrong for up to 30
days.

There are three layers, and only the last two are security:

1. `proxy.ts` — optimistic cookie check, to avoid a wasted render. **Not a
   boundary.**
2. `requireUser` / `requireAdmin` in the page or server action.
3. The service layer's own filters.

### Content

Chapter bodies and problem statements are stored as an ordered array of typed
blocks, not markdown, because lessons embed live components — a stepped
visualization, an inline quiz, a complexity table the search indexer can read.
Blocks are validated by Zod (`src/lib/validation/content.ts`) on every write.
A malformed row degrades that one chapter rather than breaking the page.

### Code execution

Problems declare a signature once:

```ts
{ params: ["int[]", "int"], paramNames: ["nums", "k"], returns: "int" }
```

From that, `src/lib/code-execution/signature.ts` derives both the starter stub
the learner sees and the harness that feeds it stdin, for every language. 50
problems x 4 languages is 200 harnesses, and hand-writing 200 near-identical
stdin parsers is exactly the kind of repetition that rots. There is one reader
per (type, language) pair and a signature composes them. Harnesses are
regenerated at execution time rather than stored, so fixing a reader bug fixes
every problem at once.

Execution goes through the `CodeExecutionService` interface. Two adapters:

| Adapter | Isolation | Use |
|---|---|---|
| `local` | CPU time, address space, output size, wall clock. **No network or filesystem isolation.** | Development only; refuses to start in production |
| `docker` | `--network=none`, read-only rootfs, cgroup memory cap, pids limit, all capabilities dropped, runs as nobody | Anything untrusted |

The factory will not silently substitute one for the other. If `docker` is
configured and the daemon is unreachable, production fails loudly rather than
falling back to running submitted code as the server user.

### Spaced revision

The scheduler (`src/lib/review/scheduler.ts`) is a pure function of
`(state, grade, timestamps) -> next state`: no database, no clock of its
own, no randomness. It decides when a learner sees something again, which
makes it the most worthwhile thing in the product to test exhaustively — 35
unit tests pin down every transition.

```
NEW --GOOD/EASY--> REVIEW --interval >= 21d--> MATURE
 |                    |                          |
 +---AGAIN/HARD--> LEARNING <-------AGAIN--------+
```

| Grade | Ease | From LEARNING | From REVIEW |
|---|---|---|---|
| AGAIN | −20 | 1 day, lapse recorded, requeued this session | back to 1 day, repetitions reset |
| HARD | −15 | 1 day, does not graduate | interval × 1.2 |
| GOOD | — | graduates to 2 days | interval × ease, plus half the overdue days |
| EASY | +15 | graduates to 4 days | interval × ease × 1.3, plus all overdue days |

Ease is an integer ×100 clamped to [130, 350]; intervals are clamped to
[1, 365] days. So no grade can produce a zero-length interval, and no run of
EASY ratings can push an item past the point of being useful.

Intervals are whole days and `dueAt` is always midnight UTC, matching the
convention `StudyDay` and streaks already use. Sub-day learning steps would
have meant changing the unit on `intervalDays`, and a second interval column
— or a dead one — is worse than the alternative: re-drilling a forgotten
card *now* is the session's job, not the schedule's.

Review items are created by the learning loop, never in bulk. Completing a
chapter that states key takeaways schedules the concept; solving a problem
schedules both the problem and the pattern behind it, with a starting ease
derived from how many hints it took. Creation is an upsert whose update
branch is empty, so revisiting content can never reset a schedule, and the
existing `@@unique([userId, entityType, entityId])` makes duplicates
impossible rather than merely unlikely.

Prompts are derived from content that already exists — a pattern's
recognition clues, a chapter's key takeaways, a problem's learning
objective. No second bank of review questions is authored or stored, because
two copies of the same idea drift apart the first time an author edits one.

### AI tutor

```
UI  →  /api/tutor/stream  →  requireUser + canAccess(AI_TUTOR)
                          →  rateLimit(AI_MESSAGE)
                          →  context builder   (bounded, per surface)
                          →  Socratic policy   (system prompt + rung)
                          →  AIProvider.stream (ollama | anthropic | mock)
                          →  persist turn + record usage
```

Three deliberate choices.

**It is a route handler, not a Server Action.** Server Actions resolve to a
value; a tutor that returns its whole answer at once after eight seconds is
a tutor nobody waits for. Server-sent events put the first sentence on
screen in well under a second, and closing the panel aborts the request,
which aborts the upstream call — so cancelling actually stops the spend.

**Requests are typed, not free text.** `src/lib/tutor/types.ts` defines nine
request types (`HINT`, `DEBUG_CODE`, `ANALYZE_COMPLEXITY`, …). A quick-action
button sends `{ type: "HINT" }`, not a sentence that happens to contain the
word hint, so the server decides what context to gather and what instruction
to attach.

**The hint ladder is server state.** Escalation lives in
`src/lib/tutor/policy.ts` as a pure function and the rung is persisted on
each message, so reloading a thread does not restart at hint 1 and
double-clicking does not spend two rungs. Only a `HINT` advances it —
debugging out loud for five turns must not silently exhaust it.

| Rung | Gives | Code |
|---|---|---|
| 1 | Conceptual nudge; no technique named | none |
| 2 | Names the family of technique | none |
| 3 | The shape: what you maintain, what invariant holds | ≤3 lines of pseudocode |
| 4 | Full walkthrough with complexity and the recognition cue | yes |

Rung 4 is reachable only after the three before it, or when the learner
explicitly asks to be told — refusing someone who has genuinely given up is
stonewalling, not teaching, but it takes those words rather than a
frustrated tone.

Context is assembled by `src/lib/tutor/context.ts`, which is pure: it
receives already-fetched data and returns a message array, so "does a
problem turn actually include the failing test?" and "is history really
bounded?" are unit tests rather than things you find out from a bill.
Budgets are explicit (6k chars of chapter body, 2.5k of statement, 4k of
code, 8 turns of history) because the version that sends everything works
perfectly in development and is unaffordable in production.

Problem statements, chapter bodies and learner code are fenced in labelled
delimiters, with any delimiter inside the payload neutralised so content
cannot close its own fence and escape into instruction position. That is a
mitigation, not a guarantee — the real control is that the tutor has no
tools, no database access of its own, and nothing in its context worth
extracting. **Only the hints a learner has already unlocked are loaded**, so
the model cannot hand back hint 4 on the first ask.

### Visualizations

Each visualization is a pure function from an input to a list of frames, plus
a renderer for one frame. Frames come from *actually running the algorithm*
and recording a snapshot per step — nothing is choreographed. That makes them
testable, and they are tested: the suite checks each trace against an
independently computed answer, so a visualization that merely looks plausible
fails. That check caught a real queue-mutation bug in the BFS trace.

### Database notes

- The `Chapter` **is** the lesson. Routes stop at `/[course]/[section]/[chapter]`,
  so a separate `Lesson` table below it would add a level the product never
  navigates.
- `Course` is track-scoped (`DSA | SYSTEM_DESIGN | LLD | BEHAVIORAL`), so the
  same curriculum, progress and review machinery serves every track.
- `Bookmark`, `Note`, `Highlight` and `ReviewItem` are polymorphic over
  `(entityType, entityId)` — the alternative is eight nullable foreign keys per
  table. Integrity for these is enforced in the service layer, not the database.
- Progress counters are denormalised onto `Profile` and `StudyDay`. Deriving
  them from raw events is correct but too slow for a dashboard.
- Full-text search uses Postgres `tsvector` columns kept current by triggers
  (`prisma/migrations/*_search_triggers`), weighted A/B/C so a title match
  outranks a body match.

---

## Environment

Every variable is validated at boot by `src/lib/env.ts`; a missing or
malformed required value fails immediately with a readable message instead of
surfacing as a null dereference mid-request. See `.env.example` for the full
list.

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `AUTH_SECRET` | yes | 32+ chars; `npx auth secret` |
| `NEXT_PUBLIC_APP_URL` | yes | Public origin |
| `AUTH_GOOGLE_ID` / `_SECRET` | no | Both blank hides the Google button |
| `AI_PROVIDER` | no | `ollama` (default), `anthropic`, or `mock` (tests only; rejected in production) |
| `AI_API_KEY` | conditional | Required when `AI_PROVIDER=anthropic` |
| `CODE_EXECUTION_DRIVER` | no | `local` \| `docker` \| `remote` |
| `STRIPE_*` | no | Blank disables checkout; the pricing page says so |
| `DATABASE_POOL_MAX` | no | Defaults to 10 |

---

## Security

- **Passwords** — argon2id, OWASP 2024 parameters (19 MiB, t=2, p=1).
- **Account enumeration** — sign-in hashes a dummy value when the account does
  not exist, so a missing user and a wrong password take the same time and
  return the same message.
- **Open redirects** — `?next=` is accepted only as a same-origin absolute
  path.
- **Rate limiting** — named policies in `src/lib/rate-limit.ts`. The
  test-only bypass is ANDed against `NODE_ENV !== "production"`, so setting
  the flag on a production deploy does nothing.
- **Headers** — HSTS, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy,
  Permissions-Policy on every response.
- **CSP** — per-request nonce with `strict-dynamic`, set on both the request
  and response headers (Next reads the request header to stamp its script
  tags; setting only the response silently breaks hydration site-wide).
  Disabled in development, where Turbopack's HMR client requires inline
  scripts and `eval`.
- **Indexing** — authenticated routes carry `X-Robots-Tag: noindex` from
  `next.config.ts`, in addition to `robots.txt`.

Never trust client-side authorization. Every gated read re-checks server-side.

---

## Testing

```bash
npm test              # unit + component
npm run test:e2e      # browser, desktop + mobile viewports
```

525 unit and integration tests; 140 end-to-end tests across desktop and
mobile viewports.

Test files run one at a time (`fileParallelism: false`). That is a constraint
of the local `prisma dev` stand-in, not of the tests — see
[Known limitations](#known-limitations). Against real PostgreSQL, set
`VITEST_FILE_PARALLELISM=true` to get the parallelism back.

Unit tests cover the logic where a wrong answer is a security or data problem:
authorization tiers, rate-limit policies, auth and quiz validation, content
document validation, search query sanitisation, quiz scoring, and UTC calendar
arithmetic for streaks.

Six integration suites execute real code against real runtimes:

- `lib/code-execution/harness.integration.test.ts` compiles and runs generated
  harnesses in Python, JavaScript, Java and C++ — including resource limits,
  compile errors, linked-list marshalling, and a check that hidden test inputs
  never reach the client.
- `services/review.integration.test.ts` exercises the review queue against
  the real database: duplicate prevention, schedule preservation, queue
  ordering, concurrent grading, and that one learner's queries can never
  reach another's items.
- `data/problems/solutions.integration.test.ts` runs **every problem's
  reference solution against its own fixtures**. This is what keeps the
  catalogue honest: a wrong expected value is worse than a missing problem,
  because the learner writes a correct solution and is told it failed. It
  caught eight bad fixtures on its first run.
- `services/tutor.integration.test.ts` covers what the tutor is allowed to
  see: that the hints loaded are exactly the prefix the learner unlocked,
  that a failing submission reaches the context while an unscored run does
  not, and that naming another learner's conversation id returns nothing
  rather than their thread.
- `services/lld.integration.test.ts` covers the same guarantees for the
  LLD workspace, plus the hint ladder: that only the unlocked prefix is
  loaded, that autosave cannot rewind the counter, and that neither the
  reference design nor an unopened hint reaches the AI reviewer.
- `services/interview.integration.test.ts` covers session ownership and
  the reference boundary: that the interviewer is never given the
  solution while the interview is running, that `loadFeedbackContext`
  refuses until it has ended, and that every write scoped to another
  candidate's session is a no-op rather than a leak.

The tutor's own rules — the escalation ladder, the refusal to dump a
solution, the fencing of untrusted content, and the context budgets — are
unit-tested in `lib/tutor/`. That matters more than usual here: an AI tutor
that quietly starts answering instead of teaching still produces fluent,
correct, well-formatted text, and nobody notices until learners stop
improving.

End-to-end tests run against a real database and the real executor; mocking
either would defeat the purpose. `e2e/page-health.spec.ts` sweeps every route
on both viewports for console errors, hydration errors, horizontal overflow
and broken links. Each test registers its own uniquely-named account, so the
suite is repeatable and parallel-safe.

`e2e/tutor.spec.ts` streams from `src/lib/ai/mock.ts`, a deterministic
provider wired in by `playwright.config.ts`. Everything else in the path is
real — the route handler, the Pro gate, the rate limiter, the context
builder, the escalation ladder and the database. Only the token source is
fake, which is what makes the assertions meaningful: the mock echoes a fixed
summary of the context it received, so a test can prove the learner's failing
test actually reached the prompt. **CI therefore needs no Anthropic key and
no local Ollama.**

---

## Known limitations

These are real and currently true. None of them are hidden behind a
"coming soon" label in the product.

1. **Rate limiting is per-process.** The default store is in-memory, so it is
   a real control on a single instance and only a speed bump across several.
   Implement `RateLimitStore` against Redis and call `setRateLimitStore`
   before running more than one instance.
2. **`experimental.authInterrupts` is enabled** so `unauthorized()` and
   `forbidden()` return real 401/403 responses. Still flagged experimental in
   Next 16.x.
3. **Billing is not wired up.** Plan entitlements are live and enforced; there
   is no checkout. The pricing page states this rather than showing a button
   that does nothing.
4. **Concurrency is unverified against real PostgreSQL.** Development here
   used Prisma's PGlite-backed `prisma dev` stand-in, which cannot service
   concurrent connections and desynchronises the wire protocol under parallel
   load. `DATABASE_POOL_MAX=1` works around it. The default pool of 10 is
   expected to be correct against real Postgres but has not yet been exercised.
5. **The container executor is written but has never run.**
   `DockerExecutionAdapter` is complete and selectable, but no Docker daemon
   was reachable on the development machine. Treat it as unverified. The
   local adapter *is* verified in four languages, but provides no isolation
   and refuses to start in production.
6. **Pattern templates are Python only.** A template communicates shape, and
   maintaining twenty skeletons in four languages would quadruple the surface
   without teaching anything extra. Problems carry all four languages, which
   is where syntax actually matters. The column is a map, so adding a
   language needs no migration. Solution write-ups carry Python and Java.
7. **Search does not index section titles.** Searching "sliding window" finds
   the pattern and its problems, but not the chapters inside the Sliding
   Window section, because a chapter's tsvector is built from its own fields.
   The pattern page links out to those chapters.
8. **Review due dates are UTC-day granular.** An item graded at 23:50 UTC
   with a one-day interval becomes due ten minutes later, because
   "tomorrow" begins at midnight UTC. Anchoring to the learner's local day
   would require storing a timezone, and running two different definitions
   of a day alongside the existing streak logic would be worse.
9. **No mistake-specific review prompts.** A problem card states how many
   hints were opened, but does not quote the failing submission. Doing that
   properly means parsing test results per card, which is a query per item.
10. **Notes and highlights are readable but not yet writable.** The models,
    the list pages and the search exist; the editor for creating one does not.
11. **`npm audit` reports 4 high advisories in `mysql2`**, a transitive
    development dependency of the Prisma CLI. This project uses PostgreSQL;
    `mysql2` is never loaded at runtime and is not in the production bundle.
12. **Google OAuth is untested** — no credentials were available. The code
    path is present and the button is hidden unless both variables are set.
13. **Policy compliance is instructed, not enforced.** The Socratic rules and
    the escalation rung are pinned by unit tests, and one rung-1 hint from a
    real local model (`qwen2.5:3b`, through the full stack) came back
    conceptual, code-free and ending in a question — as intended. But a
    prompt is a request, not a constraint: no test can prove a model will
    always obey it, and a stronger model may behave differently. Treat the
    ladder as a strong default, not a guarantee.
14. **Anthropic is unverified at runtime** — still no API key. The adapter is
    exercised through its error paths only, and is unchanged from Phase 2.
    Ollama is verified end to end through the same interface.
15. **`qwen2.5:14b` is unusably slow on this machine.** The configured
    default takes over five minutes for a single tutor turn on CPU, so the
    live check used `qwen2.5:3b` (~60s). Nothing is wrong with the adapter;
    the box cannot run a 14B model interactively. Set `OLLAMA_MODEL` to
    something smaller for local development, or use Anthropic.
16. **Test files run serially.** `fileParallelism: false` in
    `vitest.config.mts`, because a fourth database-backed suite pushed the
    PGlite stand-in past the concurrency it can serve (see limitation 4).
    Costs ~24s on the full suite. `VITEST_FILE_PARALLELISM=true` restores
    parallelism against real PostgreSQL.
17. **Tutor conversations are never pruned.** Threads and messages
    accumulate for the life of the account; there is no archive, no delete
    and no retention policy. "New chat" starts a thread, it does not remove
    the old one. Fine at current scale, not a position to hold forever.
18. **LLD code is written but not executed.** The workspace has Monaco
    and stores the learner's implementation alongside their diagram, but
    it does not compile or run it: the LLD exercises are design
    exercises, graded on structure, and none of them ships test cases.
    The existing execution abstraction is untouched and still powers DSA
    submissions. Wiring LLD code to it needs per-exercise tests that do
    not exist yet.
19. **3 LLD exercises seeded, not the 12 listed as examples.** Parking
    Garage, Vending Machine and Event Logger, chosen to cover Strategy,
    State and composition respectively. The authoring format takes the
    rest without schema changes.
20. **Class-diagram layout is tiered, not free-form.** Supertypes above
    subtypes, deterministic. Deliberate — it works on a phone and makes
    designs comparable — but an arbitrary topology cannot be expressed.
21. **RESOLVED.** The Phase 6 "two tutor composers" flake was reproduced
    in Phase 9 as a general pattern: under parallel load the Next dev
    server leaves a hidden prerender copy of a page in the DOM, so an
    unscoped `getByTestId` intermittently matches twice. Test locators
    for in-page content are now scoped to `main`. It affects the dev
    server only — the production build does not do this — so it was
    always a test-harness artefact rather than a product defect.
22. **Interview feedback is AI-generated and labelled as such.** It is a
    language model reading a transcript. Every judgement carries evidence
    so it can be disagreed with, and there is deliberately no composite
    score, no percentage and no hire recommendation. It is not equivalent
    to a real interview and the UI says so.
23. **Only DSA interviews exist.** `createInterview` refuses the other
    three types rather than opening a session no interviewer can conduct.
24. **`notFound()` after streaming returns HTTP 200.** Next commits the
    status when it starts streaming the shell, so a page that calls
    `notFound()` later renders the not-found UI under a 200. Verified
    that no data leaks — a non-owner sees the not-found page — but the
    status code is not a reliable authorization signal for a streamed
    route.

---

## Deployment

Targets Vercel with any PostgreSQL-compatible database.

1. Set every required variable from `.env.example` in the project settings.
2. `npm run db:deploy` against the production database (never `migrate dev`).
3. Build command is `npm run build`, which runs `prisma generate` first.
4. Set `NEXT_PUBLIC_APP_URL` to the real origin — OAuth callbacks, OpenGraph
   images and the sitemap all derive from it.

---

## Content

All educational content in this repository is original. Problem statements,
explanations, pattern write-ups, visualizations and illustrations were written
for CodeForge and are not copied from any other learning platform.

Company preparation data carries provenance on every row — `source`,
`sourceUrl`, `reportedAt`, `confidence` — and the product does not assert that
a company asks a given question without a dated, attributed source.
