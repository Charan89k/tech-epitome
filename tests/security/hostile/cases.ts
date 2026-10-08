import type { Language, SubmissionStatus } from "@/generated/prisma/enums";
import type { ExecutionResult } from "@/lib/code-execution/types";

/**
 * Hostile programs, and what a working sandbox must do with each.
 *
 * Every case runs as a complete program (no harness) with no stdin. Where
 * the property is "this must not be possible", the program tries it and
 * prints what it managed — so a violation is evidence in stdout, not an
 * inference from an exit code. `violation()` reads that evidence and
 * returns a description of the broken isolation property, or null.
 *
 * Two separate judgements per case, reported separately:
 *   - expected:  the verdicts that count as correct handling;
 *   - violation: an isolation property that did not hold. Any violation
 *                fails the suite loudly, whatever the verdict.
 *
 * Nothing here targets the host: every attack is aimed at the sandbox's own
 * limits and namespaces, and each one is bounded by them. `heavy` marks the
 * cases that deliberately exhaust a resource; they never run against a
 * server we do not operate (see hostile.security.test.ts).
 */

export type HostileCase = {
  id: string;
  title: string;
  language: Language;
  source: string;
  /** Verdicts that count as the sandbox handling this correctly. */
  expected: SubmissionStatus[];
  /** Returns a description of the violated property, or null. */
  violation: (output: Observed) => string | null;
  /** Exhausts a resource on purpose; only ever run against our own server. */
  heavy?: boolean;
};

export type Observed = {
  result: ExecutionResult;
  stdout: string;
  stderr: string;
};

/** Lines like `OPEN 127.0.0.1:5432` printed by the probe programs. */
function linesStarting(stdout: string, prefix: string): string[] {
  return stdout.split("\n").filter((line) => line.startsWith(prefix));
}

const SECRET_NAME = /PASSWORD|SECRET|TOKEN|API_?KEY|PRIVATE|CREDENTIAL|DATABASE|POSTGRES|REDIS|AUTHN|AUTHZ|SUPABASE|VERCEL|AWS_|ANTHROPIC|OPENAI|GITHUB/i;

const py = (source: string) => source.trim() + "\n";

