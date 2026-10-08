<div align="center">

<img src="docs/screenshots/landing.png" alt="Tech Epitome landing page" width="820">

# Tech Epitome

### Master Technology. Build with Confidence.

A free, interactive learning platform for software engineering — data
structures and algorithms, coding patterns, system design, low-level design,
and realistic interview practice.

**150 problems · 77 chapters · 16 design exercises · a live visualizer for your own code**

**No subscriptions · No premium tiers · No paywalls**

[Features](#-what-you-can-do) · [Screenshots](#-screenshots) · [Demo](#-demo) · [Run locally](#-run-locally) · [Deploy](#️-deploy-your-own) · [Engineering docs](docs/ENGINEERING.md)

</div>

---

> [!NOTE]
> **Live at [tech-epitome.vercel.app](https://tech-epitome.vercel.app).** You can
> also [run it locally](#-run-locally) in a few minutes, or
> [deploy your own](#️-deploy-your-own) — everything needed is in the repo.

---

## What is Tech Epitome?

Tech Epitome is a learning platform for people becoming better software
engineers. It is **not a collection of articles** — you read a chapter, take a
quiz on it, solve linked problems in a real editor, design a system, defend the
design to an AI interviewer, and come back to the same material days later when
you are about to forget it.

It is built around one idea: interviews test whether you can look at an
unfamiliar problem and recognise its shape. So the material teaches recognition
directly, rather than leaving it to emerge from volume.

Everything in it is free to every signed-in account. There is no paid tier and
none is planned.

---

## 🎬 Demo

The live code visualizer, recorded from the real application: a problem draws
its input, then replays a solution typed into the editor one line at a time —
the `write` pointer moving, values being compacted, the editor following along.

<div align="center">

![The live code visualizer replaying a solution step by step](docs/screenshots/demo.gif)

</div>

▶️ **[Watch the walkthrough (MP4)](docs/videos/tech-epitome-demo.mp4)**

<table>
<tr>
<td><img src="docs/screenshots/live-visualizer.png" alt="An array being compacted in place, with the write pointer under the current cell"></td>
<td><img src="docs/screenshots/live-visualizer-list.png" alt="A linked list mid-reversal, with prev, node and head marked on the nodes"></td>
</tr>
<tr>
<td align="center"><sub>Arrays: pointers under cells, changed cells flash</sub></td>
<td align="center"><sub>Linked lists: the reversed prefix and the untouched rest</sub></td>
</tr>
</table>

> Every screenshot and every frame of the recording is the actual application,
> captured by driving the real UI with Playwright. Nothing here is a mockup.

---

## ✨ What you can do

### 📚 Structured learning

Three tracks — **DSA** (29 chapters), **System Design** (27) and
**Low-Level Design** (21) — in dependency order rather than as a pile of
topics, with a **roadmap** for each that tracks where you are. System Design
runs from estimation and storage internals through reliability to six worked
interview case studies (news feed, chat, video streaming, key-value store,
web crawler, payments); Low-Level Design from responsibilities and SOLID
through concurrency to five modelling case studies. Each chapter states what you
should be able to do afterwards, then checks it with a quiz and linked
problems. Content is stored as typed, validated blocks, so a lesson can embed a
stepped visualization or an inline quiz rather than only prose.

### 🎞️ Live code visualizer

Every problem draws its input — the array, the string, the linked list —
right in the statement. Run your Python or JavaScript and the picture replays
**your own code** line by line: index variables become pointers under the
cells, changed values flash, maps and sets fill in, linked-list pointers
rewire, and recursion shows its call stack. The editor highlights the line
each step is on, and with **Live** on the picture re-traces as you type.

It runs entirely in your browser, in a worker — Python on Pyodide,
JavaScript through an instrumenting rewrite — under its own
Content-Security-Policy that gives the code no access to this site's API.
Java and C++ show the input picture; step-by-step tracing needs an
in-browser runtime they do not have.

### 💻 Problem solving

150 original problems (59 easy, 72 medium, 19 hard) grouped by the pattern
they teach, with a Monaco editor, four languages (Python, JavaScript, Java,
C++), progressive hints you open one at a time, and solutions that walk from
brute force through the observation that improves it. Code is judged in a
sandbox (Judge0 in production) and failures show the case that broke, not a
red cross.

### 🧠 Pattern recognition

Every pattern page opens with the clues that identify it — contiguous range,
monotonic order, k-th largest — and the look-alikes that do not.

### 🤖 AI Tutor

A Socratic tutor that reads the chapter you are on or the code in your editor,
including your last failing test, and works you toward the answer instead of
supplying it. Hints climb one rung per ask and only reach a full walkthrough
after the rungs before it.

> Requires an AI provider. Ships with adapters for **Ollama** (local),
> **Anthropic**, and a deterministic mock used by the test suite. Nothing above
> the adapter layer names a vendor.

### 🎤 Mock interviews

Four interviewers, each with its own server-owned state machine:

| Mode | Shape |
|---|---|
| **DSA** | clarify → approach → solve → test → complexity → follow-up |
| **Behavioural** | question → probing → follow-up, pushing past "we" to "I" |
| **System design** | scope → estimate → high-level → deep dive → scale → trade-offs |
| **Low-level design** | domain model → classes → principles → extensibility → trade-offs |

**The stage lives on the server and the client never sends it**, so there is no
request a browser can make that skips to the feedback. Afterwards you get
written feedback assessed per dimension with evidence quoted from your own
transcript — and deliberately **no single score**, because a number implies a
precision that reading a transcript does not have.

### 🏗️ Design practice

Sixteen briefs — eight architectures (short links, rate limiter, notifications,
news feed, chat, file sync, web crawler, ride matching) and eight class
designs (parking garage, vending machine, event logger, elevator, library,
expense splitter, chess, hotel reservations). Draw your design, say what you
traded away, and submit. **The reference design is withheld until you do** — an
exercise you can read as a worked example is not an exercise.

### 🖍️ Highlights

Select any text in a chapter or problem statement and mark it in one of four
colours. Highlights persist, come back on your next visit, and collect in a
searchable library that links back to the source. Because they anchor by offset,
each stores the text it covered — if the content is edited underneath one, it is
reported as stale rather than silently marking the wrong sentence.

### 📝 Notes & bookmarks

One private note per chapter, problem or pattern, written where you are reading
and searchable from the library. Bookmarks save anything for later. Clearing a
note deletes it — no second destructive button to mis-click.

### 🔁 Spaced revision

Solving something once is not learning it. Completed chapters and solved
problems return on a widening schedule graded on a four-point recall ladder,
with the interval set by how well you actually remembered.

### 🏆 Achievements & progress

Twelve milestones earned from your own rows — counters are recomputed rather
than incremented, so nothing can be double-awarded. The dashboard shows what you
solved, which patterns are weak, your streak, and progress against a weekly
target you set yourself.

### 🔔 Notifications

In-app notifications for graded interviews, milestones and due reviews.
Optional **email review reminders** are opt-in and sent at most once a day.

### 🛡️ Admin

A staff-only area for user roles, content publication, AI usage and an audit
log. **Every administrative change writes its audit row in the same transaction
as the change**, so nothing lands unrecorded. Admin is a role, never a plan.

---

## 🆓 Completely free

Tech Epitome is designed as a completely free learning platform.

There are:

- no subscriptions
- no premium tiers
- no paywalls
- no checkout
- no paid AI credits
- no locked learning content

All platform functionality is available to any authenticated user. This is
enforced by a test, not just a promise: an end-to-end spec opens every surface
with an ordinary account and fails on any commercial phrasing or any link
pointing at a paywall.

---

## 📸 Screenshots

### Problems, grouped by pattern
![The problem catalogue grouped by pattern, with progress per pattern and the shape each problem's visual draws](docs/screenshots/problems.png)

### Roadmaps
![Ordered roadmaps for DSA, system design and low-level design built from the course sections](docs/screenshots/roadmaps.png)

### Pattern library
![Pattern cards with line-art diagrams and problem counts](docs/screenshots/patterns.png)

### Dashboard
![Dashboard showing continue-learning, today's practice and progress tiles](docs/screenshots/dashboard.png)

### Chapter reader
![A chapter with the lesson body, table of contents and tutor launcher](docs/screenshots/learning-chapter.png)

### Problem workspace
![A problem statement beside the Monaco editor and test results](docs/screenshots/problem-workspace.png)

### AI Tutor
![The AI tutor answering a question about recognising sliding-window problems](docs/screenshots/ai-tutor.png)

### Mock interview
![A system design mock interview with its stage stepper and transcript](docs/screenshots/interview-room.png)

### System design workspace
![The architecture workspace for a design brief](docs/screenshots/system-design-workspace.png)

### Low-level design workspace
![The class-diagram workspace for a low-level design brief](docs/screenshots/lld-workspace.png)

### Highlights
![Text selected in a chapter with the highlight colour palette open](docs/screenshots/highlight-toolbar.png)
![The highlights library listing saved passages with links back to the source](docs/screenshots/highlights-library.png)

### Notes
![The notes library with a saved note attached to a problem](docs/screenshots/notes.png)

### Interview preparation
![A preparation track describing an interview loop and its recommended practice](docs/screenshots/prepare.png)

### Achievements & profile
![The profile page with progress tiles and achievement cards](docs/screenshots/profile-achievements.png)

### Spaced revision
![The review queue](docs/screenshots/review.png)

### Onboarding
![Five optional onboarding questions, each skippable](docs/screenshots/onboarding.png)

### Algorithm visualizations
![A gallery of stepped algorithm visualizations](docs/screenshots/visualize.png)

### Admin
![The admin overview with user, content, activity and AI-usage counts](docs/screenshots/admin.png)

---

## 🔐 Login & authentication

Authentication is **email and password** plus optional **Google** and
**GitHub** sign-in, handled by Auth.js v5, with
[argon2id](https://en.wikipedia.org/wiki/Argon2) password hashing at OWASP 2024
parameters.

**Creating an account**

1. Open `/signup`, enter a name, email and password.
2. You are signed in automatically and sent to onboarding.
3. Onboarding asks five optional questions — experience, goal, target
   interview, language, weekly target. **Every one is skippable**, and skipping
   records only that you were asked. Nothing there gates anything.
4. Sign out from the account menu in the top bar.

**Google and GitHub** sign-in each appear only when their credentials are set
(`AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`, `AUTH_GITHUB_ID`/`AUTH_GITHUB_SECRET`;
callback `<app-url>/api/auth/callback/<provider>`). Accounts are never linked
on a matching email alone — that would let anyone who can set an address on a
provider profile into the existing account — so a clash is explained on the
sign-in page instead. Provider tokens are discarded after sign-in; they are
used for identity only. A first provider sign-in gets the same skippable
onboarding as an email signup.

Sessions are JWT-based, but **roles and preferences are read from the database
per request, never from the token**, so a demoted admin loses access on their
next request rather than their next sign-in.

---

## 🧭 How to use it

1. **Run it locally** (below) or deploy your own.
2. **Create an account** and complete or skip onboarding.
3. **Pick a roadmap** — DSA, System Design or Low-Level Design — and follow it.
4. **Read a chapter**, highlight what matters, take the end-of-chapter quiz.
5. **Solve the linked problems** in the editor, opening hints only when stuck.
   Press **Visualize** to watch your own code move through the example.
6. **Ask the AI Tutor** when you are stuck on the idea rather than the syntax.
7. **Submit a design exercise** before looking at the reference.
8. **Run a mock interview** and read the feedback against your transcript.
9. **Come back to `/review`** when the scheduler brings material back.
10. **Watch the dashboard** — mastery is computed from your own history.

---

## 🛠️ Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4, shadcn/ui, Radix primitives |
| Database | PostgreSQL via Prisma 7 (`@prisma/adapter-pg`) |
| Auth | Auth.js v5 (credentials + optional Google and GitHub), argon2id |
| Editor | Monaco |
| Code execution | Judge0 (production), Docker or local subprocess (development) |
| Live tracing | Pyodide in a Web Worker (Python), acorn instrumentation (JavaScript) |
| AI | Provider abstraction — Ollama, Anthropic, deterministic mock |
| Email | Provider abstraction — Resend, console (dev) |
| Rate limiting | Shared PostgreSQL counters in production; in-process for development; Redis store optional |
| Validation | Zod, on every boundary |
| Testing | Vitest (unit + integration), Playwright (E2E, desktop + mobile) |

---

## 🏗️ Architecture

```
Browser (React 19 · Server Components)
      │
      ▼
Next.js App Router ──── proxy.ts  (optimistic auth redirect + per-request CSP nonce)
      │
      ├── Server Actions ─────┐
      └── Route handlers ─────┤   (SSE streaming for tutor + interviews)
                              ▼
                        Services layer            ← the only place that queries
                     src/services/*.ts               and the only place that
                              │                      decides what may be read
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        PostgreSQL      AI provider      Email provider
        (Prisma)      (Ollama/Anthropic)   (Resend/console)
```

Two rules hold the design together:

- **Pages never query Prisma directly.** They call a service, which owns the
  query, the `status: PUBLISHED` filter and the ownership scope. A forgotten
  `where` clause cannot leak draft content or another learner's rows.
- **Reference material is withheld by the `select`, not by asking a model to
  keep a secret.** One place decides what an interviewer or tutor may see, and
  tests assert per type that the answer is absent from the serialized context.

The [engineering reference](docs/ENGINEERING.md) goes into the authorization
model, the interview state machines, the code-execution sandbox and the
security posture in detail.

---

## 📁 Project structure

```
src/
├── app/
│   ├── (marketing)/      landing, features
│   ├── (auth)/           login, signup
│   ├── (shell)/          the application shell, including /admin
│   └── api/              auth, tutor + interview streams, cron
├── components/           ui primitives, learning, interview, library, admin
├── lib/
│   ├── ai/               provider adapters
│   ├── email/            provider adapters and templates
│   ├── interview/        the four state machines
│   ├── highlights/       anchor validation and the DOM range layer
│   └── …                 auth, db, rate-limit, search, validation
├── services/             data access, one module per domain
└── data/                 all seed content, original
prisma/                   schema, 16 migrations, seed
e2e/                      Playwright specs
docs/                     engineering reference, screenshots, demo
```

---

## 🚀 Run locally

**Prerequisites:** Node.js 20+, npm, and either Docker (for PostgreSQL) or
nothing at all if you use Prisma's bundled dev database.

```bash
git clone https://github.com/Charan89k/tech-epitome.git
cd tech-epitome
npm install
cp .env.example .env
```

Generate an auth secret and put it in `.env`:

```bash
npx auth secret            # writes AUTH_SECRET
```

**With Docker** — starts PostgreSQL, migrates, seeds:

```bash
npm run setup
npm run dev
```

**Without Docker** — Prisma ships a local PostgreSQL-compatible database:

```bash
npx prisma dev --name tech-epitome   # prints a DATABASE_URL — copy it into .env
# add DATABASE_POOL_MAX=1 to .env (the dev database serves one connection)
npm run db:migrate
npm run db:seed
npm run dev
```

Open <http://localhost:3000>. Sign in with the seeded accounts — **change these
before deploying anywhere**:

| Account | Email | Password | Role |
|---|---|---|---|
| Admin | `admin@techepitome.local` | `forge-admin-dev` | ADMIN |
| Demo | `demo@techepitome.local` | `forge-demo-dev` | USER |

### Useful commands

```bash
npm run dev             # development server
npm run verify          # typecheck + lint + unit tests
npm test                # unit and integration tests
npm run test:e2e        # Playwright, desktop + mobile
npm run test:redis      # rate limiter against a real Redis server
npm run db:studio       # browse the database
npm run capture:media   # regenerate the README screenshots and demo
```

---

## 🔑 Environment variables

Only three are required. Everything else has a safe default or degrades
explicitly.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | **Yes** | PostgreSQL connection string the app runs on. On a hosted provider use the **pooled** endpoint |
| `DIRECT_URL` | No | **Unpooled** endpoint, used only by the Prisma CLI (`migrate`, `studio`). Falls back to `DATABASE_URL` |
| `AUTH_SECRET` | **Yes** | Session signing key — `npx auth secret` |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Public origin; OAuth callbacks and metadata derive from it |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | No | Google sign-in. Both blank hides the button |
| `AI_PROVIDER` | No | `ollama` (default), `anthropic`, or `mock` (rejected in production) |
| `AI_API_KEY` | Conditional | Required when `AI_PROVIDER=anthropic` |
| `OLLAMA_BASE_URL` / `OLLAMA_MODEL` | No | Local model configuration |
| `CODE_EXECUTION_DRIVER` | No | `docker` (default), `local`, or `remote` (Judge0) |
| `EMAIL_PROVIDER` | No | `console` (default, logs only, rejected in production) or `resend` |
| `RESEND_API_KEY` / `EMAIL_FROM` | Conditional | Required when `EMAIL_PROVIDER=resend` |
| `CRON_SECRET` | No | Authenticates the review-reminder job. Unset ⇒ the route refuses everything |
| `RATE_LIMIT_STORE` | No | `postgres` counts in the app database, shared by every instance — set it on Vercel. Unset keeps the in-process store |
| `REQUIRE_DISTRIBUTED_RATE_LIMIT` | No | `true` on multi-instance deployments; refuses limited requests if no shared store is active |
| `DATABASE_POOL_MAX` | No | Defaults to 10; set to `1` for the Prisma dev database |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | No | Seeded accounts — **change before deploying** |

Never commit `.env`. It is gitignored.

---

## ☁️ Deploy your own

Tech Epitome is a standard Next.js application and deploys to Vercel without
modification. You will need a hosted PostgreSQL database — Neon, Supabase and
Vercel Postgres all work.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCharan89k%2Ftech-epitome)

**Or manually:**

1. Push this repository to your GitHub account.
2. Open [vercel.com/new](https://vercel.com/new) and import the repository.
3. Vercel detects Next.js automatically; no build overrides are needed.
4. Add the environment variables — at minimum `DATABASE_URL`, `AUTH_SECRET` and
   `NEXT_PUBLIC_APP_URL` (your production origin).
5. Deploy, then run the migrations and seed against the production database.
   Put the production `DATABASE_URL` and `DIRECT_URL` in `.env.production.local`
   — git-ignored, and loaded by these scripts and by `next build`, never by
   `next dev`:
   ```bash
   npm run db:deploy:prod    # applies the migration history
   npm run db:seed:prod      # idempotent; safe to re-run
   npm run db:status:prod    # should say "Database schema is up to date!"
   ```
6. Open the generated production URL.

### Production notes

- **Pooled vs direct.** Serverless functions open a connection per invocation,
  so `DATABASE_URL` must be the provider's pooled endpoint (Supabase: the
  transaction pooler on port 6543). The migration engine needs an advisory lock
  and session state a transaction pooler cannot give it, so the Prisma CLI uses
  `DIRECT_URL` (Supabase: port 5432). Supabase's direct endpoint is IPv6-only —
  fine from a laptop, not from Vercel — which is another reason migrations are
  run from a workstation rather than during the build.
- **The build reads the database.** `generateStaticParams` for `/prepare/[track]`
  queries Postgres, so `DATABASE_URL` has to be set on the Build step, not just
  at runtime, and the migrations must already be applied.
- **TLS.** Supabase serves Postgres under its own CA, which Node rejects against
  the system trust store. `src/lib/db/ssl.ts` pins that root so verification
  stays on instead of reaching for `sslmode=no-verify`.
- **Code execution.** On a serverless platform (Vercel) set
  `CODE_EXECUTION_DRIVER=remote` and `CODE_EXECUTION_API_URL` to a Judge0
  server: `https://ce.judge0.com` (public, free, rate limited — what the live
  site uses), a RapidAPI Judge0 plan, or your own instance, with its key in
  `CODE_EXECUTION_API_KEY`. On a host with Docker, `docker` works instead.
  Learner code is never executed on the application host in production.
- **AI spend.** `AI_DAILY_TURN_LIMIT` (default 80) and
  `AI_DAILY_INTERVIEW_LIMIT` (default 4) cap each learner per rolling 24h;
  `AI_DAILY_BUDGET_CENTS` optionally caps the whole site per UTC day.
- **Publishing new problems.** `npm run problems:verify` must pass, then
  `npm run problems:sync:prod:dry` and `npm run problems:sync:prod` — never
  the full seed against production.
- **Review reminder emails.** Point a scheduler at
  `POST /api/cron/notifications` with `Authorization: Bearer $CRON_SECRET`.
  Without it no reminders are sent; nothing else is affected.
- **More than one instance (or serverless)?** Set `RATE_LIMIT_STORE=postgres`
  and `REQUIRE_DISTRIBUTED_RATE_LIMIT=true`. Counters then live in the
  `rate_limit_buckets` table, so a limit holds across every instance instead of
  per process. Apply migrations first: with the flag set and no table, limited
  requests are refused rather than silently admitted.
- **Change the seeded credentials** before exposing the deployment.

---

## 🧪 Testing

```bash
npm run verify        # typecheck + lint + unit tests
npm run test:e2e      # 270 browser tests, desktop and mobile
npm run test:redis    # 16 tests against a real Redis server
npm run test:e2e:prod # CSP, against a real production build
```

| Suite | Count | Status |
|---|---|---|
| Unit + integration (Vitest) | 1,085 (18 skip without optional services) | ✅ passing |
| End-to-end (Playwright, 2 viewports) | 270 | ✅ passing |
| Redis, against a real server | 16 | ✅ passing |
| Production CSP | 1 | ✅ passing |
| Migration replay from empty + seed idempotency | — | ✅ verified |

Tests cover the places where a wrong answer is a security or data problem:
authorization boundaries, IDOR on every per-user resource, reference-material
withholding, server-owned interview state, and the free-platform guarantee.

---

## 📌 Known limitations

Stated plainly, because a README that hides them is not documentation.

- **Code runs on Judge0's public instance.** It is free and rate limited, so
  heavy traffic will see "the code runner is busy" messages. Moving to a
  RapidAPI plan or a self-hosted Judge0 is a change of two environment
  variables.
- **Step-by-step tracing covers Python and JavaScript only.** Java and C++
  have no in-browser runtime, so they show the input picture and are judged
  normally, but are not replayed line by line.
- **Google and GitHub sign-in are not yet switched on in production.** The
  code is complete and its redirects are tested; the live site needs its
  OAuth credentials before the buttons appear.
- **Docker execution is not runtime-verified.** The container executor is
  written and selectable, but no Docker daemon was available to run it
  against. Production uses Judge0 instead.
- **The Anthropic adapter and the Resend adapter** are tested against stubs,
  not their real services.
- **Interview feedback is AI-generated** and labelled as such. It is a language
  model reading a transcript, not an assessment.

The [engineering reference](docs/ENGINEERING.md) has the complete list.

---

## 📄 Content & originality

All educational content in this repository is **original**. Problem statements,
explanations, pattern write-ups, visualizations and illustrations were written
for Tech Epitome and are not copied from any other learning platform.

Preparation tracks describe the *shapes* interview loops come in and
deliberately **name no employer** — there is no sourced record of what any
company asks, so the product does not claim one.

---

<div align="center">

**Tech Epitome** — Master Technology. Build with Confidence.

</div>
