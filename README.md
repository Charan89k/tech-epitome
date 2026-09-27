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
| 9 | Mock interviews: four interviewers, server-owned state machines, banded feedback, preparation tracks | **Complete, verified** |
| 10 | Admin, notifications, onboarding, library, highlights, email, production hardening | **Complete, verified** — with the limits named below |

**Phase 9 covers four interviews, not one.** DSA, behavioural, system
design and low-level design each own a state machine in
`src/lib/interview/types.ts`: its own stages, its own legal transitions,
its own editor stages, and its own feedback dimensions. The stage lives
on the session row and the client never sends it.

Preparation tracks (`/prepare`) describe the *shapes* interview loops
come in rather than naming employers. That is a deliberate limit, not an
omission — see [Known limitations](#known-limitations).

**Phase 10 is complete.** Highlighting, the email abstraction and the
review-reminder delivery pipeline all landed; every table in the schema
has a functional path behind it. What remains is not unbuilt product but
verification that needs infrastructure this machine does not have — a
Resend key, a Docker daemon, OAuth credentials, a real PostgreSQL. Each
is named precisely under [Known limitations](#known-limitations), and
the application fails safely when any of them is absent.

Navigation only ever lists routes that exist. A section absent from the
sidebar has not shipped yet — there are no "coming soon" buttons, and
the one staff route is hidden from everyone who cannot open it rather
than shown locked.

### What exists today

A learner can create an account, work through a 29-chapter DSA curriculum,
take a quiz at the end of a chapter, mark it complete, open a linked problem,
open hints one at a time, write code in four languages, run it against the
sample tests, submit against the full suite, and watch progress and pattern
mastery update on the dashboard. Completing a chapter or solving a problem
then schedules it for spaced revision, and `/review` brings it back the day
after — recall first, answer second, graded on a four-point ladder that sets
the next interval. That entire loop is covered end to end by browser tests.

An AI tutor sits alongside all of that. It reads the chapter being
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

Phase 9 adds mock interviews: four interviewers — coding, behavioural,
system design and low-level design — each with its own server-owned
state machine, its own transcript, and written feedback assessed on the
dimensions that interview can actually produce evidence for. An
interviewer asks rather than teaches: it will not correct a mistake as
it happens, and it never holds the answer to the brief it set.
`/prepare` lays out preparation plans for the shapes interview loops
come in, with the source, confidence and reason printed beside every
recommendation.

Seeded content, all original: **3 courses, 22 sections, 53 chapters, 20
patterns, 50 problems** (377 test cases, 200 hints, 56 solutions), **15
quizzes**, **6 interactive visualizations**, **3 system-design
exercises**, **3 LLD exercises**, **16 behavioural questions** across 8
categories, and **3 preparation tracks**.

While reading, any text in a chapter or a problem statement can be
highlighted in one of four colours; the marks come back on the next
visit and collect in a searchable library beside notes and bookmarks.

Every one of those is free. There is no paid tier — see
[Authorization](#authorization).

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
| Admin | `admin@codeforge.local` | `forge-admin-dev` | ADMIN |
| Demo | `demo@codeforge.local` | `forge-demo-dev` | USER |

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
│   ├── (marketing)/     public pages: landing, features
│   ├── (auth)/          login, signup
│   ├── (shell)/         the sidebar application shell, including /admin
│   └── api/             auth, tutor + interview streams, cron
├── components/
│   ├── ui/              shadcn primitives (owned, editable)
│   ├── brand/ layout/ common/
│   ├── learning/        content block renderers
│   ├── tutor/           AI tutor panel, launcher, markdown
│   ├── interview/       the room, the stepper, the start form
│   ├── learning/        content blocks, the reader, highlighting
│   ├── admin/ library/ notifications/ onboarding/
│   ├── problems/ dashboard/ settings/ auth/ marketing/
├── lib/
│   ├── ai/              provider adapters: ollama, anthropic, mock
│   ├── email/           provider contract, resend, console, templates
│   ├── highlights/      anchor validation and the DOM range layer
│   ├── tutor/           request types, Socratic policy, context builder
│   ├── interview/       the four state machines, interviewer policy
│   └── …                env, db, auth, rate-limit, validation
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

**CodeForge is free, and `canAccess` is where that is enforced.** There is
no plan, no tier and no paid feature, so the function answers only two
questions: is this readable without an account, and is this an
administrative capability? Everything else is available to every signed-in
user. Authorization is not monetization — a role is a permission boundary,
never a price.

Roles are read from the database per request, never from the JWT: a token
minted before a demotion would otherwise keep the admin surface open for the
life of the session.

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

### Mock interviews

Four interviews, four state machines, one table. `MACHINES` in
`src/lib/interview/types.ts` gives each type its stage order, its legal
transitions, whether an editor appears, and the dimensions its feedback is
written against:

| Type | Stages |
|---|---|
| DSA | intro → clarifying → approach → solving → testing → complexity → follow-up → wrap-up |
| Behavioural | intro → question → probing → follow-up → wrap-up |
| System design | intro → clarifying → estimation → high-level → deep dive → scaling → trade-offs → wrap-up |
| Low-level design | intro → clarifying → domain model → class design → principles → extensibility → trade-offs → wrap-up |

**The stage is server-owned and the client never sends it.** The browser
posts what the candidate said; the server reads the stored stage, derives
the turn from it, and returns the stage the interview is now in. An E2E
test posts a forged `stage` and `requestType` and asserts the server
ignores both.

**No interviewer holds its own answer.** `BRIEF_SELECT` in
`services/interview.ts` is the single place that decides what the
interviewer may see, and it omits the DSA solution and hidden tests, the
reference architecture, the reference class diagram and code, and the
behavioural rubric. `loadFeedbackContext` is the only path that loads any
of it, and it refuses unless the session reached `ENDED`.

**Feedback dimensions are per-type.** A model asked for eight dimensions
will invent the two it was not given, which is how "code quality: not
demonstrated" ends up on a behavioural interview. The prompt names this
type's dimensions and says "and no others".

### Admin

`/admin` is guarded by `requireAdmin` in its layout, which runs before every
page beneath it — one boundary rather than five that must all remember. It
`forbidden()`s a signed-in non-admin rather than 404ing: the route's
existence is not a secret, and pretending otherwise makes a permissions
problem look like a dead link. Server actions call `requireAdminOrThrow`
separately, because an action is an endpoint with no page render in front of
it and a layout check is not an action check.

**Every mutation writes an audit row in the same transaction as the change**,
so there is no ordering in which something lands unrecorded. `audit_logs` has
no foreign key to `users` on purpose — deleting an admin must not erase the
record of what they did, so the actor's id and email are denormalised at
write time.

Admin is a role. It is not, and must never become, a paid plan.

### Notifications

In-app only. **CodeForge sends no email** — there is no mailer and none is
planned, so there is no toggle promising one.

Preferences are checked **on write**, not on read: a learner who turns a kind
off does not accumulate a hidden backlog that all appears if they turn it
back on. `href` is rejected unless it is a path on this site, because a
notification is rendered as a link and an absolute URL there would be an open
redirect wearing the product's own chrome. Account and security notices are
not a preference.

Interview and milestone notifications are produced by the code that just did
the thing. Review reminders need a scheduler — see
[Known limitations](#known-limitations).

### Onboarding

Five optional questions after signup, with a genuine skip that writes only
`onboardedAt`. Every answer column is nullable, because a default would
record an answer nobody gave, and every screen that reads one shows nothing
rather than a placeholder when it is null. None of them gate anything.

Signing up with a `?next=` skips onboarding and goes where the visitor was
headed — "sign up to save this note" must not lose the note.

### Highlights

Selecting text in a chapter or a problem statement offers a four-colour
palette; the mark is painted in place and saved to the account.

The anchor is `(blockIndex, startOffset, endOffset)` into one block's
rendered text, plus the `quote` itself. `ContentRenderer` puts a
`data-block-index` on every block, which is what the offsets index into.
**The quote is the repair mechanism**: content is editable through the
admin surface, an edit moves every offset after it, and painting anyway
would mark a sentence the learner never chose — so the browser compares
the stored quote against the text at those offsets and reports a stale
highlight as stale instead.

The limits (`src/lib/highlights/types.ts`) are imported by both the
browser and the server action, so a client cannot be lenient where the
server is strict. A quote whose length disagrees with its range is
refused: the server cannot re-render the block to compare the text, but
it can insist the arithmetic is consistent, and a five-character range
carrying a two-thousand-character payload is the shape of an abuse
vector rather than a mistake.

Partial overlaps are refused (stacked marks produce a colour nobody
chose); an *identical* span is not an error but the same highlight
returned again, so a double click is idempotent.

Chapters and problems only. A pattern page is prose in a bespoke layout
with no block indices, so there would be nothing to anchor to.

### Email

One email exists: the review reminder. There is no marketing of any
kind, no tracking pixel and no click wrapper, because CodeForge is free
and there is nothing to measure.

`EmailProvider` mirrors the AI abstraction — nothing above the adapter
names a vendor. `resend` is the production adapter, written over `fetch`
with no SDK; `console` logs and delivers nothing, is registered only
outside production, and *also* refuses to construct there. Two guards,
because a deployment quietly logging its mail instead of sending it
looks entirely healthy from the inside.

The contract's central promise is that **a message the provider did not
accept is never reported as accepted**. A 2xx with no id is a rejection,
not a delivery. The result type is `accepted` rather than `delivered`,
because whether mail later bounced is a webhook this product does not
have.

`emailReviewReminders` defaults to **false**, unlike the in-app
preferences beside it: mail leaves the building and cannot be un-sent,
so switching on a provider must not immediately mail everyone who ever
signed up.

### Review reminder delivery

```
due reviews → opted in? → already sent this period? → render → provider
            → persist the result, whatever it was
```

Idempotency is a unique index on `(userId, kind, periodKey)`, not a
time-window query. **The insert is the lock**: two schedulers racing
both pass a `findFirst` and only one can win a constraint. A rejected
attempt occupies the slot too, so a provider outage does not become a
burst of eleven mails when it recovers — the next period is soon enough.

Every attempt is written to `email_deliveries` with the provider's own
reason, so "did we mail them?" has an answer rather than a guess.

`POST /api/cron/notifications` drives both channels. It is authenticated
with `CRON_SECRET`, compared in constant time, and **refuses everything
when the secret is unset** — an unauthenticated endpoint that enumerates
users and sends mail is worse than a switched-off feature.

### Interview preparation

`/prepare` holds preparation plans for the shapes interview loops come in.
It deliberately does **not** name employers — see
[Known limitations](#known-limitations) for why, and for the provenance
rule every recommendation carries.

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
| `EMAIL_PROVIDER` | no | `console` (default, logs only, refused in production) or `resend` |
| `RESEND_API_KEY` | conditional | Required when `EMAIL_PROVIDER=resend` |
| `EMAIL_FROM` | no | The verified sender, e.g. `CodeForge <noreply@example.com>` |
| `CRON_SECRET` | no | Shared secret for `POST /api/cron/notifications`. Unset means the route refuses everything and no review reminders are sent |
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

- **Server actions are endpoints** — every export of a `"use server"`
  module is callable with a public id, so authorization lives in the
  action, not only in the page or layout that renders its caller. Admin
  actions call `requireAdminOrThrow` even though the admin layout already
  guarded the page. Helpers that take a `userId` must not live in such a
  module at all: one did, and it was an unauthenticated cross-user write
  until it was moved into `src/services/study-days.ts`.
- **No client-supplied identity** — no action accepts a `userId`. The one
  exception is the admin role change, where the id is the *target*, and
  the actor comes from the session.
- **Raw SQL** — the five full-text queries in `src/lib/search/index.ts`
  use `Prisma.sql` tagged templates, so the user's query is a bound
  parameter. There is no `queryRawUnsafe` anywhere.
- **No HTML injection surface** — `dangerouslySetInnerHTML` and
  `innerHTML` appear nowhere in the codebase; tutor markdown is rendered
  through a parser that escapes, and a test feeds it
  `<img onerror=...>` and asserts it comes back as text.
- **Email** — the API key lives in a header and appears in no log, no
  error and no result; a test asserts it is absent from both the request
  body and the returned object. Addresses are checked against a narrow
  positive pattern that rejects CR, LF and tabs, so a header-injection
  attempt (`a@b.test\nBcc: everyone`) never reaches an adapter. Subjects
  are stripped of newlines. The learner's name is HTML-escaped into the
  rich part.
- **Highlights** — the quote is never re-inserted as markup: marks are
  created with `document.createElement` and `Range.surroundContents`, and
  the library renders the quote as a React child. Ranges are bounded on
  both sides of the wire by the same module.
- **Notification links** — rejected unless they are a path on this site.
  A notification is rendered as an anchor, so an absolute URL there would
  be an open redirect wearing the product's own chrome.
- **Code execution** — production refuses to run learner code without a
  container rather than falling back to the host. See
  `src/lib/code-execution/index.ts`.
- **AI** — never makes an authorization decision. Reference material is
  withheld by the service's `select`, not by asking the model to keep a
  secret; `BRIEF_SELECT` in `services/interview.ts` is the single place
  that decides what an interviewer may see, and tests assert per type
  that the answer is absent from the serialized context.

Never trust client-side authorization. Every gated read re-checks server-side.

---

## Testing

```bash
npm test              # unit + component
npm run test:e2e      # browser, desktop + mobile viewports
npm run test:e2e:prod # CSP, against a real production build
npm run test:redis    # the rate limiter against a real Redis server
```

`test:redis` needs a `redis-server` binary — it picks one up from `PATH`
or from `REDIS_TEST_SERVER`, starts it on a port of its own with
persistence off, and shuts it down afterwards. It sets
`REDIS_TEST_REQUIRED=true`, so a missing binary **fails** rather than
skipping quietly; a Redis test that silently becomes a no-op is worse
than no test, because the documentation goes on claiming it runs. In a
plain `npm test` run those 16 tests are skipped and reported as skipped.

`e2e/free-access.spec.ts` is the one that keeps the product honest about
its own model: an ordinary account — nothing bought, no role, no flag —
opens all 26 surfaces, starts all four interview types, and the test
fails on any commercial phrasing or any link pointing at a paywall. It
also asserts `/api/checkout`, `/api/billing`, `/api/stripe`,
`/api/webhooks/stripe` and `/api/subscription` all 404.

698 unit and integration tests (plus 16 Redis tests that run against a
real server via `npm run test:redis`); 228 end-to-end tests across
desktop and mobile viewports, plus one that runs against a production
build to check the CSP.

Test files run one at a time (`fileParallelism: false`) and pin
`DATABASE_POOL_MAX=1`. Both are constraints of the local `prisma dev`
stand-in, not of the tests — serial files alone was not enough, because a
single test that fans out with `Promise.all` still opens several
connections. See [Known limitations](#known-limitations). Against real
PostgreSQL, set `VITEST_FILE_PARALLELISM=true` and a real pool size.

Unit tests cover the logic where a wrong answer is a security or data problem:
authorization boundaries, rate-limit policies, auth and quiz validation, content
document validation, search query sanitisation, quiz scoring, and UTC calendar
arithmetic for streaks.

The integration suites execute real code against the real database:

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
  the reference boundary for all four interview types: that no
  interviewer is given its own answer while the interview is running —
  the DSA solution, the reference architecture, the reference class
  design, or the behavioural rubric — that `loadFeedbackContext` refuses
  until the session has ended, and that every write scoped to another
  candidate's session is a no-op rather than a leak. The LLD case is
  checked by content as well as by key name: every line of the reference
  implementation is searched for in the serialized context, because a
  reference that arrived flattened into the brief would pass a key check.
- `services/prep.integration.test.ts` covers the provenance rule: no
  recommendation without a source, a confidence, a date and a reason,
  and a failing test if any employer is ever named in published track
  content.
- `services/admin.integration.test.ts` pins the two invariants that make
  an admin surface safe to have: no mutation lands without an audit row
  (including that a *failed* write leaves none), and the last admin
  cannot be demoted.
- `services/notifications.integration.test.ts` pins preferences being
  honoured on write rather than on read, and the refusal of any `href`
  that is not a path on this site.
- `services/library.integration.test.ts` covers notes and bookmarks:
  one note per learner per thing, clearing it deletes it, and neither is
  visible to anyone else.
- `services/achievements.integration.test.ts` pins idempotence — the
  award pass recomputes rather than increments, so running it twice
  awards nothing twice.
- `services/highlights.integration.test.ts` covers the anchor contract
  and ownership: an incoherent anchor never reaches the database, an
  identical span deduplicates rather than erroring, a partial overlap is
  refused, and no learner can read, recolour or delete another's.
- `services/email-notifications.integration.test.ts` walks the reminder
  pipeline a learner at a time — opted in, opted out, nothing due, a
  provider that rejects — and proves idempotency holds when three runs
  overlap, by racing them.
- `lib/rate-limit.redis.integration.test.ts` runs against a **real
  Redis server** rather than a fake. It is the only way to confirm the
  assumptions the store is built on: that `PTTL` returns -2 for a
  missing key and -1 for one with no expiry, and that `INCR` on a key
  with a TTL does not extend it.
- `app/api/cron/notifications/route.test.ts` asserts every refusal path
  on the one endpoint that enumerates users and sends mail, including
  that an unset secret refuses rather than admits.
- `services/database.integration.test.ts` pins the schema-level
  behaviour everything else assumes: deleting an account removes its rows
  and no content, retiring a brief nulls an interview's reference instead
  of deleting the transcript, the audit trail outlives its author, and
  every unique constraint that matters actually rejects.

`lib/interview/interview.test.ts` tests the four state machines as
machines. Two assertions there are worth more than the rest: every
machine is walked to a fixed point and fails if any stage in its own
stepper is unreachable — which is how the dead `APPROACH` and `WRAP_UP`
steps were found — and no machine may declare a transition out of a
stage belonging to a different interview type.

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
real — the route handler, the sign-in gate, the rate limiter, the context
builder, the escalation ladder and the database. Only the token source is
fake, which is what makes the assertions meaningful: the mock echoes a fixed
summary of the context it received, so a test can prove the learner's failing
test actually reached the prompt. **CI therefore needs no Anthropic key and
no local Ollama.**

---

## Known limitations

These are real and currently true. None of them are hidden behind a
"coming soon" label in the product.

1. **The default rate-limit store is per-process.** A real control on a
   single instance, a speed bump across several. The Redis store *is*
   verified — `npm run test:redis` runs 16 tests against a real Redis
   server, covering `INCR`, `PEXPIRE`, `PTTL`'s -1/-2 semantics, TTL
   preservation across increments, real expiry, 20 concurrent hits
   counted exactly once, two instances sharing one counter, and both
   failure modes. Set `REQUIRE_DISTRIBUTED_RATE_LIMIT=true` on a
   multi-instance deployment and rate-limited requests are refused until
   a shared store is installed, rather than silently admitted.
2. **`experimental.authInterrupts` is enabled** so `unauthorized()` and
   `forbidden()` return real 401/403 responses. Still flagged experimental in
   Next 16.x.
3. **There is no billing, by decision, not by omission.** CodeForge is
   free. There is no plan, subscription, paid tier, paywall, checkout or
   payment provider, and none is planned. Rate limits on the AI features
   exist to keep them affordable to run and say so in those words — they
   are never an offer to buy more.
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
10. **Highlights anchor by offset, so an edit can strand one.** The
    anchor is a range into a block's rendered text; editing that block
    moves every offset after it. The stored quote is compared before
    painting and a mismatch is reported rather than painted over the
    wrong words, but a stranded highlight is not automatically
    re-found — the fuzzy re-anchoring that would do it is not built.
    Stale ones stay listed in the library, where the quote is still
    readable.
11. **Review reminders need a scheduler.** CodeForge has no background
    worker, so `POST /api/cron/notifications` is an endpoint for whatever
    scheduler the deployment already has. With `CRON_SECRET` unset the
    route refuses every request, so **no review reminders are sent until
    a scheduler is pointed at it**. The settings toggle says so. Interview
    and milestone notifications need no scheduler and work today.
12. **The Resend adapter has never talked to Resend.** No API key was
    available, so what is verified is the request it builds, the
    responses it parses and how it classifies failures — against a
    stubbed `fetch`, not against the service. A wrong field name would
    pass every test and fail on the first real send. The pipeline around
    it *is* verified end to end against the console provider: eligibility,
    preference, idempotency under concurrency, rejection handling and
    result persistence.
13. **Admin content management edits publication state and nothing else.**
    An admin can publish, unpublish and archive any of the six content
    types, and every change writes an audit row in the same transaction.
    Bodies are validated block documents authored in `src/data/`; a
    textarea that let arbitrary JSON into them would be a worse tool than
    the seed it replaced, so it is deliberately absent.
14. **`npm audit` reports 4 high advisories in `mysql2`**, a transitive
    development dependency of the Prisma CLI. This project uses PostgreSQL;
    `mysql2` is never loaded at runtime and is not in the production bundle.
15. **Google OAuth is untested** — no credentials were available. The code
    path is present and the button is hidden unless both variables are set.
16. **Policy compliance is instructed, not enforced.** The Socratic rules and
    the escalation rung are pinned by unit tests, and one rung-1 hint from a
    real local model (`qwen2.5:3b`, through the full stack) came back
    conceptual, code-free and ending in a question — as intended. But a
    prompt is a request, not a constraint: no test can prove a model will
    always obey it, and a stronger model may behave differently. Treat the
    ladder as a strong default, not a guarantee.
17. **Anthropic is unverified at runtime** — still no API key. The adapter is
    exercised through its error paths only, and is unchanged from Phase 2.
    Ollama is verified end to end through the same interface.
18. **`qwen2.5:14b` is unusably slow on this machine.** The configured
    default takes over five minutes for a single tutor turn on CPU, so the
    live check used `qwen2.5:3b` (~60s). Nothing is wrong with the adapter;
    the box cannot run a 14B model interactively. Set `OLLAMA_MODEL` to
    something smaller for local development, or use Anthropic.
19. **Test files run serially.** `fileParallelism: false` in
    `vitest.config.mts`, because a fourth database-backed suite pushed the
    PGlite stand-in past the concurrency it can serve (see limitation 4).
    Costs ~24s on the full suite. `VITEST_FILE_PARALLELISM=true` restores
    parallelism against real PostgreSQL.
20. **Tutor conversations are never pruned.** Threads and messages
    accumulate for the life of the account; there is no archive, no delete
    and no retention policy. "New chat" starts a thread, it does not remove
    the old one. Fine at current scale, not a position to hold forever.
21. **LLD code is written but not executed.** The workspace has Monaco
    and stores the learner's implementation alongside their diagram, but
    it does not compile or run it: the LLD exercises are design
    exercises, graded on structure, and none of them ships test cases.
    The existing execution abstraction is untouched and still powers DSA
    submissions. Wiring LLD code to it needs per-exercise tests that do
    not exist yet.
22. **3 LLD exercises seeded, not the 12 listed as examples.** Parking
    Garage, Vending Machine and Event Logger, chosen to cover Strategy,
    State and composition respectively. The authoring format takes the
    rest without schema changes.
23. **Class-diagram layout is tiered, not free-form.** Supertypes above
    subtypes, deterministic. Deliberate — it works on a phone and makes
    designs comparable — but an arbitrary topology cannot be expressed.
24. **The dev server duplicates pages in the DOM under parallel load.**
    Diagnosed in Phase 6, understood in Phase 9: `next dev` sometimes
    leaves a hidden prerender copy of a page mounted, so a locator that
    should match once matches twice and Playwright's strict mode fails
    the test. In-page locators are scoped to `main`, which fixes it
    everywhere except the tutor panel — that renders in a Radix portal
    *outside* `main`, so scoping breaks it instead. The local suite
    therefore allows one retry, and Playwright reports anything that
    needed one as *flaky* rather than passed, so it stays visible. A
    production build does not do this, and the production CSP test
    renders the same pages once.
25. **Interview feedback is AI-generated and labelled as such.** It is a
    language model reading a transcript. Every judgement carries evidence
    so it can be disagreed with, and there is deliberately no composite
    score, no percentage and no hire recommendation. It is not equivalent
    to a real interview and the UI says so.
26. **Preparation tracks name no employer, on purpose.** CodeForge has
    no sourced, dated, attributable record of what any company asks in
    an interview. Shipping "prepare for <company>" would have meant
    inventing the provenance the schema requires, producing something
    that looks authoritative and is not. What `/prepare` describes
    instead is the shape a loop comes in — generalist, startup
    full-stack, infrastructure — as CodeForge's own editorial judgement,
    with the source, confidence and date printed next to every
    recommendation. The provenance columns are kept precisely so that a
    real citation has somewhere honest to go; only then would naming an
    employer be defensible. A test fails if any employer is named.
27. **Behavioural difficulty is not modelled.** "Tell me about a
    conflict" is not harder at senior level; the follow-ups are. The
    start form hides the difficulty control for that type rather than
    offering one that does nothing.
28. **There is no billing** — see limitation 3. As of the free
    refactor this is a product decision rather than unfinished work:
    the `Subscription` model, the `AccessTier` column on every content
    table, the `STRIPE_*` variables and the pricing page have all been
    removed, and `/pricing` permanently redirects to `/features`.
29. **`notFound()` after streaming returns HTTP 200.** Next commits the
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
5. Set `CODE_EXECUTION_DRIVER=docker` and give the deployment a reachable
   Docker daemon. In production the app **refuses to start the executor**
   rather than falling back to the unsandboxed local one; that refusal is
   deliberate and must not be worked around.
6. Running more than one instance? Set
   `REQUIRE_DISTRIBUTED_RATE_LIMIT=true` and install a shared store at
   startup:

   ```ts
   import { createRedisRateLimitStore, setRateLimitStore } from "@/lib/rate-limit";
   setRateLimitStore(createRedisRateLimitStore(redis));
   ```

   With the flag set and no shared store installed, rate-limited requests
   are refused rather than silently admitted. No Redis client is bundled —
   `RedisLike` is a structural interface that `ioredis` and `node-redis`
   both satisfy.
7. Optional: point a scheduler at `POST /api/cron/notifications` with
   `Authorization: Bearer $CRON_SECRET` to send review reminders. Nothing
   else depends on it.

### The first admin

`npm run db:seed` creates one from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
— **change both before any deploy**. After that, promotion happens through
`/admin/users`, and the service refuses to demote the last admin, because an
installation with no admin has no route back through the UI.

---

## Content

All educational content in this repository is original. Problem statements,
explanations, pattern write-ups, visualizations and illustrations were written
for CodeForge and are not copied from any other learning platform.

Preparation-track data carries provenance on every row — `source`,
`sourceUrl`, `reportedAt`, `confidence`, and a written reason — and the UI
prints it beside the recommendation. CodeForge does **not** claim what any
company asks, because it has no sourced record of that; `/prepare` describes
the shapes interview loops come in and names no employer. A test fails if one
ever appears.