export const HOSTILE_CASES: HostileCase[] = [
  {
    id: "infinite-loop",
    title: "Infinite loop",
    language: "PYTHON",
    source: py(`while True:\n    pass`),
    expected: ["TIME_LIMIT_EXCEEDED"],
    violation: ({ result }) =>
      result.status === "ACCEPTED" ? "an infinite loop finished normally" : null,
  },
  {
    id: "cpu-exhaustion",
    title: "CPU exhaustion across threads",
    language: "CPP",
    source: String.raw`
#include <thread>
#include <vector>
#include <cstdio>
int main() {
  std::vector<std::thread> ts;
  for (int i = 0; i < 16; i++) {
    try { ts.emplace_back([] { volatile unsigned long x = 0; for (;;) x++; }); }
    catch (...) { std::printf("THREAD_REFUSED %d\n", i); break; }
  }
  for (auto& t : ts) t.join();
}
`,
    expected: ["TIME_LIMIT_EXCEEDED", "RUNTIME_ERROR"],
    violation: ({ result }) =>
      result.status === "ACCEPTED" ? "16 busy threads ran to completion" : null,
    heavy: true,
  },
  {
    id: "memory-exhaustion",
    title: "Memory exhaustion",
    language: "PYTHON",
    source: py(`
blocks = []
for i in range(1, 33):
    blocks.append(bytearray(64 * 1024 * 1024))
    print("ALLOCATED_MB", i * 64, flush=True)
print("ALLOCATED_ALL")
`),
    expected: ["MEMORY_LIMIT_EXCEEDED", "RUNTIME_ERROR"],
    violation: ({ stdout }) => {
      const reached = Math.max(
        0,
        ...linesStarting(stdout, "ALLOCATED_MB").map((l) => Number(l.split(" ")[1]))
      );
      // 256 MB is the ceiling; one 64 MB block of slack for the interpreter.
      return reached > 320 || stdout.includes("ALLOCATED_ALL")
        ? `allocated ${reached} MB past a 256 MB limit`
        : null;
    },
    heavy: true,
  },
  {
    id: "huge-stdout",
    title: "Huge stdout",
    language: "PYTHON",
    source: py(`
import sys
line = "A" * 1023 + "\\n"
while True:
    sys.stdout.write(line)
`),
    expected: ["OUTPUT_LIMIT_EXCEEDED"],
    // The adapter truncates what it returns, so size is not the evidence.
    // What matters is that the file-size limit stopped the writes: running
    // on until the time limit means output was unbounded on the worker disk.
    violation: ({ result }) =>
      result.status === "TIME_LIMIT_EXCEEDED" || result.status === "ACCEPTED"
        ? "stdout was not bounded: the program wrote until the time limit"
        : null,
  },
  {
    id: "huge-stderr",
    title: "Huge stderr",
    language: "PYTHON",
    source: py(`
import sys
line = "E" * 1023 + "\\n"
while True:
    sys.stderr.write(line)
`),
    expected: ["OUTPUT_LIMIT_EXCEEDED", "RUNTIME_ERROR"],
    violation: ({ result }) =>
      result.status === "TIME_LIMIT_EXCEEDED" || result.status === "ACCEPTED"
        ? "stderr was not bounded: the program wrote until the time limit"
        : null,
  },
  {
    id: "network-internet",
    title: "Internet access (TCP and HTTPS)",
    language: "PYTHON",
    source: py(`
import socket, urllib.request
for host, port in [("1.1.1.1", 53), ("8.8.8.8", 443), ("93.184.215.14", 80)]:
    try:
        socket.create_connection((host, port), timeout=2).close()
        print("OPEN", f"{host}:{port}")
    except Exception as e:
        print("BLOCKED", f"{host}:{port}", type(e).__name__)
try:
    urllib.request.urlopen("https://example.com", timeout=3)
    print("OPEN https://example.com")
except Exception as e:
    print("BLOCKED https://example.com", type(e).__name__)
`),
    expected: ["ACCEPTED"],
    violation: ({ stdout }) => {
      const open = linesStarting(stdout, "OPEN");
      return open.length ? `reached the internet: ${open.join("; ")}` : null;
    },
  },
  {
    id: "network-node",
    title: "Internet access from Node.js",
    language: "JAVASCRIPT",
    source: `
const net = require("net");
const probe = (host, port) => new Promise((done) => {
  const s = net.connect({ host, port, timeout: 2000 });
  s.on("connect", () => { console.log("OPEN", host + ":" + port); s.destroy(); done(); });
  s.on("timeout", () => { console.log("BLOCKED", host + ":" + port, "timeout"); s.destroy(); done(); });
  s.on("error", (e) => { console.log("BLOCKED", host + ":" + port, e.code); done(); });
});
(async () => { await probe("1.1.1.1", 443); await probe("8.8.8.8", 53); })();
`,
    expected: ["ACCEPTED"],
    violation: ({ stdout }) => {
      const open = linesStarting(stdout, "OPEN");
      return open.length ? `reached the internet: ${open.join("; ")}` : null;
    },
  },
  {
    id: "network-local-services",
    title: "Localhost and internal services (Judge0, Postgres, Redis, Docker)",
    language: "PYTHON",
    source: py(`
import socket
targets = [("127.0.0.1", p) for p in (22, 80, 443, 2358, 2375, 2376, 5432, 6379)]
targets += [(h, p) for h in ("db", "redis", "server", "judge0", "host.docker.internal", "172.17.0.1") for p in (5432, 6379, 2358, 2375)]
for host, port in targets:
    try:
        socket.create_connection((host, port), timeout=1).close()
        print("OPEN", f"{host}:{port}")
    except Exception as e:
        print("BLOCKED", f"{host}:{port}", type(e).__name__)
`),
    expected: ["ACCEPTED"],
    violation: ({ stdout }) => {
      const open = linesStarting(stdout, "OPEN");
      return open.length ? `reached an internal service: ${open.join("; ")}` : null;
    },
  },
  {
    id: "cloud-metadata",
    title: "Cloud metadata endpoint",
    language: "PYTHON",
    source: py(`
import urllib.request
for url in ["http://169.254.169.254/hetzner/v1/metadata", "http://169.254.169.254/latest/meta-data/"]:
    try:
        body = urllib.request.urlopen(url, timeout=2).read(200)
        print("OPEN", url, body[:60])
    except Exception as e:
        print("BLOCKED", url, type(e).__name__)
`),
    expected: ["ACCEPTED"],
    violation: ({ stdout }) => {
      const open = linesStarting(stdout, "OPEN");
      return open.length ? `reached the metadata service: ${open.join("; ")}` : null;
    },
  },
  {
    id: "dns",
    title: "DNS resolution",
    language: "PYTHON",
    source: py(`
import socket
for name in ["example.com", "judge0.com", "metadata.google.internal"]:
    try:
        print("RESOLVED", name, socket.getaddrinfo(name, 80)[0][4][0])
    except Exception as e:
        print("BLOCKED", name, type(e).__name__)
`),
    expected: ["ACCEPTED"],
    violation: ({ stdout }) => {
      const resolved = linesStarting(stdout, "RESOLVED");
      return resolved.length ? `DNS works: ${resolved.join("; ")}` : null;
    },
  },
  {
    id: "env-dump",
    title: "Environment-variable enumeration",
    language: "PYTHON",
    source: py(`
import os
for key in sorted(os.environ):
    print("ENV", key, "=", os.environ[key][:80])
`),
    expected: ["ACCEPTED"],
    violation: ({ stdout }) => {
      const leaked = linesStarting(stdout, "ENV ").filter((line) => SECRET_NAME.test(line));
      return leaked.length
        ? `secret-looking variables visible: ${leaked.map((l) => l.split(" ")[1]).join(", ")}`
        : null;
    },
  },
  {
    id: "filesystem-read",
    title: "Filesystem traversal and sensitive reads",
    language: "PYTHON",
    source: py(`
import os
targets = ["/judge0.conf", "/api/judge0.conf", "/etc/shadow", "/root/.ssh/authorized_keys",
           "/home", "/proc/1/environ", "/var/run/docker.sock", "/run/docker.sock",
           "/etc/hostname", "/box/../../etc/shadow", "../../../../judge0.conf"]
for path in targets:
    try:
        if os.path.isdir(path):
            print("READABLE_DIR", path, os.listdir(path)[:5])
        else:
            with open(path, "rb") as f:
                f.read(64)
            print("READABLE", path)
    except Exception as e:
        print("DENIED", path, type(e).__name__)
print("EXISTS_DOCKER_SOCK", os.path.exists("/var/run/docker.sock") or os.path.exists("/run/docker.sock"))
`),
    expected: ["ACCEPTED"],
    violation: ({ stdout }) => {
      const forbidden = [
        "/judge0.conf",
        "/api/judge0.conf",
        "/etc/shadow",
        "/root/.ssh/authorized_keys",
        "/proc/1/environ",
        "/var/run/docker.sock",
        "/run/docker.sock",
        "/box/../../etc/shadow",
        "../../../../judge0.conf",
      ];
      const hits = stdout
        .split("\n")
        .filter((l) => l.startsWith("READABLE"))
        .map((l) => l.split(" ")[1]!)
        .filter((path) => forbidden.includes(path));
      if (stdout.includes("EXISTS_DOCKER_SOCK True")) hits.push("docker socket exists");
      return hits.length ? `sensitive paths readable: ${hits.join(", ")}` : null;
    },
  },
  {
    id: "filesystem-write",
    title: "Writes outside the working directory",
    language: "PYTHON",
    source: py(`
import os
for path in ["/hostile-probe", "/etc/hostile-probe", "/usr/hostile-probe", "/bin/hostile-probe",
             "/var/hostile-probe", "/box/../hostile-probe", "/tmp/hostile-probe", "hostile-probe"]:
    try:
        with open(path, "w") as f:
            f.write("x")
        print("WRITABLE", path)
        os.remove(path)
    except Exception as e:
        print("DENIED", path, type(e).__name__)
`),
    expected: ["ACCEPTED"],
    violation: ({ stdout }) => {
      // The working directory and /tmp inside the box are the program's own.
      const allowed = new Set(["hostile-probe", "/tmp/hostile-probe"]);
      const bad = linesStarting(stdout, "WRITABLE")
        .map((l) => l.split(" ")[1]!)
        .filter((path) => !allowed.has(path));
      return bad.length ? `wrote outside the sandbox: ${bad.join(", ")}` : null;
    },
  },
  {
    id: "large-file",
    title: "Large file creation",
    language: "PYTHON",
    source: py(`
with open("big.bin", "wb") as f:
    for i in range(200):
        f.write(b"A" * (1024 * 1024))
        print("WROTE_MB", i + 1, flush=True)
`),
    expected: ["OUTPUT_LIMIT_EXCEEDED"],
    violation: ({ stdout }) => {
      const mb = linesStarting(stdout, "WROTE_MB").length;
      return mb > 2 ? `wrote ${mb} MB past a 1 MB file limit` : null;
    },
  },
  {
    id: "process-spawn",
    title: "Process spawning",
    language: "PYTHON",
    source: py(`
import subprocess
started = 0
procs = []
for i in range(200):
    try:
        procs.append(subprocess.Popen(["sleep", "5"]))
        started += 1
    except Exception as e:
        print("REFUSED_AT", i, type(e).__name__)
        break
print("STARTED", started)
for p in procs:
    p.kill()
`),
    expected: ["ACCEPTED", "RUNTIME_ERROR"],
    violation: ({ stdout }) => {
      const started = Number(linesStarting(stdout, "STARTED")[0]?.split(" ")[1] ?? 0);
      return started > 60 ? `started ${started} processes past a limit of 60` : null;
    },
    heavy: true,
  },
  {
    id: "fork-bomb",
    title: "Fork bomb",
    language: "CPP",
    source: String.raw`
#include <unistd.h>
int main() { for (;;) fork(); }
`,
    expected: ["TIME_LIMIT_EXCEEDED", "RUNTIME_ERROR"],
    violation: ({ result }) =>
      result.status === "ACCEPTED" ? "a fork bomb exited normally" : null,
    heavy: true,
  },
  {
    id: "shell-exec",
    title: "Shell execution and privileges",
    language: "PYTHON",
    source: py(`
import os, subprocess
print("UID", os.getuid(), "EUID", os.geteuid())
out = subprocess.run(["/bin/sh", "-c", "id; grep -E '^Cap(Eff|Bnd)' /proc/self/status"], capture_output=True, text=True, timeout=5)
print(out.stdout.strip())
try:
    os.setuid(0)
    print("SETUID_ROOT_OK")
except Exception as e:
    print("SETUID_DENIED", type(e).__name__)
`),
    expected: ["ACCEPTED", "RUNTIME_ERROR"],
    violation: ({ stdout }) => {
      if (/^UID 0 /m.test(stdout) || / EUID 0$/m.test(stdout)) return "code runs as root";
      if (stdout.includes("SETUID_ROOT_OK")) return "code could become root";
      const capEff = /CapEff:\s*([0-9a-f]+)/.exec(stdout)?.[1];
      return capEff && /[1-9a-f]/.test(capEff) ? `non-empty effective capabilities ${capEff}` : null;
    },
  },
  {
    id: "process-inspection",
    title: "Parent process and /proc inspection",
    language: "PYTHON",
    source: py(`
import os
pids = sorted(int(p) for p in os.listdir("/proc") if p.isdigit())
print("VISIBLE_PIDS", len(pids), pids[:20])
print("PPID", os.getppid())
for pid in pids:
    try:
        cmd = open(f"/proc/{pid}/cmdline", "rb").read().replace(b"\\0", b" ").decode(errors="replace")[:120]
        print("CMD", pid, cmd)
    except Exception as e:
        print("CMD_DENIED", pid, type(e).__name__)
for path in ["/proc/kcore", "/proc/sysrq-trigger", "/sys/kernel/debug"]:
    try:
        open(path, "rb").read(1)
        print("READABLE", path)
    except Exception as e:
        print("DENIED", path, type(e).__name__)
`),
    expected: ["ACCEPTED"],
    violation: ({ stdout }) => {
      const problems: string[] = [];
      const foreign = linesStarting(stdout, "CMD ").filter((l) =>
        /ruby|rails|puma|resque|judge0|postgres|redis|dockerd|containerd|systemd|sshd|caddy/i.test(l)
      );
      if (foreign.length) problems.push(`sees host/service processes: ${foreign.join("; ")}`);
      if (/READABLE \/proc\/kcore|READABLE \/proc\/sysrq-trigger/.test(stdout)) {
        problems.push("kernel interfaces readable");
      }
      return problems.length ? problems.join(" | ") : null;
    },
  },
  {
    id: "container-inspection",
    title: "Container and host inspection",
    language: "PYTHON",
    source: py(`
import os, socket
print("HOSTNAME", socket.gethostname())
print("DOCKERENV", os.path.exists("/.dockerenv"))
for path in ["/proc/1/cgroup", "/proc/self/mountinfo"]:
    try:
        lines = open(path).read().splitlines()
        print("FILE", path, len(lines), "lines")
        for line in lines[:15]:
            print("  ", line[:140])
    except Exception as e:
        print("DENIED", path, type(e).__name__)
try:
    print("SYS_CGROUP", os.listdir("/sys/fs/cgroup")[:10])
except Exception as e:
    print("DENIED /sys/fs/cgroup", type(e).__name__)
`),
    expected: ["ACCEPTED", "RUNTIME_ERROR"],
    // Informational: what the program can learn about where it runs. The
    // binding properties are covered by the filesystem and process cases.
    violation: ({ stdout }) =>
      /\/var\/run\/docker\.sock|\/run\/docker\.sock/.test(stdout)
        ? "docker socket visible in the mount table"
        : null,
  },
  {
    id: "compile-bomb",
    title: "Compile bomb",
    language: "CPP",
    source: String.raw`
template <int N> struct Bomb { static const long v = Bomb<N - 1>::v + Bomb<N - 2>::v; };
template <> struct Bomb<1> { static const long v = 1; };
template <> struct Bomb<0> { static const long v = 1; };
#include "/dev/urandom"
int main() { return Bomb<100000>::v > 0; }
`,
    expected: ["COMPILE_ERROR", "TIME_LIMIT_EXCEEDED", "RUNTIME_ERROR"],
    violation: ({ result }) =>
      result.status === "ACCEPTED" ? "a compile bomb compiled and ran" : null,
    heavy: true,
  },
  {
    id: "java-threads",
    title: "Java thread exhaustion",
    language: "JAVA",
    source: `
public class Main {
  public static void main(String[] args) throws Exception {
    int started = 0;
    try {
      for (int i = 0; i < 5000; i++) {
        Thread t = new Thread(() -> { try { Thread.sleep(20000); } catch (InterruptedException e) {} });
        t.setDaemon(true);
        t.start();
        started++;
      }
    } catch (Throwable e) {
      System.out.println("REFUSED " + e.getClass().getSimpleName());
    }
    System.out.println("THREADS " + started);
    System.exit(0);
  }
}
`,
    expected: ["ACCEPTED", "RUNTIME_ERROR", "MEMORY_LIMIT_EXCEEDED"],
    violation: ({ stdout }) => {
      const threads = Number(linesStarting(stdout, "THREADS")[0]?.split(" ")[1] ?? 0);
      // The JVM's own threads count against the same limit.
      return threads > 60 ? `started ${threads} threads past a limit of 60` : null;
    },
    heavy: true,
  },
  {
    id: "time-limit-sleep",
    title: "Wall-clock timeout (sleeping, not computing)",
    language: "PYTHON",
    source: py(`
import time
time.sleep(60)
print("WOKE_UP")
`),
    expected: ["TIME_LIMIT_EXCEEDED"],
    violation: ({ stdout }) =>
      stdout.includes("WOKE_UP") ? "slept 60 s past a 10 s wall-clock limit" : null,
  },
];

/** A program every healthy runner executes correctly; run after each case. */
export const CANARY = {
  language: "PYTHON" as Language,
  source: 'print("canary-ok")\n',
  expect: "canary-ok",
};
