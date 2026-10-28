# Code execution

Every Run and Submit executes code a stranger wrote. This document is the
threat model, the architecture, the limits, what has been verified and what
has not, and what must exist before execution is switched on in production.

**Status: public execution is OFF by default in production.** It runs only
when an operator sets `CODE_EXECUTION_ENABLED=true` *and* configures an
isolated driver (`worker` or `remote`). Nothing has been deployed.

## Threat model

Attacker: any visitor (Run works signed out, rate limited per IP) or any
account (Submit). They control the program text, the language field and,
for custom Run, one input validated against the problem signature.

| Goal | Control |
| --- | --- |
| Read app secrets or the database | Code never runs in the web process. The worker host holds no app secrets and refuses to start if `DATABASE_URL`, `AUTH_SECRET` or other app keys are in its environment. Containers get no environment from the host. |
| Reach internal services, cloud metadata, the DPDP app | `--network=none` (tested: a public IP, `169.254.169.254` and the Docker host gateway are all blocked). The worker host must also have no route to the DPDP system. |
| Read or change host files | No host mounts: the source arrives on stdin. Read-only root filesystem; only size-capped tmpfs at `/work` and `/tmp`. |
| Escalate inside the container | uid/gid 65534, all capabilities dropped, `no-new-privileges`, Docker's default seccomp profile (tested: `CapEff=0`, `Seccomp=2`, `NoNewPrivs=1`). |
| Escape the container | Plain runc shares the host kernel, so a kernel bug is an escape. Mitigations: a dedicated worker host with nothing of value on it, and gVisor via `EXECUTION_DOCKER_RUNTIME=runsc`. **This is the residual risk.** |
| Exhaust CPU, memory, processes, disk, output | `--cpus=1`, `--memory` = `--memory-swap`, `--pids-limit=60`, `fsize` 1 MB, `nofile` 64, tmpfs 64 MB / 16 MB, in-container `timeout -s KILL`, a host-side deadline that force-removes the container, and `--init` so the kill reaches every process. |
| Flood the service | One execution slot per learner (a few per IP for visitors), Run/Submit rate limits, and a worker FIFO queue with fixed concurrency that answers 503 when full. |
| Create jobs directly on the worker | A bearer token of 32+ characters compared in constant time; the worker binds to loopback by default and belongs on a private network. |
| See hidden test cases | Test cases load server-side from the database; hidden inputs and outputs are never returned (tested). |
| Tamper with results | The web app validates the worker's reply against a strict schema; verdicts and progress are computed server-side. |
| Read another learner's submissions | Submission reads are scoped to the session user (`submissions.integration.test.ts`). |

## Architecture

```
browser ──server action──> Next.js (no Docker; no learner code runs here)
                              │  auth, zod validation, rate limit,
                              │  execution slot, server-side test cases
                              ▼
                 private network, bearer token
                              ▼
               execution worker  (src/worker, its own host)
                 auth → size cap → schema → FIFO queue (N at a time)
                              ▼
               one throwaway container per test case
               (src/lib/code-execution/docker-adapter.ts)
```

| `CODE_EXECUTION_DRIVER` | Where code runs | Production |
| --- | --- | --- |
| `worker` | `src/worker` on a separate host | allowed once enabled |
| `remote` | Judge0 (self-hosted on a separate host, or a hosted plan) | allowed once enabled |
| `docker` | containers started by the web process | **refused**: a Docker socket is root on its host |
| `local` | a plain subprocess, no isolation | **refused** |

## Limits

Defined in `src/lib/code-execution/limits.ts` and `worker-protocol.ts`.

| Limit | Value |
| --- | --- |
| CPU time per test | the problem's limit, at most 5 s |
| Wall clock per test | killed in-container at the limit; the host removes the container after limit + 30 s |
| Memory | the problem's limit, at most 256 MB, no swap |
| Processes and threads | 60 |
| Output | 1 MB per file, 1 MB captured from stdout and stderr |
| Scratch disk | 64 MB `/work`, 16 MB `/tmp` (noexec) |
| Open files | 64 |
| Job size | 4 MB body, 300,000-character program, 100 tests, 64 KB per case |
| Worker queue | `EXECUTION_WORKER_CONCURRENCY` (default 2) running, `EXECUTION_WORKER_QUEUE` (default 16) waiting, then 503 |

## Evidence

Run on 2026-10-28 on a development laptop (Docker 29.9.1, runc, cgroup v2):

- `docker-adapter.security.integration.test.ts`: 11/11 against a real
  daemon (network, host files and environment, uid and capabilities,
  seccomp, read-only image, disk cap, infinite loop, memory bomb, fork bomb,
  output flood, hidden cases, compile errors), with no containers left over.
- `HARNESS_ADAPTER=docker` run of `harness.integration.test.ts`: 17/17 for
  Python, JavaScript, Java and C++ through the real problem harness.
- `src/worker/app.test.ts`: 7/7 (token, validation, size, routes, no code in
  logs, load shedding, adapter → worker → containers).
- `policy.test.ts`: production refuses `local` and `docker` and stays off
  until enabled.

**Not verified, and not claimed:** gVisor (not installed here), AppArmor (not
enabled on this machine's daemon), behaviour on the eventual worker host, and
resistance to kernel exploits. runc isolation is one layer, not a boundary to
bet sensitive data on.

## Deployment prerequisites (none done)

1. **A separate host for the worker, not the VPS that runs the DPDP
   application.** That VPS holds compliance data and a Docker socket is
   root-equivalent. Without a separate host, leave `CODE_EXECUTION_ENABLED`
   unset and execution stays off.
2. On that host: Docker with cgroup v2; gVisor registered and
   `EXECUTION_DOCKER_RUNTIME=runsc`; AppArmor or SELinux enabled for the
   daemon; images pre-pulled (`python:3.13-alpine`, `node:22-alpine`,
   `eclipse-temurin:21-jdk-alpine`, `gcc:14`).
3. Firewall: inbound only from the web app (private network or tunnel),
   no route to the DPDP host or any database.
4. Run `npm run worker` as a non-root user in the `docker` group, with only
   `EXECUTION_WORKER_TOKEN` (32+ random characters) and the
   `EXECUTION_WORKER_*` settings in its environment, under a supervisor.
5. Re-run the evidence suites **on that host** and keep the output.
6. In the web app: `CODE_EXECUTION_DRIVER=worker`,
   `CODE_EXECUTION_API_URL=<private worker URL>`,
   `CODE_EXECUTION_API_KEY=<the token>`, and only then
   `CODE_EXECUTION_ENABLED=true`.

Production today (Vercel plus the public Judge0 CE) sends code to a third
party that runs it outside every Tech-Epitome and DPDP boundary. After this
change it keeps working only if `CODE_EXECUTION_ENABLED=true` is set on the
next deploy: a deliberate decision for the operator, not a default.

## Known gaps

- No cancellation: a run in progress finishes at its limits.
- Container start-up (about 1 s per test case) dominates latency; a warm pool
  would need its own isolation review.
- Memory use per run is not measured (`memoryKb` is null for containers).
- TypeScript and Go exist in the schema but have no runner; the editor only
  offers languages that have starter code.
