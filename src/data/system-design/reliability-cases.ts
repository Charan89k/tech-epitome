import {
  arch,
  code,
  compare,
  concept,
  h2,
  h3,
  insight,
  note,
  ol,
  p,
  rp,
  table,
  tip,
  ul,
  warn,
  worked,
  type SectionSeed,
} from "@/data/curriculum/types";

/**
 * Reliability, then worked interview case studies.
 *
 * The reliability chapters build on "CAP and Consistency Models" and
 * "Queues and Event-Driven Work": they assume the reader already knows that
 * the network is between the components and that delivery is at least once,
 * and they ask what to do about it. The case studies then spend the whole
 * track's vocabulary on six full designs, each in the order a strong
 * interview answer takes.
 *
 * Every number in a case study is an illustrative assumption, worked as
 * arithmetic, and none of them describes how any real company built
 * anything. All prose original.
 */

const RELIABILITY: SectionSeed = {
  slug: "reliability",
  title: "Reliability",
  summary:
    "Keeping a system correct when its parts are slow, dead or disagreeing: timeouts and retries, consensus, and recovering from the failures you could not prevent.",
  chapters: [
    {
      slug: "timeouts-retries-idempotency",
      title: "Timeouts, Retries and Idempotency",
      summary:
        "A remote call can succeed, fail, or leave you not knowing. Most reliability bugs live in the third case.",
      difficulty: "MEDIUM",
      readingMinutes: 13,
      objectives: [
        "Set a timeout from a latency budget rather than from a library default",
        "Retry with exponential backoff and jitter, and only the failures worth retrying",
        "Explain how retries at several layers multiply into a retry storm",
        "Make a non-idempotent operation safe to retry with an idempotency key",
      ],
      keyTakeaways: [
        "A timeout does not mean the operation failed. It means you do not know, and your design must allow for it having succeeded.",
        "Back off exponentially and add jitter, or every client retries in lockstep and the recovery gets knocked over again.",
        "Retry at one layer, with a budget. Retries at every layer multiply.",
        "Retries are only safe when the operation is idempotent, and an idempotency key is how you make it so.",
      ],
      content: [
        h2("Every remote call has three outcomes"),
        p(
          "An in-process function call either returns or throws. A call over the network has a third outcome, and it is the one that causes the trouble: you sent the request, and nothing came back in time. The request may never have arrived. It may have arrived and failed. Or it may have arrived, succeeded completely, and the response is what got lost."
        ),
        concept(
          "The unknown outcome",
          "From the caller's side, a lost request and a lost response look identical. A timeout therefore never tells you the work did not happen. Any design that treats 'timed out' as 'failed' will, eventually, do something twice."
        ),
        p(
          "This chapter is about living with that. Timeouts decide how long you are willing to not know. Retries decide what you do next. Idempotency is what makes doing it again harmless."
        ),
        h2("Choosing a timeout"),
        p(
          "A call with no timeout waits forever, and a thread or connection waiting forever is a resource that never comes back. Many client libraries default to no timeout, or to one measured in minutes, which in practice is the same thing during an incident."
        ),
        rp(
          "Two numbers decide a sensible value. From below: the downstream's own latency, usually its ",
          { strong: "p99 or p99.9" },
          " plus some headroom, so that healthy-but-slow requests are not cut off. From above: the ",
          { strong: "deadline" },
          " of whoever called you. There is no point waiting two seconds for a dependency when your own caller gave up after one."
        ),
        worked(
          "A user-facing request with a 1,000 ms deadline passes through a gateway, then service A, then service B. Latencies are illustrative.",
          "B is called with roughly 600 ms left, not with its own fixed 2,000 ms timeout.",
          [
            {
              state: "Gateway receives request, deadline = now + 1,000 ms",
              note: "The deadline is attached to the request, as an absolute time or a remaining budget.",
            },
            {
              state: "Gateway spends 50 ms on auth, forwards with ~950 ms remaining",
              note: "Each hop subtracts what it has used before passing the budget on.",
            },
            {
              state:
                "Service A spends 300 ms on its own work, calls B with ~650 ms remaining",
              note: "A sets B's timeout to the smaller of B's usual budget and what is left, minus a little to build a response.",
            },
            {
              state: "B is slow; A gives up at ~600 ms and returns a degraded answer",
              note: "Nobody keeps working on a request whose user has already been told it failed.",
            },
          ],
          "Deadline propagation"
        ),
        warn(
          "Distinguish the connect timeout from the read timeout. Connecting to a healthy host takes milliseconds, so a long connect timeout only delays discovering that a host is gone. A short connect timeout and a read timeout sized to the work is the usual shape.",
          "Two timeouts, not one"
        ),
        h2("Retrying, and what to retry"),
        p(
          "Many failures are transient: a host restarting, a brief network blip, a load balancer that has not yet noticed an instance went away. Trying again a moment later often works. But some failures will fail identically every time, and retrying those only adds load."
        ),
        table(
          ["Failure", "Retry?", "Why"],
          [
            [
              "Connection refused / reset",
              "Yes",
              "Usually a host going away; another attempt may land elsewhere",
            ],
            ["Timeout", "Only if idempotent", "The first attempt may have succeeded"],
            [
              "503 Service Unavailable",
              "Yes, with backoff",
              "The server is telling you it is temporarily overloaded",
            ],
            [
              "429 Too Many Requests",
              "Yes, after Retry-After",
              "You were rate limited; respect the hint",
            ],
            [
              "400 / 422 validation error",
              "No",
              "The same input will fail the same way",
            ],
            ["401 / 403", "No", "Credentials will not fix themselves in 200 ms"],
            [
              "409 Conflict",
              "Usually not blindly",
              "Re-read state and decide; a blind retry repeats the conflict",
            ],
          ],
          "Retry what is transient. Surface what is not."
        ),
        h3("Exponential backoff with jitter"),
        p(
          "Retrying immediately turns one failure into a burst of identical requests aimed at something that is already struggling. Backoff spaces the attempts out: wait a base delay, then double it each time, up to a cap. That gives a struggling dependency progressively more room."
        ),
        p(
          "Backoff alone is not enough. If ten thousand clients all failed at the same instant, they all wait 100 ms, all retry together, all wait 200 ms, all retry together. The waves stay synchronised. Jitter randomises each wait so the retries spread across the window instead of arriving as a wall."
        ),
        code(
          "typescript",
          `// "Full jitter": a random wait between zero and the exponential ceiling.
async function withRetry<T>(
  call: (signal: AbortSignal) => Promise<T>,
  { attempts = 4, baseMs = 100, capMs = 5_000, deadline = Date.now() + 3_000 } = {}
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      const remaining = deadline - Date.now();
      return await call(AbortSignal.timeout(Math.max(remaining, 0)));
    } catch (error) {
      if (attempt + 1 >= attempts || !isRetryable(error)) throw error;
      const ceiling = Math.min(capMs, baseMs * 2 ** attempt);
      const wait = Math.random() * ceiling;
      if (Date.now() + wait >= deadline) throw error; // no budget left
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
}`,
          "Bounded attempts, a cap on the wait, jitter, and respect for the caller's deadline.",
          [10, 11, 12]
        ),
        insight(
          "Jitter matters most exactly when things are worst. A dependency that recovers is met by every client that gave up on it, and without jitter they arrive in the same millisecond and knock it over again. Randomising the wait turns that spike into a ramp.",
          "Why jitter is not optional"
        ),
        h2("Retry storms"),
        p(
          "Retries multiply across layers. Suppose a request passes through three services, each of which makes up to four attempts (one try plus three retries) at the layer below. If the bottom layer is failing, one user request becomes 4 × 4 × 4 = 64 calls to the bottom layer. The service that is already overwhelmed receives sixty-four times the load at the moment it can least absorb it."
        ),
        ul(
          "Retry at one layer only, usually the one closest to the caller who can decide what failure means. Inner layers fail fast and report.",
          "Use a retry budget: allow retries to add at most, say, ten percent on top of normal traffic. Once the budget is spent, fail instead of retrying.",
          "Honour Retry-After and 503s. A server that says 'not now' is giving you the information you need to not make things worse.",
          "Pair retries with a circuit breaker, covered in 'Failure Modes and Disaster Recovery', so a dependency that is clearly down stops receiving attempts at all."
        ),
        h2("Idempotency makes retries safe"),
        p(
          "An operation is idempotent if doing it twice has the same effect as doing it once. 'Set the shipping address to X' is idempotent. 'Delete order 42' is idempotent in its effect. 'Charge this card $20' and 'append this message' are not: a retry after a lost response charges twice or posts twice."
        ),
        concept(
          "Idempotency key",
          "A unique value the client generates once per logical operation and sends with every attempt of it. The server records the key alongside the result; a repeat with the same key returns the stored result instead of doing the work again. The client decides what counts as 'the same operation', which is the only party that can."
        ),
        arch(
          {
            nodes: [
              {
                id: "client",
                kind: "client",
                label: "Client",
                note: "one key per logical operation",
              },
              {
                id: "api",
                kind: "api",
                label: "API",
                note: "checks key before acting",
              },
              {
                id: "keys",
                kind: "database",
                label: "Idempotency records",
                note: "key, request hash, status, response",
              },
              { id: "svc", kind: "service", label: "Order Service" },
              { id: "db", kind: "database", label: "Orders DB" },
            ],
            edges: [
              {
                id: "e1",
                from: "client",
                to: "api",
                label: "POST + Idempotency-Key",
                kind: "sync",
              },
              {
                id: "e2",
                from: "api",
                to: "keys",
                label: "insert-if-absent",
                kind: "sync",
              },
              { id: "e3", from: "api", to: "svc", label: "only if new", kind: "sync" },
              { id: "e4", from: "svc", to: "db", kind: "sync" },
            ],
          },
          "The key check happens before any side effect, and the stored response answers every repeat."
        ),
        ol(
          "Atomically insert the key with status IN_PROGRESS and a hash of the request body. If the insert succeeds, this attempt owns the operation.",
          "If the key already exists and is COMPLETED, return the stored response. Do not do the work again.",
          "If it exists and is IN_PROGRESS, another attempt is still running: return a 409 or ask the client to retry later.",
          "If it exists with a different request hash, the client reused a key for a different operation: reject it loudly.",
          "When the work finishes, store the response and mark the key COMPLETED. Expire records after a window longer than any client will keep retrying."
        ),
        warn(
          "The key record and the side effect must commit together. If you mark the key complete in one store and write the order in another, a crash between the two leaves them disagreeing. Put both in one database transaction where you can; where you cannot, make the side effect itself keyed on the idempotency key so a repeat is a no-op.",
          "Check and act atomically"
        ),
        compare(
          [
            {
              label: "Retry blindly",
              time: "No extra work per request",
              space: "Nothing stored",
              when: "Only for operations that are naturally idempotent, like a full overwrite of a value or a read.",
            },
            {
              label: "Natural-key upsert",
              time: "One unique-index check",
              space: "A unique constraint",
              when: "When the data already has a business key that identifies the operation, such as one invoice per order per month.",
            },
            {
              label: "Client idempotency key",
              time: "One lookup and one insert",
              space: "A record per key, until expiry",
              when: "For anything that creates or moves something - payments, orders, messages - where duplicates are expensive.",
              preferred: true,
            },
          ],
          "Three ways to make a retry harmless"
        ),
        h2("Common mistakes"),
        ul(
          "Generating a new idempotency key on each retry. The key must be created once per logical operation and reused across every attempt, or it deduplicates nothing.",
          "Retrying on the server side of a timeout that the client also retries, so both layers multiply.",
          "Treating 'at-least-once' consumers as exactly-once because duplicates are rare in testing. They are rare until the first network incident.",
          "Setting the timeout on the client but not cancelling the work on the server, which keeps computing a response nobody will read."
        ),
        tip(
          "In an interview, the sentence 'the client sends an idempotency key, so the retry after a timeout returns the original result' answers a whole class of follow-up questions before they are asked."
        ),
      ],
    },
    {
      slug: "consensus-and-leader-election",
      title: "Consensus and Leader Election",
      summary:
        "Getting several machines to agree on one fact, even when some are dead and the rest cannot tell which.",
      difficulty: "HARD",
      readingMinutes: 15,
      objectives: [
        "Explain why agreement is hard when slow and dead are indistinguishable",
        "Use majority quorums to reason about how many failures a cluster survives",
        "Describe leases, terms and fencing tokens, and the failure each one guards against",
        "State what a Raft-style protocol guarantees and what it costs",
      ],
      keyTakeaways: [
        "Any two majorities overlap, which is why a majority can make a decision that no other group can contradict.",
        "A cluster of 2f + 1 nodes survives f failures. Even-sized clusters add cost without adding tolerance.",
        "A leader can be deposed without knowing it, so storage must reject stale leaders by term or fencing token.",
        "Consensus buys safety at the price of a majority round trip per decision. Use it for small, important metadata, not for your bulk data path.",
      ],
      content: [
        h2("Why agreement is hard"),
        p(
          "'CAP and Consistency Models' warned that coordination is expensive. This chapter is about why it is also subtle. Imagine three servers that must agree on which of them is the primary for a database. If messages were instant and machines never failed, one would announce itself and that would be that."
        ),
        p(
          "Real networks delay and drop messages, and real machines pause: a long garbage-collection pause, a VM migration, a disk that hangs for twenty seconds. A node that has not heard from the primary cannot tell whether the primary is dead, slow, or simply cut off from it. Any rule like 'if I have not heard from the leader in five seconds, I become leader' can produce two leaders, because the old one may be very much alive on the other side of a partition."
        ),
        concept(
          "The core difficulty",
          "In a fully asynchronous network, where messages can take arbitrarily long, no deterministic protocol can guarantee that agreement is always reached if even one node may crash. Practical protocols respond by never compromising safety - they never decide two different things - and by relying on timeouts for progress, which they make whenever the network behaves reasonably."
        ),
        h2("What consensus provides"),
        p(
          "A consensus protocol lets a group of nodes agree on a value, or on a sequence of values, such that:"
        ),
        ul(
          "Agreement: no two nodes ever decide different values.",
          "Validity: the decided value was actually proposed by someone, not invented.",
          "Durability: once decided, a value stays decided, even if nodes crash and restart.",
          "Progress: a decision is eventually reached as long as a majority is up and can talk to each other."
        ),
        p(
          "Agreeing on a sequence of values is the useful form. If every node applies the same commands in the same order, every node ends up in the same state. That is a replicated state machine, and it is how leader election, configuration stores, lock services and strongly consistent metadata are built."
        ),
        h2("Quorums: why majorities work"),
        p(
          "The trick at the heart of every consensus protocol is the majority quorum. A decision counts only once more than half of the nodes have accepted it. Any two majorities of the same group must share at least one node, so any later majority includes at least one node that knows about the earlier decision. Two conflicting decisions can never both collect a majority."
        ),
        table(
          ["Cluster size", "Majority", "Failures tolerated"],
          [
            ["1", "1", "0"],
            ["2", "2", "0"],
            ["3", "2", "1"],
            ["4", "3", "1"],
            ["5", "3", "2"],
            ["7", "4", "3"],
          ],
          "A cluster of 2f + 1 nodes tolerates f failures. Going from 3 to 4 adds a machine and no tolerance."
        ),
        insight(
          "Most deployments use three or five nodes. Three survives one failure, which covers routine maintenance. Five survives two, so a node can be down for maintenance while another fails unexpectedly. Larger groups make every decision slower, because each one waits for more acknowledgements.",
          "Why three or five"
        ),
        h2("Partitions and split brain"),
        p(
          "Split brain is two nodes both believing they are the leader and both accepting writes. Majorities prevent it. When a five-node cluster is cut into a group of three and a group of two, only the side with three can form a majority. The side with two can keep its old data readable if it chooses, but it cannot elect a leader or commit anything."
        ),
        arch(
          {
            nodes: [
              { id: "clientA", kind: "client", label: "Clients (side A)" },
              {
                id: "n1",
                kind: "database",
                label: "Node 1",
                note: "new leader, term 8",
                group: "Majority side (3 of 5)",
              },
              {
                id: "n2",
                kind: "database",
                label: "Node 2",
                group: "Majority side (3 of 5)",
              },
              {
                id: "n3",
                kind: "database",
                label: "Node 3",
                group: "Majority side (3 of 5)",
              },
              {
                id: "n4",
                kind: "database",
                label: "Node 4",
                note: "old leader, term 7",
                group: "Minority side (2 of 5)",
              },
              {
                id: "n5",
                kind: "database",
                label: "Node 5",
                group: "Minority side (2 of 5)",
              },
            ],
            edges: [
              { id: "e1", from: "clientA", to: "n1", label: "writes", kind: "sync" },
              {
                id: "r1",
                from: "n1",
                to: "n2",
                label: "replicate",
                kind: "replication",
              },
              {
                id: "r2",
                from: "n1",
                to: "n3",
                label: "replicate",
                kind: "replication",
              },
              {
                id: "r3",
                from: "n4",
                to: "n5",
                label: "cannot reach a majority",
                kind: "replication",
              },
            ],
          },
          "During a partition only the side holding a majority can commit. The old leader on the minority side can no longer get anything acknowledged."
        ),
        h2("Leases, terms and fencing"),
        p(
          "Majority voting stops two leaders from committing in the same term. It does not stop an old leader from believing it is still in charge. That is the job of three related ideas."
        ),
        ul(
          "A term (or epoch) is a number that increases with every election. Every message carries it, and a node that sees a higher term than its own immediately steps down.",
          "A lease is leadership granted for a limited time. The leader must renew it before it expires, and it stops acting as leader when its lease runs out, by its own clock, with a safety margin.",
          "A fencing token is the term handed to whatever the leader writes to. The storage remembers the highest token it has seen and refuses writes carrying a lower one."
        ),
        worked(
          "Leader A holds a lease in term 7. It then stalls in a 20-second pause while its lease is 10 seconds long.",
          "A's late write is rejected. Data written by B is safe.",
          [
            {
              state: "t = 0 s: A is leader, term 7, writes with token 7",
              note: "Storage records 7 as the highest token seen.",
            },
            {
              state: "t = 1 s: A freezes (a long GC pause)",
              note: "A does not know it is frozen; from its point of view no time passes.",
            },
            {
              state: "t = 11 s: A's lease expires; followers elect B in term 8",
              note: "B writes with token 8. Storage's highest token is now 8.",
            },
            {
              state:
                "t = 21 s: A wakes and sends the write it was about to make, with token 7",
              note: "Storage compares 7 to 8 and rejects it. A learns it is no longer leader and steps down.",
            },
          ],
          "Why the storage has to check"
        ),
        warn(
          "A lease protects you only if clocks drift by a bounded amount and the holder checks its lease before every action. A pause between checking and acting defeats it, which is exactly the scenario above. Leases make stale leaders rare; fencing tokens make them harmless. Use both.",
          "Leases alone are not enough"
        ),
        h2("What a Raft-style protocol guarantees"),
        p(
          "Raft is a widely taught consensus protocol designed to be understandable, and the protocols in its family share a shape that is worth knowing at the conceptual level, without memorising message formats."
        ),
        ol(
          "Leader election. Followers wait a randomised timeout for a heartbeat. One that hears nothing becomes a candidate, increments the term and asks for votes. A node votes once per term, and only for a candidate whose log is at least as up to date as its own. A majority of votes makes a leader.",
          "Log replication. Clients send commands to the leader. The leader appends each command to its log and sends it to followers. Once a majority have stored the entry, it is committed, and the leader applies it and replies.",
          "Safety. Because a candidate must have an up-to-date log to win, and a committed entry is on a majority, every future leader already holds every committed entry. Committed entries are never lost or reordered.",
          "State machine. Every node applies committed entries in log order, so every node reaches the same state."
        ),
        table(
          ["Property", "Guaranteed?", "Notes"],
          [
            [
              "Committed entries survive minority failures",
              "Yes",
              "They are on a majority, and any new leader has them",
            ],
            ["Same order on every node", "Yes", "The log defines the order"],
            [
              "Progress with a majority down",
              "No",
              "Safety is kept by refusing to decide anything",
            ],
            [
              "Low-latency writes across regions",
              "No",
              "Each commit waits for a majority round trip",
            ],
            [
              "Linearizable reads from any node",
              "No",
              "A follower may lag; the leader must confirm it still leads before answering",
            ],
          ],
          "What you get, and what you still have to design for."
        ),
        note(
          "Randomised election timeouts are a small detail with a large effect. If every follower timed out at the same moment, they would all stand as candidates, split the vote, and repeat. Randomising the timeout means one usually starts first and wins before the others wake up."
        ),
        h2("Using consensus without building it"),
        p(
          "Implementing consensus correctly is a research-grade task. In practice you use a coordination service built on it - systems such as etcd and ZooKeeper are common examples - and put a small amount of important state there: who the leader is, which node owns which partition, configuration flags, membership."
        ),
        compare(
          [
            {
              label: "Static primary, manual failover",
              time: "Failover waits for a human",
              space: "No extra nodes",
              when: "Small systems where minutes of write downtime during a rare failure is acceptable and simplicity matters most.",
            },
            {
              label: "Consensus-managed leader election",
              time: "Failover in seconds",
              space: "3 or 5 coordination nodes",
              when: "When one writer must exist at a time and failover must be automatic without ever producing two writers.",
              preferred: true,
            },
            {
              label: "Leaderless quorum replication",
              time: "No failover step at all",
              space: "N replicas per key",
              when: "When write availability matters more than a single order of writes, and conflicts can be detected and merged.",
            },
          ],
          "Three ways to decide who may write"
        ),
        h2("Common mistakes"),
        ul(
          "Putting the bulk data path through consensus. Every write pays a majority round trip; reserve it for metadata and decisions.",
          "Running two coordination nodes 'for redundancy'. Two nodes need both to form a majority, so either failing stops everything.",
          "Spreading a five-node group across two data centres three and two. Lose the one with three and the survivors cannot form a majority. Use three sites.",
          "Trusting a lock or leadership flag without a fencing token on the resource it protects."
        ),
      ],
    },
    {
      slug: "failure-modes-and-disaster-recovery",
      title: "Failure Modes and Disaster Recovery",
      summary:
        "Containing the failures you cannot prevent, and getting back from the ones you could not contain.",
      difficulty: "HARD",
      readingMinutes: 15,
      objectives: [
        "Limit blast radius with cells, staged rollouts and isolated dependencies",
        "Stop a cascading failure with circuit breakers, bulkheads and load shedding",
        "Set RPO and RTO targets and pick a recovery strategy that meets them",
        "Explain why replicas are not backups, and what multi-region actually costs",
      ],
      keyTakeaways: [
        "At scale something is always broken. Design so that a failure is small, not so that failures do not happen.",
        "Cascades spread through waiting. Circuit breakers stop the waiting; bulkheads stop it spreading.",
        "RPO is how much data you can lose; RTO is how long you can be down. Each recovery strategy buys a point on both.",
        "A replica faithfully copies your mistakes. Only a point-in-time backup undoes them, and only a tested restore proves you have one.",
      ],
      content: [
        h2("Failure is the normal case"),
        p(
          "A single server failing is an unusual event. A fleet of thousands of components having something broken right now is the usual state of affairs. As an illustrative assumption, say each of 1,000 disks has a 2% chance of failing in a year. You should then expect around 20 disk failures a year, roughly one every two to three weeks, on a completely healthy fleet."
        ),
        p(
          "The goal therefore is not a system in which nothing fails. It is a system in which a failure stays small, is noticed quickly, and is recovered from without heroics."
        ),
        h2("Blast radius"),
        concept(
          "Blast radius",
          "The share of users or functionality affected when one thing goes wrong. A bad deploy that breaks every customer has a blast radius of one hundred percent; the same bug rolled out to one cell of twenty has five."
        ),
        ul(
          "Cells: split users into independent copies of the stack, each with its own databases and queues, so a fault in one cell does not reach the others.",
          "Staged rollouts: ship code and configuration to a small slice first, watch error rates, then widen. Configuration changes deserve the same care as code; they cause a large share of outages.",
          "Regional and zonal isolation: a dependency in one zone should not be able to take down callers in another.",
          "Limit shared fate: one shared cache cluster, one shared auth service or one global config push quietly joins every component's fate together."
        ),
        h2("Cascading failure"),
        p(
          "Failures spread through waiting. Suppose a recommendations service becomes slow. The product page calls it with a 10-second timeout. Each request now holds a worker thread for ten seconds instead of fifty milliseconds. The product page's thread pool fills, and it stops answering anything, including requests that never needed recommendations. Its callers start waiting on it. One slow, non-essential dependency has taken down the front door."
        ),
        h3("Circuit breakers"),
        p(
          "A circuit breaker wraps calls to a dependency and watches their outcomes. When failures cross a threshold, it stops sending calls for a while and fails them immediately, which frees the caller's resources and gives the dependency room to recover."
        ),
        table(
          ["State", "Behaviour", "Moves to"],
          [
            [
              "Closed",
              "Calls pass through; failures are counted over a window",
              "Open, when the failure rate crosses a threshold",
            ],
            [
              "Open",
              "Calls fail immediately, or return a fallback",
              "Half-open, after a cool-down period",
            ],
            [
              "Half-open",
              "A few trial calls are allowed through",
              "Closed if they succeed, open again if they fail",
            ],
          ],
          "The three states of a circuit breaker."
        ),
        h3("Bulkheads"),
        p(
          "A ship's bulkheads stop one flooded compartment from sinking the ship. In software, a bulkhead gives each dependency its own bounded pool of threads or connections. When recommendations is slow, it can exhaust only the twenty connections reserved for it; checkout and search keep their own pools and carry on."
        ),
        arch(
          {
            nodes: [
              { id: "client", kind: "client", label: "Client" },
              {
                id: "page",
                kind: "api",
                label: "Product Page API",
                note: "separate pool per dependency",
              },
              {
                id: "catalog",
                kind: "service",
                label: "Catalog",
                note: "critical: pool of 100",
              },
              {
                id: "recs",
                kind: "service",
                label: "Recommendations",
                note: "optional: pool of 20, breaker open",
              },
              {
                id: "fallback",
                kind: "cache",
                label: "Popular items cache",
                note: "fallback when breaker is open",
              },
              { id: "db", kind: "database", label: "Catalog DB" },
            ],
            edges: [
              { id: "e1", from: "client", to: "page", kind: "sync" },
              {
                id: "e2",
                from: "page",
                to: "catalog",
                label: "must succeed",
                kind: "sync",
              },
              { id: "e3", from: "page", to: "recs", label: "fail fast", kind: "sync" },
              {
                id: "e4",
                from: "page",
                to: "fallback",
                label: "degraded answer",
                kind: "sync",
              },
              { id: "e5", from: "catalog", to: "db", kind: "sync" },
            ],
          },
          "The optional dependency gets a small pool and a breaker. When it fails, the page shows generic items instead of failing."
        ),
        h3("Load shedding and graceful degradation"),
        p(
          "When demand exceeds capacity, a server that tries to serve everyone serves everyone slowly and then serves no one. Shedding load means rejecting some requests early and cheaply, with a 503, so that the rest complete. Shed the least important traffic first: background refreshes before user requests, anonymous browsing before checkout."
        ),
        insight(
          "Decide in advance which features can be switched off without breaking the product, and build the switch before you need it. 'The page loads without personalised recommendations' is a fine outcome. 'The page does not load' is an outage.",
          "Degrade a feature, not the product"
        ),
        h2("RPO and RTO"),
        p(
          "When something does go badly wrong - a region lost, a database corrupted - two numbers frame the recovery conversation, and they should be agreed with the business before the incident rather than discovered during it."
        ),
        concept(
          "Recovery Point Objective (RPO)",
          "The maximum amount of data, measured in time, you can afford to lose. An RPO of five minutes means that after recovery, at most the last five minutes of writes may be missing."
        ),
        concept(
          "Recovery Time Objective (RTO)",
          "The maximum time the system may be unavailable before it is serving again. An RTO of one hour means users are back within the hour, even if some features are degraded."
        ),
        table(
          ["Strategy", "What stands by", "Typical RPO", "Typical RTO", "Standing cost"],
          [
            [
              "Backup and restore",
              "Backups only",
              "Hours (last backup)",
              "Hours or more",
              "Lowest",
            ],
            [
              "Pilot light",
              "Data replicated; compute off",
              "Minutes",
              "Tens of minutes",
              "Low",
            ],
            [
              "Warm standby",
              "Scaled-down copy running",
              "Seconds to minutes",
              "Minutes",
              "Medium",
            ],
            [
              "Active-active",
              "Full capacity in each region",
              "Near zero to seconds",
              "Near zero",
              "Highest",
            ],
          ],
          "Orders of magnitude only, for illustration. The point is that each step down the table costs more and recovers faster."
        ),
        h2("Backups are not replicas"),
        p(
          "A replica is a live copy that follows the primary within seconds. That is exactly why it is not a backup: when a bad migration drops a column or a bug overwrites a million rows, the replica faithfully applies the same damage a moment later. Replicas protect against losing a machine. Backups protect against losing the data's correctness."
        ),
        p(
          "The standard shape is a periodic full snapshot plus a continuous archive of the database's change log. To recover, restore the most recent snapshot from before the damage and replay the log up to the moment just before it happened. That is point-in-time recovery."
        ),
        worked(
          "A deploy at 14:00 starts corrupting order totals. It is noticed at 16:00. Snapshots are taken nightly at 02:00, and the change log is archived every 5 minutes. The database is 2 TB, and restore throughput is assumed at 500 MB/s.",
          "Data back to 13:59; roughly 70 to 90 minutes to restore, plus the work to re-apply the good writes made after 14:00.",
          [
            {
              state: "Choose the recovery point: 13:59",
              note: "Just before the damage. The log archive's 5-minute interval bounds RPO for a lost-region case, not here.",
            },
            {
              state:
                "Restore the 02:00 snapshot: 2,000,000 MB / 500 MB/s = 4,000 s, about 67 min",
              note: "Restore speed, not backup speed, sets RTO. Measure it.",
            },
            {
              state: "Replay the log from 02:00 to 13:59",
              note: "Twelve hours of changes; time depends on write volume. Budget tens of minutes.",
            },
            {
              state: "Reconcile 14:00 to 16:00",
              note: "Writes in that window mix good orders with bad totals. They must be re-derived, not just discarded.",
            },
          ],
          "Point-in-time recovery, worked"
        ),
        warn(
          "A backup you have never restored is a hypothesis. Restore drills on a schedule are the only way to learn that the backups are incomplete, the credentials have expired, or the restore takes nine hours instead of one - and to learn it on a quiet afternoon rather than during an outage.",
          "Test the restore"
        ),
        h2("Multi-region trade-offs"),
        p(
          "Running in more than one region protects against losing a whole region, and lets users be served from nearby. It also forces the CAP choice into the open, because the distance between regions is now on every cross-region write."
        ),
        compare(
          [
            {
              label: "Single region, multiple zones",
              time: "Writes stay local and fast",
              space: "Replicas in 2-3 zones",
              when: "The default. Survives a machine or a whole zone failing; a full region outage is accepted as rare and slow to recover from.",
              preferred: true,
            },
            {
              label: "Active-passive across regions",
              time: "Local writes; async to standby",
              space: "A second region on standby",
              when: "When a region loss must be survivable within minutes and losing the last few seconds of writes is acceptable.",
            },
            {
              label: "Active-active across regions",
              time: "Cross-region RTT on sync writes",
              space: "Full capacity in each region",
              when: "When users worldwide need local latency and the system can partition data by home region or merge concurrent writes.",
            },
          ],
          "How many regions, and doing what"
        ),
        p(
          "The cost is concrete. If two regions are, say, 70 ms apart, synchronously replicating every write adds at least one 70 ms round trip to it. Replicating asynchronously avoids that, at the price of an RPO: whatever had not crossed when the region was lost is gone. Active-active with both regions accepting writes to the same records needs conflict resolution, which the key-value store case study later in this track works through."
        ),
        h2("Common mistakes"),
        ul(
          "Failover that has never been exercised. The first time a standby is promoted should not be during a real disaster.",
          "A recovery plan that depends on the failed region: runbooks, DNS control or credentials hosted in the place that is down.",
          "Backups stored with the same credentials as production, so the incident that deletes the data can delete the backups too.",
          "Timeouts longer than the caller's, which keep resources tied up long after anyone could use the answer."
        ),
      ],
    },
  ],
};

const CASE_STUDIES: SectionSeed = {
  slug: "interview-case-studies",
  title: "Interview Case Studies",
  summary:
    "Six complete designs, each worked in interview order: requirements, estimates, API, data model, diagram, deep dives, trade-offs and scaling.",
  chapters: [
    // -----------------------------------------------------------------------
    {
      slug: "case-study-news-feed",
      title: "Design a Social News Feed",
      summary:
        "A home timeline of posts from people you follow, and the central choice: do the work when someone posts, or when someone reads?",
      difficulty: "MEDIUM",
      readingMinutes: 16,
      objectives: [
        "Run an interview answer in order, from requirements to scaling",
        "Estimate read and fan-out load and see which one dominates",
        "Choose between fan-out on write and fan-out on read, and combine them for high-follower accounts",
      ],
      keyTakeaways: [
        "Feeds are read far more than they are written, which is the argument for precomputing them at write time.",
        "Precomputing breaks down for accounts with huge followings, so real answers are hybrids.",
        "Store post ids in the feed and hydrate on read, so edits and deletes need no fan-out of their own.",
        "Cursor pagination survives new posts arriving at the top of the feed; offset pagination does not.",
      ],
      content: [
        h2("Clarify the requirements"),
        p(
          "Start by agreeing scope out loud. A news feed can mean anything from a chronological list to a fully ranked stream with ads; the interviewer wants to see you narrow it."
        ),
        ul(
          "Functional: a user can publish a text post, optionally with an image.",
          "Functional: a user can follow and unfollow other users.",
          "Functional: a user sees a home feed of recent posts from people they follow, newest first, paginated.",
          "Out of scope for now: ranking, comments, ads. Mention that ranking would sit on top of the candidate list this design produces."
        ),
        ul(
          "Non-functional: loading the feed is fast; aim for p99 under a few hundred milliseconds.",
          "Non-functional: a new post may take a few seconds to appear for followers. Eventual consistency is acceptable here.",
          "Non-functional: highly available for reads. A feed that is briefly stale is better than one that fails to load."
        ),
        h2("Estimate"),
        note(
          "Every number below is an illustrative assumption chosen to make the arithmetic easy to follow. In an interview, state your assumptions and let the interviewer adjust them."
        ),
        table(
          ["Quantity", "Assumption", "Result"],
          [
            ["Daily active users", "100 million", "-"],
            [
              "Feed loads",
              "10 per user per day",
              "1 billion/day, about 11,600/s average",
            ],
            ["Peak feed loads", "3x average", "about 35,000/s"],
            [
              "Posts",
              "10% of DAU post once a day",
              "10 million/day, about 116/s average",
            ],
            ["Followers per poster", "200 on average", "-"],
            [
              "Feed insertions (fan-out)",
              "10M posts x 200 followers",
              "2 billion/day, about 23,000/s",
            ],
            [
              "Feed cache size",
              "500 entries x 16 bytes per user",
              "8 KB/user, about 800 GB for 100M users",
            ],
          ],
          "Reads outnumber posts about a hundred to one. Fan-out insertions sit in between."
        ),
        p(
          "Two conclusions fall out. First, reads dominate, so making a feed read cheap is worth a lot of write-time work. Second, 800 GB of precomputed feeds is large but comfortably fits in a sharded in-memory cache, so precomputing is feasible."
        ),
        h2("API"),
        code(
          "http",
          `POST /v1/posts
  { "body": "text", "mediaId": "optional" }
  -> 201 { "postId": "p_81f2", "createdAt": "..." }

POST   /v1/users/{userId}/follow      -> 204
DELETE /v1/users/{userId}/follow      -> 204

GET /v1/feed?limit=20&cursor=<opaque>
  -> 200 { "items": [ { "postId", "author", "body", "mediaUrl", "createdAt" } ],
           "nextCursor": "<opaque>" }`,
          "A cursor, not a page number, because new posts keep arriving at the top."
        ),
        h2("Data model"),
        table(
          ["Store", "Key", "Contents", "Notes"],
          [
            [
              "Posts",
              "post_id",
              "author_id, body, media_url, created_at",
              "Source of truth for content",
            ],
            [
              "Follows",
              "(follower_id, followee_id)",
              "created_at",
              "Indexed both ways: who I follow, who follows me",
            ],
            [
              "Feed cache",
              "user_id",
              "List of (post_id, created_at), newest first, capped at ~500",
              "Derived; can be rebuilt",
            ],
            [
              "Post cache",
              "post_id",
              "Rendered post content",
              "Shared hot set for hydration",
            ],
          ],
          "The feed holds only ids. Content lives in one place."
        ),
        h2("High-level design"),
        arch(
          {
            nodes: [
              { id: "client", kind: "client", label: "Mobile / Web" },
              { id: "cdn", kind: "cdn", label: "CDN", note: "post images" },
              { id: "lb", kind: "load_balancer", label: "Load Balancer" },
              { id: "api", kind: "api", label: "API Gateway" },
              { id: "post", kind: "service", label: "Post Service" },
              {
                id: "feed",
                kind: "service",
                label: "Feed Service",
                note: "reads + merges + hydrates",
              },
              { id: "q", kind: "queue", label: "New-post events" },
              { id: "fanout", kind: "worker", label: "Fan-out Workers" },
              {
                id: "feedcache",
                kind: "cache",
                label: "Feed Cache",
                note: "user_id -> post ids, sharded",
              },
              { id: "postcache", kind: "cache", label: "Post Cache" },
              { id: "postsdb", kind: "database", label: "Posts DB" },
              { id: "graph", kind: "database", label: "Follow Graph" },
              { id: "media", kind: "object_storage", label: "Media Store" },
            ],
            edges: [
              { id: "e1", from: "client", to: "lb", kind: "sync" },
              { id: "e2", from: "lb", to: "api", kind: "sync" },
              { id: "e3", from: "api", to: "post", label: "POST /posts", kind: "sync" },
              { id: "e4", from: "post", to: "postsdb", kind: "sync" },
              { id: "e5", from: "post", to: "q", label: "post created", kind: "async" },
              { id: "e6", from: "q", to: "fanout", kind: "async" },
              {
                id: "e7",
                from: "fanout",
                to: "graph",
                label: "list followers",
                kind: "sync",
              },
              {
                id: "e8",
                from: "fanout",
                to: "feedcache",
                label: "prepend id",
                kind: "sync",
              },
              { id: "e9", from: "api", to: "feed", label: "GET /feed", kind: "sync" },
              { id: "e10", from: "feed", to: "feedcache", kind: "sync" },
              {
                id: "e11",
                from: "feed",
                to: "postcache",
                label: "multi-get",
                kind: "sync",
              },
              {
                id: "e12",
                from: "postcache",
                to: "postsdb",
                label: "on miss",
                kind: "sync",
              },
              { id: "e13", from: "client", to: "cdn", label: "images", kind: "sync" },
              { id: "e14", from: "cdn", to: "media", label: "origin", kind: "sync" },
            ],
          },
          "Writes go through a queue to fan-out workers; reads come from precomputed feed lists hydrated from a post cache."
        ),
        p(
          "Posting is quick for the author: the post is written and an event is queued. Fan-out workers then look up the author's followers and prepend the post id to each follower's cached feed. A feed read fetches the user's list of ids, multi-gets the posts, and returns a page."
        ),
        h2("Deep dive: fan-out on write or on read?"),
        compare(
          [
            {
              label: "Fan-out on write (push)",
              time: "Read: O(1) list fetch",
              space: "One entry per follower per post",
              when: "Most accounts, whose follower counts are modest. Moves cost to the rare write so the frequent read is a single lookup.",
            },
            {
              label: "Fan-out on read (pull)",
              time: "Read: merge K followees' posts",
              space: "No per-follower copies",
              when: "Accounts followed by millions, and users who rarely log in, where precomputing would waste far more work than it saves.",
            },
            {
              label: "Hybrid",
              time: "Read: 1 list + a few merges",
              space: "Copies for normal accounts only",
              when: "The usual answer. Push for ordinary accounts; pull and merge at read time for the small set of very large ones.",
              preferred: true,
            },
          ],
          "Where to pay for the feed"
        ),
        p(
          "Why not push for everyone? Take an account with 50 million followers. One post means 50 million feed insertions. At the average fan-out rate estimated above, about 23,000 insertions a second, that single post would take 50,000,000 / 23,000, roughly 2,200 seconds or 36 minutes, to reach everyone, and it would delay everyone else's posts while it did."
        ),
        p(
          "The hybrid marks accounts above a follower threshold as 'pulled'. Their posts are not fanned out. When a user loads the feed, the feed service reads their precomputed list, then fetches recent posts from the handful of pulled accounts they follow, and merges by timestamp. Because a user follows few such accounts, the merge is small."
        ),
        h3("Inactive users"),
        p(
          "Pushing into the feed of someone who has not opened the app in months is wasted work. Skip fan-out to followers inactive beyond some window, and rebuild their feed on demand by pulling when they return. The first load is slower; the system does far less work overall."
        ),
        h3("Edits and deletes"),
        p(
          "Because the feed stores ids rather than copies of posts, editing a post changes one row and invalidates one post-cache entry. Deleting marks the post deleted, and hydration simply drops it. Neither needs a second fan-out."
        ),
        h3("Pagination"),
        p(
          "An offset like 'page 3' breaks when new posts arrive at the top: everything shifts down and the reader sees duplicates. A cursor that encodes the last (created_at, post_id) seen asks for 'items older than this', which is stable no matter what arrives above it."
        ),
        h2("Bottlenecks and trade-offs"),
        table(
          ["Risk", "Effect", "Mitigation"],
          [
            [
              "Celebrity post",
              "Huge fan-out burst delays all posts",
              "Pull model above a follower threshold",
            ],
            [
              "Hot feed-cache shard",
              "One shard holds many active users",
              "Shard by hashed user_id; replicate hot shards",
            ],
            [
              "Post-cache miss storm",
              "Viral post expires, every reader hits the DB",
              "Request coalescing; jittered expiry",
            ],
            [
              "Fan-out lag",
              "Followers see posts late",
              "Scale workers on queue lag; prioritise active followers",
            ],
            [
              "Feed cache loss",
              "Feeds empty after a cache failure",
              "Rebuild by pull on miss; the cache is derived data",
            ],
          ],
          "What breaks first, and the standard answer."
        ),
        h2("How it scales"),
        ol(
          "Start with fan-out on read from a single posts table indexed by author and time. It is simple and correct at small scale.",
          "When feed reads dominate the database, add the feed cache and fan-out workers.",
          "When large accounts make fan-out bursty, introduce the follower threshold and the hybrid read path.",
          "When one cache cluster is not enough, shard feeds by user_id and posts by post_id, and put the follow graph in a store that serves 'followers of X' as a range scan."
        ),
        insight(
          "The strongest answers say why the numbers point to push - reads are about a hundred times more frequent than posts - and then immediately name the case where that argument fails. Stating the threshold idea before the interviewer asks about celebrities is a clear signal.",
          "What interviewers listen for"
        ),
      ],
    },
    // -----------------------------------------------------------------------
    {
      slug: "case-study-chat-service",
      title: "Design a Real-Time Chat Service",
      summary:
        "Millions of open connections, messages that must arrive once and in order, and presence that is cheap enough to keep running.",
      difficulty: "HARD",
      readingMinutes: 17,
      objectives: [
        "Size and route millions of long-lived connections",
        "Deliver messages at least once and deduplicate them into exactly-once display",
        "Order messages per conversation without trusting clocks",
        "Design presence so its write volume does not dominate the system",
      ],
      keyTakeaways: [
        "Long-lived connections make the gateway tier stateful in a way request/response servers are not; a registry maps users to gateways.",
        "Delivery is at least once with acknowledgements; a client-generated message id turns duplicates into no-ops.",
        "Order comes from a per-conversation sequence number assigned by one owner, never from device clocks.",
        "Presence is high-volume, low-value data: keep it in memory, let it expire, and fan it out lazily.",
      ],
      content: [
        h2("Clarify the requirements"),
        ul(
          "Functional: one-to-one conversations and small groups, up to a few hundred members.",
          "Functional: messages appear in real time for online recipients and are delivered when offline recipients reconnect, with a push notification meanwhile.",
          "Functional: every member sees a conversation's messages in the same order.",
          "Functional: online/last-seen presence and read receipts.",
          "Out of scope: voice and video calls, very large broadcast channels. End-to-end encryption is worth a mention; it changes what the server can see but not the delivery design."
        ),
        ul(
          "Non-functional: low delivery latency for online users, ideally well under a second end to end.",
          "Non-functional: a message the server has acknowledged is never lost.",
          "Non-functional: a user with several devices sees the same history on all of them."
        ),
        h2("Estimate"),
        note(
          "Illustrative assumptions throughout. The point is the shape of the load, not the exact figures."
        ),
        table(
          ["Quantity", "Assumption", "Result"],
          [
            ["Daily active users", "50 million", "-"],
            [
              "Messages sent",
              "40 per user per day",
              "2 billion/day, about 23,000/s average",
            ],
            ["Peak messages", "3x average", "about 70,000/s"],
            [
              "Concurrent connections",
              "20% of DAU online at peak",
              "10 million open connections",
            ],
            [
              "Connections per gateway",
              "100,000 (memory and file descriptors)",
              "100 gateways, plus headroom",
            ],
            [
              "Message storage",
              "200 bytes with metadata",
              "400 GB/day, about 146 TB/year before replication",
            ],
            [
              "Presence heartbeats",
              "Every 30 s per online connection",
              "10M / 30, about 333,000/s",
            ],
          ],
          "Presence heartbeats outnumber messages several times over."
        ),
        p(
          "That last row is the surprise worth calling out. The obvious traffic, messages, is not the biggest write stream. Presence is, and that shapes where presence may live."
        ),
        h2("API"),
        code(
          "text",
          `WebSocket frames, client -> server
  send   { clientMsgId, conversationId, body }
  ack    { conversationId, upToSeq }            // "I have displayed up to here"
  sync   { conversationId, afterSeq }           // after reconnecting

WebSocket frames, server -> client
  accepted { clientMsgId, messageId, seq }      // the server has stored it
  message  { conversationId, messageId, seq, senderId, body, sentAt }
  presence { userId, status, lastSeen }

REST, for history and setup
  GET  /v1/conversations/{id}/messages?beforeSeq=&limit=50
  POST /v1/conversations                         { memberIds }`,
          "A persistent socket for live traffic; plain HTTP for history."
        ),
        h2("Data model"),
        table(
          ["Store", "Key", "Contents", "Notes"],
          [
            [
              "Messages",
              "(conversation_id, seq)",
              "message_id, sender_id, body, sent_at",
              "Partitioned by conversation; seq orders within it",
            ],
            [
              "Conversations",
              "conversation_id",
              "type, member list, last_seq",
              "last_seq is the sequence counter",
            ],
            [
              "Read state",
              "(user_id, conversation_id)",
              "last_delivered_seq, last_read_seq",
              "Drives unread counts and receipts",
            ],
            [
              "Session registry",
              "user_id",
              "Set of (device_id, gateway_id)",
              "In memory, with TTL",
            ],
            [
              "Presence",
              "user_id",
              "status, last_seen",
              "In memory, with TTL; lossy by design",
            ],
          ],
          "Partitioning messages by conversation keeps one conversation's history on one partition."
        ),
        h2("High-level design"),
        arch(
          {
            nodes: [
              { id: "sender", kind: "client", label: "Sender device" },
              { id: "recv", kind: "client", label: "Recipient device" },
              {
                id: "lb",
                kind: "load_balancer",
                label: "L4 Load Balancer",
                note: "long-lived TCP",
              },
              {
                id: "gw",
                kind: "api",
                label: "Connection Gateways",
                note: "hold WebSockets",
              },
              {
                id: "chat",
                kind: "service",
                label: "Chat Service",
                note: "assigns seq, stores, routes",
              },
              {
                id: "registry",
                kind: "cache",
                label: "Session Registry",
                note: "user -> gateway",
              },
              {
                id: "presence",
                kind: "cache",
                label: "Presence Store",
                note: "TTL keys",
              },
              {
                id: "msgdb",
                kind: "database",
                label: "Message Store",
                note: "by conversation_id",
              },
              {
                id: "bus",
                kind: "queue",
                label: "Delivery Bus",
                note: "topic per gateway",
              },
              { id: "pushw", kind: "worker", label: "Push Worker" },
              { id: "push", kind: "external", label: "Mobile Push Provider" },
            ],
            edges: [
              { id: "e1", from: "sender", to: "lb", kind: "sync" },
              { id: "e2", from: "recv", to: "lb", kind: "sync" },
              { id: "e3", from: "lb", to: "gw", kind: "sync" },
              { id: "e4", from: "gw", to: "chat", label: "send", kind: "sync" },
              {
                id: "e5",
                from: "chat",
                to: "msgdb",
                label: "append (conv, seq)",
                kind: "sync",
              },
              {
                id: "e6",
                from: "chat",
                to: "registry",
                label: "where is recipient?",
                kind: "sync",
              },
              {
                id: "e7",
                from: "chat",
                to: "bus",
                label: "to recipient's gateway",
                kind: "async",
              },
              { id: "e8", from: "bus", to: "gw", label: "deliver", kind: "async" },
              {
                id: "e9",
                from: "chat",
                to: "pushw",
                label: "if offline",
                kind: "async",
              },
              { id: "e10", from: "pushw", to: "push", kind: "sync" },
              {
                id: "e11",
                from: "gw",
                to: "presence",
                label: "heartbeats",
                kind: "sync",
              },
              {
                id: "e12",
                from: "gw",
                to: "registry",
                label: "register on connect",
                kind: "sync",
              },
            ],
          },
          "Gateways hold connections; the chat service orders and stores messages, then routes them to whichever gateway holds each recipient."
        ),
        h2("Deep dive: connections"),
        p(
          "A request/response server forgets a client once it replies. A gateway holds the client for hours. That makes gateways stateful: a message for Alice must reach the specific gateway holding Alice's socket. On connect, the gateway writes Alice's device and gateway id into the session registry with a TTL it keeps refreshing; on disconnect, it removes them."
        ),
        p(
          "Use a layer-4 load balancer that passes TCP through rather than one that buffers HTTP requests, and pick gateways by least connections rather than round robin, since connection counts, not request rates, are what fill a gateway."
        ),
        warn(
          "Deploying a gateway drops every connection it holds, and all those clients reconnect at once. With 100,000 clients per gateway, that is a thundering herd aimed at the registry and the sync path. Drain gateways gradually during deploys and have clients reconnect with jittered backoff, as in 'Timeouts, Retries and Idempotency'.",
          "Reconnect storms"
        ),
        h2("Deep dive: delivery and ordering"),
        worked(
          "Alice sends 'running late' to a conversation with Bob. Bob has one phone online and a laptop offline.",
          "Bob's phone shows it once; the laptop catches up on reconnect; a retry would not have produced a duplicate.",
          [
            {
              state: "Alice's app creates clientMsgId = m-7c1 and sends it",
              note: "The id is created once and reused if the send is retried after a timeout.",
            },
            {
              state:
                "Chat service increments the conversation's seq to 1,042 and stores (conv, 1042, m-7c1)",
              note: "A unique constraint on clientMsgId per conversation turns a retried send into a lookup of the existing row.",
            },
            {
              state: "Service replies accepted { m-7c1, seq 1042 } to Alice",
              note: "Only now does Alice's app show the message as sent. Storage came first, so an accepted message is durable.",
            },
            {
              state:
                "Registry lookup finds Bob's phone on gateway 17; the message is published to that gateway's topic",
              note: "The gateway pushes it down the phone's socket. The phone acknowledges up to seq 1,042.",
            },
            {
              state: "Bob's laptop reconnects later and sends sync { afterSeq: 1,031 }",
              note: "It receives everything from 1,032 onward. History, not the live push, is the source of truth.",
            },
          ],
          "One message, end to end"
        ),
        concept(
          "Order from a sequence, not a clock",
          "Device clocks disagree, and server clocks drift. Instead, whoever owns a conversation's partition assigns each message the next integer in that conversation's sequence. Every reader sorts by it, so everyone sees the same order, and a client spots a gap (it has 1,040 and 1,042) and asks for what is missing."
        ),
        p(
          "Routing all writes for a conversation through one owner makes the sequence trivially correct. The cost is that one very busy conversation is bounded by one partition's throughput, which is fine for groups of a few hundred and is the reason large broadcast channels are usually designed separately."
        ),
        h2("Deep dive: presence"),
        p(
          "Presence is the classic place to over-engineer. It is approximate by nature - 'online' already means 'was online a few seconds ago' - so it should be cheap, in memory, and allowed to be slightly wrong."
        ),
        ul(
          "Each connected device sends a heartbeat every 30 seconds; the gateway refreshes a key with a 90-second TTL. No heartbeat for three intervals means offline, without anyone having to detect the disconnect.",
          "Do not broadcast every change to every contact. Send presence only to users who currently have that contact's conversation or contact list open, and batch updates.",
          "Last-seen times can be written to durable storage occasionally, not on every heartbeat."
        ),
        compare(
          [
            {
              label: "Short polling",
              time: "Delay up to the poll interval",
              space: "No open connections",
              when: "Prototypes and very low traffic. Most polls return nothing, so it wastes requests and battery at scale.",
            },
            {
              label: "Long polling",
              time: "Near real time",
              space: "A held request per client",
              when: "A fallback where WebSockets are blocked. Each message ends a request, so the client must immediately reopen one.",
            },
            {
              label: "WebSockets",
              time: "Real time, both directions",
              space: "One socket per device",
              when: "The default for chat: one connection carries sends, deliveries, acks and presence with little per-message overhead.",
              preferred: true,
            },
          ],
          "How the client stays connected"
        ),
        h2("Bottlenecks and trade-offs"),
        table(
          ["Risk", "Effect", "Mitigation"],
          [
            [
              "Gateway restart",
              "100k simultaneous reconnects",
              "Gradual drain; jittered client reconnect",
            ],
            [
              "Registry out of date",
              "Messages routed to a gateway the user left",
              "TTL plus re-registration; fall back to sync on reconnect",
            ],
            [
              "Busy group conversation",
              "One partition saturated",
              "Cap group size; separate design for broadcast channels",
            ],
            [
              "Presence write volume",
              "Larger than message traffic",
              "In-memory TTL keys; lazy fan-out; no durable write per heartbeat",
            ],
            [
              "Offline backlog",
              "Large sync after long absence",
              "Paginate sync; summarise very old conversations",
            ],
          ],
          "Where chat systems usually strain."
        ),
        h2("How it scales"),
        ol(
          "Gateways scale horizontally by connection count; the registry tells the rest of the system where everyone is.",
          "The message store partitions by conversation_id, so adding partitions adds write throughput without cross-partition work for any single conversation.",
          "The delivery bus uses one topic per gateway, so each gateway consumes only its own users' messages.",
          "Multi-device support is a matter of per-device sync cursors, not of copying messages per device."
        ),
        insight(
          "'The server stores before it acknowledges, delivery is at least once, and the client deduplicates by message id' is the sentence that answers 'what if the network drops mid-send?' in one breath.",
          "What interviewers listen for"
        ),
      ],
    },
    // -----------------------------------------------------------------------
    {
      slug: "case-study-video-streaming",
      title: "Design a Video Streaming Platform",
      summary:
        "Uploading, transcoding and serving video to every kind of screen, where the bandwidth bill shapes the whole design.",
      difficulty: "MEDIUM",
      readingMinutes: 16,
      objectives: [
        "Design a resumable upload path that never streams video bytes through the API servers",
        "Lay out a transcoding pipeline that parallelises per segment",
        "Explain adaptive bitrate streaming from the client's point of view",
        "Show with arithmetic why a CDN is not optional",
      ],
      keyTakeaways: [
        "Upload directly to object storage with signed URLs; API servers handle metadata only.",
        "Transcoding is a pipeline of independent jobs: split, encode each rendition in parallel, package, publish.",
        "Adaptive bitrate moves the quality decision to the client, segment by segment, based on what its network is doing right now.",
        "Egress dwarfs everything else, so segments are immutable, cached at the edge, and served from origin only on a miss.",
      ],
      content: [
        h2("Clarify the requirements"),
        ul(
          "Functional: creators upload videos, possibly large and over unreliable connections.",
          "Functional: uploaded videos are processed into formats and qualities that play on phones, browsers and TVs.",
          "Functional: viewers watch with quality that adapts to their connection.",
          "Functional: basic metadata - title, description, view counts.",
          "Out of scope: recommendations, comments, live streaming. Live is a different design because there is no time to transcode ahead."
        ),
        ul(
          "Non-functional: playback starts quickly and rebuffers rarely. This matters more than anything else to viewers.",
          "Non-functional: processing may take minutes; creators tolerate that.",
          "Non-functional: original uploads are never lost."
        ),
        h2("Estimate"),
        note(
          "All figures are illustrative assumptions for the arithmetic, not measurements of any real service."
        ),
        table(
          ["Quantity", "Assumption", "Result"],
          [
            ["Uploads", "100,000 per day, 5 minutes each", "-"],
            [
              "Original size",
              "20 Mbps x 300 s = 6,000 Mb",
              "750 MB per upload, 75 TB/day",
            ],
            [
              "Rendition ladder",
              "0.4 + 0.8 + 1.5 + 3 + 6 Mbps = 11.7 Mbps",
              "about 440 MB per video, 44 TB/day",
            ],
            ["Views", "50 million per day", "-"],
            ["Per view", "10 minutes at an average 3 Mbps", "1,800 Mb = 225 MB"],
            ["Egress", "50M x 225 MB", "about 11 PB/day, roughly 1 Tbps average"],
            [
              "Transcoding",
              "4 core-minutes per source minute",
              "2M core-minutes/day, about 1,400 cores busy",
            ],
          ],
          "Storage grows by roughly 120 TB a day. Egress is two orders of magnitude larger still."
        ),
        p(
          "Working the egress: 11.25 PB a day is 1.125 × 10^16 bytes, or 9 × 10^16 bits, spread over 86,400 seconds, which is about 10^12 bits per second. Serving a terabit per second from a central origin is not a realistic plan. That single line justifies the CDN."
        ),
        h2("API"),
        code(
          "http",
          `POST /v1/uploads                 { "fileName", "sizeBytes", "contentType" }
  -> 201 { "uploadId", "partSize": 16777216, "partUrls": ["<signed>", ...] }

PUT <signed part URL>             (bytes go straight to object storage)

POST /v1/uploads/{uploadId}/complete   { "parts": [ { "n", "etag" } ] }
  -> 202 { "videoId", "status": "PROCESSING" }

GET /v1/videos/{videoId}
  -> 200 { "title", "status", "durationS", "manifestUrl": "https://cdn.../master.m3u8" }`,
          "The API never sees the video bytes. It hands out signed URLs and records state."
        ),
        h2("Data model"),
        table(
          ["Store", "Key", "Contents", "Notes"],
          [
            [
              "Videos",
              "video_id",
              "owner_id, title, status, duration, created_at",
              "status: UPLOADING, PROCESSING, READY, FAILED",
            ],
            [
              "Renditions",
              "(video_id, rendition)",
              "resolution, bitrate, codec, manifest path",
              "One row per ladder rung",
            ],
            [
              "Jobs",
              "job_id",
              "video_id, step, segment, attempts, state",
              "Drives the pipeline; retried idempotently",
            ],
            [
              "Object storage",
              "path",
              "originals/, segments/{video}/{rendition}/{n}.ts, manifests",
              "Immutable once written",
            ],
            [
              "View events",
              "append-only stream",
              "video_id, viewer, position, rendition",
              "Aggregated later into counts",
            ],
          ],
          "Metadata in a database; every byte of video in object storage."
        ),
        h2("High-level design"),
        arch(
          {
            nodes: [
              { id: "creator", kind: "client", label: "Creator app" },
              { id: "viewer", kind: "client", label: "Viewer player" },
              { id: "api", kind: "api", label: "Video API" },
              { id: "meta", kind: "database", label: "Metadata DB" },
              { id: "raw", kind: "object_storage", label: "Originals bucket" },
              { id: "q", kind: "queue", label: "Transcode jobs" },
              {
                id: "split",
                kind: "worker",
                label: "Splitter",
                note: "cuts source into chunks",
              },
              {
                id: "enc",
                kind: "worker",
                label: "Encoders",
                note: "chunk x rendition, in parallel",
              },
              {
                id: "pkg",
                kind: "worker",
                label: "Packager",
                note: "segments + manifests",
              },
              {
                id: "out",
                kind: "object_storage",
                label: "Segments bucket",
                note: "CDN origin",
              },
              {
                id: "cdn",
                kind: "cdn",
                label: "CDN",
                note: "caches immutable segments",
              },
            ],
            edges: [
              {
                id: "e1",
                from: "creator",
                to: "api",
                label: "create upload",
                kind: "sync",
              },
              {
                id: "e2",
                from: "creator",
                to: "raw",
                label: "PUT parts (signed)",
                kind: "sync",
              },
              { id: "e3", from: "api", to: "meta", kind: "sync" },
              {
                id: "e4",
                from: "api",
                to: "q",
                label: "upload complete",
                kind: "async",
              },
              { id: "e5", from: "q", to: "split", kind: "async" },
              { id: "e6", from: "split", to: "q", label: "chunk jobs", kind: "async" },
              { id: "e7", from: "q", to: "enc", kind: "async" },
              {
                id: "e8",
                from: "enc",
                to: "out",
                label: "encoded chunks",
                kind: "sync",
              },
              { id: "e9", from: "enc", to: "q", label: "chunk done", kind: "async" },
              {
                id: "e10",
                from: "q",
                to: "pkg",
                label: "all chunks done",
                kind: "async",
              },
              { id: "e11", from: "pkg", to: "out", label: "manifests", kind: "sync" },
              {
                id: "e12",
                from: "pkg",
                to: "meta",
                label: "status READY",
                kind: "sync",
              },
              {
                id: "e13",
                from: "viewer",
                to: "api",
                label: "get manifest URL",
                kind: "sync",
              },
              {
                id: "e14",
                from: "viewer",
                to: "cdn",
                label: "manifest + segments",
                kind: "sync",
              },
              { id: "e15", from: "cdn", to: "out", label: "on miss", kind: "sync" },
              {
                id: "e16",
                from: "split",
                to: "raw",
                label: "read source",
                kind: "sync",
              },
            ],
          },
          "Two separate paths: an asynchronous processing pipeline, and a playback path that is almost entirely served from the CDN."
        ),
        h2("Deep dive: the upload path"),
        p(
          "A 750 MB file over a mobile connection will be interrupted. Splitting it into parts of, say, 16 MB means an interruption costs one part, not the whole file, and parts can upload in parallel. The API issues signed URLs that let the client write those parts directly to object storage, so the API tier never carries video bytes and never needs to scale with upload bandwidth."
        ),
        p(
          "When the client calls complete, the API asks object storage to assemble the parts, marks the video PROCESSING and enqueues the first pipeline job. If the client never completes, a lifecycle rule deletes abandoned parts after a few days."
        ),
        h2("Deep dive: transcoding"),
        p(
          "Encoding one long video sequentially is slow: a 5-minute video at four core-minutes per source minute would take twenty minutes on one core. Splitting the source into short chunks at keyframes lets every (chunk, rendition) pair encode independently. Sixty five-second chunks across five renditions is three hundred independent jobs, and with enough workers the wall-clock time is roughly the time to encode one chunk plus the overhead."
        ),
        ul(
          "Each job is idempotent: its output path is determined by (video, rendition, chunk), so a retried job overwrites the same object rather than creating a duplicate.",
          "A job that fails repeatedly goes to a dead-letter queue and marks the video FAILED with a reason, rather than retrying forever.",
          "The packager runs once all chunks for a rendition exist, writing a manifest per rendition and a master manifest listing them all.",
          "Keep the original. When a better codec arrives, you can re-encode from source instead of from an already-compressed copy."
        ),
        h2("Deep dive: adaptive bitrate"),
        concept(
          "Adaptive bitrate (ABR) streaming",
          "Each rendition is cut into short segments of a few seconds, aligned so segment n covers the same moment in every rendition. A manifest lists the renditions and their segments. The player measures how fast segments are arriving and how much video it has buffered, and picks the rendition for each next segment. Quality can change every few seconds without interrupting playback."
        ),
        p(
          "Good players weigh the buffer, not just the last download speed. With thirty seconds buffered, the player can afford a higher rendition even if one download was slow; with two seconds buffered, it drops quality immediately, because a rebuffer is worse for viewers than a softer picture. Starting at a modest rendition and stepping up is why playback starts fast."
        ),
        h2("Deep dive: the CDN"),
        p(
          "Segments never change once written, so they can be cached at the edge with very long lifetimes; a new encode gets new paths rather than overwriting old ones. Popular videos are served almost entirely from edge caches. The long tail of rarely watched videos misses more often, so an intermediate 'shield' cache between edges and origin keeps many edges from each fetching the same segment from object storage."
        ),
        compare(
          [
            {
              label: "Encode full ladder for every upload",
              time: "Ready in minutes, every rung",
              space: "All renditions stored",
              when: "When most uploads are watched at least a little, so stored renditions get used and playback is instant at any quality.",
              preferred: true,
            },
            {
              label: "Encode on first request",
              time: "First viewer waits",
              space: "Only what is watched",
              when: "For a very long tail of videos that are almost never watched, where storing five renditions of each wastes storage.",
            },
            {
              label: "Low rungs eagerly, high rungs on demand",
              time: "Instant at low quality",
              space: "High rungs only if popular",
              when: "A common compromise: everything plays immediately, and expensive high-resolution renditions are made once a video shows it will be watched.",
            },
          ],
          "When to spend transcoding compute"
        ),
        h2("Bottlenecks and trade-offs"),
        table(
          ["Risk", "Effect", "Mitigation"],
          [
            [
              "Egress volume",
              "Origin cannot serve a terabit",
              "CDN with long-lived immutable segments; shield tier",
            ],
            [
              "Upload spikes",
              "Transcode queue backs up",
              "Queue absorbs it; autoscale encoders on queue depth",
            ],
            [
              "Viral upload",
              "Edge misses all at once for a new video",
              "Shield cache coalesces; prewarm popular creators' uploads",
            ],
            [
              "Encoder failure mid-job",
              "Partial outputs",
              "Deterministic output paths; retry is an overwrite",
            ],
            [
              "View counting",
              "One write per view is heavy",
              "Append events to a stream; aggregate in batches",
            ],
          ],
          "What strains first."
        ),
        h2("How it scales"),
        ol(
          "Uploads scale with object storage, because the API only issues signed URLs.",
          "Transcoding scales by adding workers; the chunk-level jobs parallelise without coordination.",
          "Playback scales with the CDN; the origin sees only misses.",
          "Metadata is small and read-heavy: a replicated database with a cache in front serves it for a long time before needing to partition."
        ),
        insight(
          "Doing the egress arithmetic early, and arriving at roughly a terabit per second, is what makes 'put a CDN in front' a conclusion rather than a reflex. Show the number.",
          "What interviewers listen for"
        ),
      ],
    },
    // -----------------------------------------------------------------------
    {
      slug: "case-study-key-value-store",
      title: "Design a Distributed Key-Value Store",
      summary:
        "A store that keeps answering when nodes fail: partitioning, replication, tunable quorums and what to do when two writes collide.",
      difficulty: "HARD",
      readingMinutes: 18,
      objectives: [
        "Partition keys with consistent hashing and virtual nodes",
        "Choose N, R and W and explain what R + W > N does and does not guarantee",
        "Resolve concurrent writes with last-writer-wins or version vectors, knowing what each loses",
        "Keep replicas converging with hinted handoff, read repair and anti-entropy",
      ],
      keyTakeaways: [
        "Consistent hashing means adding a node moves only a small share of keys, and virtual nodes keep that share even.",
        "R + W > N makes every read quorum overlap every write quorum. It narrows staleness; it does not by itself make the store linearizable.",
        "Last-writer-wins is simple and silently drops one of two concurrent writes. Version vectors detect concurrency and hand the merge to someone who understands the data.",
        "Leaderless replication needs background repair, because some replicas will always have missed something.",
      ],
      content: [
        h2("Clarify the requirements"),
        ul(
          "Functional: get(key), put(key, value), delete(key). Keys are strings; values are opaque blobs up to about 1 MB.",
          "Functional: consistency is tunable per request, from fast-and-possibly-stale to quorum.",
          "Out of scope: range scans, secondary indexes, multi-key transactions. Say so; each one changes the design substantially."
        ),
        ul(
          "Non-functional: highly available for writes, even while some nodes are down or partitioned.",
          "Non-functional: grows horizontally by adding nodes, without downtime.",
          "Non-functional: single-digit-millisecond latency for most requests inside one data centre."
        ),
        h2("Estimate"),
        note("Illustrative assumptions, chosen so the arithmetic is easy to check."),
        table(
          ["Quantity", "Assumption", "Result"],
          [
            ["Logical data", "10 TB", "-"],
            ["Replication factor N", "3", "30 TB stored"],
            [
              "Usable disk per node",
              "2 TB, kept at most 70% full",
              "1.4 TB per node, so about 22 nodes",
            ],
            [
              "Request rate",
              "200,000 ops/s, 80% reads",
              "160,000 reads/s, 40,000 writes/s",
            ],
            [
              "Replica work",
              "Reads hit R = 2; writes go to all N = 3",
              "320,000 + 120,000 = 440,000 replica ops/s",
            ],
            [
              "Per-node capacity",
              "20,000 replica ops/s",
              "440,000 / 20,000 = 22 nodes",
            ],
          ],
          "Storage and throughput both point to about 22 nodes. Provision 24 or more for headroom and failures."
        ),
        h2("API"),
        code(
          "http",
          `GET /v1/kv/{key}?consistency=one|quorum|all
  -> 200 { "value": "<base64>", "context": "<opaque version vector>" }
  -> 300 { "siblings": [ { "value", "context" }, ... ] }   // concurrent versions

PUT /v1/kv/{key}?consistency=one|quorum|all
  { "value": "<base64>", "context": "<from the read, if any>" }
  -> 204

DELETE /v1/kv/{key}         // writes a tombstone, not an immediate erase`,
          "The context a client read is passed back on write, so the store knows which version it replaces."
        ),
        h2("Data model"),
        p(
          "Each stored record is (key, value, version vector, tombstone flag, write timestamp). On disk, a log-structured design suits a write-heavy store: writes append to a log and an in-memory table, which is flushed to sorted immutable files that are compacted in the background. The record format matters more to this design than the file format, because the version vector is what conflict resolution reads."
        ),
        h2("High-level design"),
        arch(
          {
            nodes: [
              {
                id: "client",
                kind: "client",
                label: "Client library",
                note: "may know the ring",
              },
              { id: "lb", kind: "load_balancer", label: "Load Balancer" },
              {
                id: "coord",
                kind: "service",
                label: "Coordinator",
                note: "any node can play this role",
              },
              {
                id: "a",
                kind: "database",
                label: "Node A",
                note: "replica 1 for key k",
                group: "Preference list for k",
              },
              {
                id: "b",
                kind: "database",
                label: "Node B",
                note: "replica 2 for key k",
                group: "Preference list for k",
              },
              {
                id: "c",
                kind: "database",
                label: "Node C",
                note: "replica 3 for key k",
                group: "Preference list for k",
              },
              {
                id: "d",
                kind: "database",
                label: "Node D",
                note: "holds hints while C is down",
              },
            ],
            edges: [
              { id: "e1", from: "client", to: "lb", kind: "sync" },
              { id: "e2", from: "lb", to: "coord", kind: "sync" },
              { id: "e3", from: "coord", to: "a", label: "write / read", kind: "sync" },
              { id: "e4", from: "coord", to: "b", label: "write / read", kind: "sync" },
              { id: "e5", from: "coord", to: "c", label: "write / read", kind: "sync" },
              {
                id: "e6",
                from: "coord",
                to: "d",
                label: "hinted write if C down",
                kind: "sync",
              },
              {
                id: "r1",
                from: "d",
                to: "c",
                label: "hand off when C returns",
                kind: "replication",
              },
              {
                id: "r2",
                from: "a",
                to: "b",
                label: "anti-entropy",
                kind: "replication",
              },
            ],
          },
          "A coordinator forwards each request to the N replicas responsible for the key and waits for R or W of them."
        ),
        h2("Deep dive: partitioning"),
        p(
          "With hash(key) mod number-of-nodes, adding one node changes the owner of almost every key. Consistent hashing places both nodes and keys on a ring of hash values; a key belongs to the first node clockwise from it. Adding a node takes over only the keys between it and its predecessor, roughly 1/n of the data."
        ),
        p(
          "A plain ring with one position per node distributes data unevenly, and when a node leaves, its entire load lands on one neighbour. Virtual nodes fix both: each physical node takes many positions on the ring, say a hundred or more, so its data is spread across many small ranges and its departure spreads its load across many peers. Virtual nodes also let a bigger machine take more positions."
        ),
        h2("Deep dive: replication and quorums"),
        p(
          "Each key is stored on the first N distinct physical nodes clockwise from it, its preference list. Any node can coordinate a request: it sends the write to all N replicas and acknowledges after W have confirmed; for a read it asks the replicas and returns after R have answered."
        ),
        table(
          ["N, W, R", "Write needs", "Read needs", "Character"],
          [
            [
              "3, 3, 1",
              "All 3 replicas",
              "Any 1",
              "Fast reads; one replica down blocks writes",
            ],
            ["3, 2, 2", "2 of 3", "2 of 3", "Balanced; R + W > N, so quorums overlap"],
            [
              "3, 1, 3",
              "Any 1",
              "All 3",
              "Fast writes; one replica down blocks quorum reads",
            ],
            [
              "3, 1, 1",
              "Any 1",
              "Any 1",
              "Fastest and most available; reads may be stale",
            ],
          ],
          "R + W > N means any read set shares at least one replica with any write set."
        ),
        warn(
          "Overlapping quorums mean a read reaches at least one replica that took the latest acknowledged write. They do not make the store linearizable. Concurrent writes, a write that reached fewer than W replicas before failing, and sloppy quorums that use stand-in nodes during failures all leave windows where readers disagree. If you need linearizable operations on a key, you need consensus for that key.",
          "What the quorum condition does not promise"
        ),
        worked(
          "N = 3, W = 2, R = 2. Key k lives on A, B and C. C is down.",
          "The write succeeds on A and B; the read gets the new value; C catches up later via its hint.",
          [
            {
              state: "put(k, v2): coordinator sends to A, B, C",
              note: "A and B acknowledge. C does not answer.",
            },
            {
              state: "W = 2 reached; client gets success. D stores v2 as a hint for C",
              note: "Hinted handoff keeps write availability without pretending C has the data.",
            },
            {
              state: "get(k): coordinator asks A, B, C; A and B answer",
              note: "R = 2 reached. Both have v2, so it returns v2.",
            },
            {
              state: "C returns; D delivers the hint; C now has v2",
              note: "If a later read had found C stale, read repair would also have written v2 back to it.",
            },
          ],
          "A quorum surviving a failure"
        ),
        h2("Deep dive: conflict resolution"),
        p(
          "With no single leader, two clients can write the same key at the same time through different coordinators, and replicas can end up holding different values. The store must decide what a later read returns."
        ),
        compare(
          [
            {
              label: "Last-writer-wins (timestamps)",
              time: "Constant per write",
              space: "One timestamp per value",
              when: "When values are replaced wholesale and losing one of two near-simultaneous writes is acceptable, such as a cache entry. Clock skew can make an older write win.",
            },
            {
              label: "Version vectors, client merges",
              time: "Compare vectors on read and write",
              space: "A counter per writer per key",
              when: "When concurrent updates must not be silently lost, like a shopping cart. The store detects concurrency and returns siblings for the application to merge.",
              preferred: true,
            },
            {
              label: "Mergeable data types (CRDTs)",
              time: "Merge built into the type",
              space: "Extra metadata per value",
              when: "Counters, sets and similar structures whose merge rule can be fixed in advance, so no application code has to resolve anything.",
            },
          ],
          "Two writes collided. Now what?"
        ),
        p(
          "A version vector records, per writer, how many updates it has seen. If one vector is greater than or equal to the other in every entry, it descends from it and replaces it. If each has an entry the other lacks, the writes were concurrent, and both are kept as siblings until a client reads them, merges them and writes back a value whose context covers both."
        ),
        h2("Deep dive: staying in sync"),
        ul(
          "Hinted handoff: a stand-in node holds writes for a down replica and delivers them when it returns.",
          "Read repair: when a read sees replicas disagree, the coordinator writes the newest version back to the stale ones.",
          "Anti-entropy: replicas periodically compare hash trees (Merkle trees) of their key ranges, so only the ranges that differ are exchanged rather than the whole dataset.",
          "Gossip membership: nodes exchange what they know about each other's health, so every node eventually learns the ring and who is down without a central registry.",
          "Tombstones: a delete is a write of a marker, kept long enough to reach every replica; otherwise a stale replica would resurrect the deleted value during repair."
        ),
        h2("Bottlenecks and trade-offs"),
        table(
          ["Risk", "Effect", "Mitigation"],
          [
            [
              "Hot key",
              "One preference list overloaded",
              "Client-side caching; split the key by suffix for counters",
            ],
            [
              "Node joins or leaves",
              "Data must stream between nodes",
              "Virtual nodes spread the transfer; throttle it",
            ],
            [
              "Large siblings sets",
              "Reads slow and values grow",
              "Encourage clients to merge on read; cap siblings",
            ],
            [
              "Tombstone build-up",
              "Disk and read cost",
              "Garbage-collect after a grace period longer than repair cycles",
            ],
            [
              "Cross-DC quorums",
              "Every quorum op pays WAN latency",
              "Local quorums per data centre with async cross-DC replication",
            ],
          ],
          "Where a leaderless store needs care."
        ),
        h2("How it scales"),
        ol(
          "Add nodes; each takes over a slice of ring positions, moving about 1/n of the data.",
          "Raise N for durability or read capacity; tune R and W per request for the latency and consistency each caller needs.",
          "Across data centres, give each its own replicas and quorum, and replicate between them asynchronously.",
          "Keep the coordination-free path the common one. That is the whole reason to choose a leaderless store."
        ),
        insight(
          "Strong answers state R + W > N and then immediately say what it does not guarantee. The follow-up question is almost always about concurrent writes, so arrive at version vectors before you are asked.",
          "What interviewers listen for"
        ),
      ],
    },
    // -----------------------------------------------------------------------
    {
      slug: "case-study-web-crawler",
      title: "Design a Web Crawler",
      summary:
        "Fetching a billion pages a month without overloading anyone's server, fetching the same page twice, or getting lost in an infinite calendar.",
      difficulty: "MEDIUM",
      readingMinutes: 15,
      objectives: [
        "Design a URL frontier that balances priority against per-host politeness",
        "Deduplicate URLs and content at billion scale with bounded memory",
        "Schedule recrawls so freshness tracks how often pages actually change",
      ],
      keyTakeaways: [
        "The frontier is the heart of a crawler: priority queues decide what next, per-host queues decide when.",
        "Politeness is a hard requirement, not a courtesy. One connection per host, delays between requests, and robots.txt obeyed.",
        "A Bloom filter holds a billion seen URLs in about a gigabyte, at the cost of occasionally skipping a page it has not actually seen.",
        "Recrawl adaptively: pages that change often are revisited often, and conditional requests make unchanged pages cheap.",
      ],
      content: [
        h2("Clarify the requirements"),
        ul(
          "Functional: start from seed URLs, fetch pages, extract links, and keep crawling.",
          "Functional: store fetched HTML for a downstream indexer.",
          "Functional: revisit pages to keep the stored copy reasonably fresh.",
          "Out of scope: rendering JavaScript-heavy pages, images and video, the indexer itself."
        ),
        ul(
          "Non-functional: polite. Never overload a site; obey robots.txt.",
          "Non-functional: robust against malformed pages, slow servers and crawler traps.",
          "Non-functional: scales by adding machines."
        ),
        h2("Estimate"),
        note("Illustrative assumptions; adjust them with the interviewer."),
        table(
          ["Quantity", "Assumption", "Result"],
          [
            [
              "Pages per month",
              "1 billion",
              "about 386 pages/s average (1e9 / 2.59M s)",
            ],
            [
              "Average page",
              "100 KB of HTML",
              "about 39 MB/s, roughly 310 Mbps sustained",
            ],
            [
              "Raw storage",
              "1B x 100 KB",
              "100 TB/month; perhaps 25 TB compressed at 4:1",
            ],
            ["Seen-URL set, exact", "8-byte hash per URL", "8 GB for 1 billion URLs"],
            [
              "Seen-URL set, Bloom filter",
              "1% false positives, ~9.6 bits per URL",
              "about 1.2 GB",
            ],
            [
              "Fetch latency",
              "1 s average including slow sites",
              "386 concurrent fetches at minimum; plan for thousands",
            ],
          ],
          "The bandwidth is modest. Concurrency, politeness and deduplication are the real design problems."
        ),
        h2("Interfaces"),
        p(
          "A crawler has almost no public API, so describe the internal interfaces between components instead. Interviewers accept this readily, and it makes the boundaries explicit."
        ),
        code(
          "typescript",
          `interface Frontier {
  add(url: string, priority: number, notBefore?: Date): void;
  next(workerId: string): Promise<{ url: string; host: string }>; // respects politeness
  done(url: string, outcome: "ok" | "error" | "not_modified"): void;
}

interface PageStore {
  put(url: string, html: Uint8Array, meta: { fetchedAt: Date; etag?: string; contentHash: string }): Promise<void>;
}

interface SeenFilter {
  testAndAdd(normalisedUrl: string): boolean; // true if possibly seen before
}`,
          "Three boundaries: what to fetch next, where results go, and what has been seen."
        ),
        h2("Data model"),
        table(
          ["Store", "Key", "Contents", "Notes"],
          [
            [
              "URL records",
              "url_hash",
              "url, host, last_fetched, next_due, etag, content_hash, change_rate",
              "Drives recrawl scheduling",
            ],
            [
              "Host records",
              "host",
              "robots rules, crawl delay, next_allowed_at, error count",
              "Politeness state",
            ],
            [
              "Page store",
              "url_hash + fetch time",
              "Compressed HTML",
              "Object storage, append-only",
            ],
            [
              "Content hashes",
              "content_hash",
              "First URL seen with it",
              "Exact duplicate detection",
            ],
          ],
          "Small, hot metadata in a database; bulky pages in object storage."
        ),
        h2("High-level design"),
        arch(
          {
            nodes: [
              { id: "seeds", kind: "client", label: "Seed URLs" },
              {
                id: "frontier",
                kind: "queue",
                label: "URL Frontier",
                note: "priority queues + per-host queues",
              },
              {
                id: "fetch",
                kind: "worker",
                label: "Fetchers",
                note: "one connection per host",
              },
              { id: "dns", kind: "cache", label: "DNS + robots cache" },
              { id: "web", kind: "external", label: "Websites" },
              { id: "pages", kind: "object_storage", label: "Page Store" },
              { id: "parseq", kind: "queue", label: "Parse queue" },
              {
                id: "parse",
                kind: "worker",
                label: "Parsers",
                note: "extract + normalise links",
              },
              {
                id: "seen",
                kind: "cache",
                label: "Seen-URL filter",
                note: "Bloom filter, sharded",
              },
              { id: "content", kind: "database", label: "Content hashes" },
              { id: "urls", kind: "database", label: "URL + host records" },
              { id: "sched", kind: "worker", label: "Recrawl Scheduler" },
            ],
            edges: [
              { id: "e1", from: "seeds", to: "frontier", kind: "async" },
              {
                id: "e2",
                from: "frontier",
                to: "fetch",
                label: "next URL",
                kind: "async",
              },
              { id: "e3", from: "fetch", to: "dns", kind: "sync" },
              {
                id: "e4",
                from: "fetch",
                to: "web",
                label: "GET (conditional)",
                kind: "sync",
              },
              { id: "e5", from: "fetch", to: "pages", kind: "sync" },
              { id: "e6", from: "fetch", to: "parseq", kind: "async" },
              { id: "e7", from: "parseq", to: "parse", kind: "async" },
              {
                id: "e8",
                from: "parse",
                to: "content",
                label: "duplicate?",
                kind: "sync",
              },
              { id: "e9", from: "parse", to: "seen", label: "new URL?", kind: "sync" },
              {
                id: "e10",
                from: "parse",
                to: "frontier",
                label: "new URLs",
                kind: "async",
              },
              {
                id: "e11",
                from: "fetch",
                to: "urls",
                label: "fetch result",
                kind: "sync",
              },
              {
                id: "e12",
                from: "sched",
                to: "urls",
                label: "due for recrawl",
                kind: "sync",
              },
              { id: "e13", from: "sched", to: "frontier", kind: "async" },
            ],
          },
          "A loop: the frontier feeds fetchers, fetched pages feed parsers, and parsers feed new URLs back to the frontier."
        ),
        h2("Deep dive: the frontier and politeness"),
        p(
          "A single FIFO queue fails twice over. It has no notion of importance, so a link farm can crowd out the pages that matter. And since pages link heavily within their own site, consecutive URLs tend to share a host, so a pool of fetchers would hammer that one host in parallel."
        ),
        p(
          "A two-stage frontier, a common design in the crawler literature, separates the two concerns. Front queues are ordered by priority: a score from signals such as how many known pages link to the URL, how important its site is, and how long since it was fetched. Back queues are one per host. A selector moves URLs from front queues into the right host's back queue, and each back queue is served by only one fetcher at a time, no sooner than that host's next_allowed_at."
        ),
        ul(
          "Fetch and cache robots.txt per host before anything else on it, and refresh it periodically. Disallowed paths are dropped, not deferred.",
          "Delay between requests to one host, honouring any crawl-delay the site asks for, and back off further when a host responds slowly or with errors.",
          "Cache DNS. Resolving a hostname for every fetch would make the resolver the bottleneck, and slow lookups would stall fetchers."
        ),
        h2("Deep dive: deduplication"),
        p(
          "Two kinds of duplicate matter. The same page reachable at many URLs - with and without a trailing slash, with tracking parameters, with different capitalisation of the host - and different URLs serving identical or nearly identical content, such as mirrors and printer-friendly versions."
        ),
        ol(
          "Normalise every URL before anything else: lowercase scheme and host, remove default ports and fragments, resolve relative paths, strip known tracking parameters, sort query parameters.",
          "Check the normalised URL against the seen-URL filter; only unseen URLs enter the frontier.",
          "After fetching, hash the content. An exact hash match means a duplicate page; store a pointer rather than another copy.",
          "Optionally compute a similarity fingerprint (such as SimHash) to catch near-duplicates that differ only in a timestamp or an ad."
        ),
        compare(
          [
            {
              label: "Exact set of URL hashes",
              time: "One lookup per URL",
              space: "8 GB per billion URLs",
              when: "When skipping a page by mistake is unacceptable and the memory is available, or when the set is sharded across machines anyway.",
            },
            {
              label: "Bloom filter",
              time: "k hash probes per URL",
              space: "About 1.2 GB per billion at 1%",
              when: "When memory is tight and occasionally skipping a new URL is acceptable. A false positive means one page is missed, never fetched twice.",
              preferred: true,
            },
            {
              label: "Database lookup per URL",
              time: "A network round trip per URL",
              space: "Disk, unbounded",
              when: "Only at small scale. At hundreds of pages a second with dozens of links each, per-URL round trips become the bottleneck.",
            },
          ],
          "How to remember a billion URLs"
        ),
        h2("Deep dive: freshness"),
        p(
          "Pages change at very different rates. A news front page changes every few minutes; an archived article perhaps never. Crawling everything on one schedule wastes most fetches on pages that have not changed and visits busy pages too rarely."
        ),
        ul(
          "Record whether each fetch found a change (by content hash). Shorten the revisit interval when it did, lengthen it when it did not, within bounds.",
          "Send conditional requests with If-None-Match and If-Modified-Since. A 304 Not Modified costs the site and the crawler almost nothing.",
          "Give important pages a shorter minimum interval, so priority affects recrawl as well as discovery."
        ),
        warn(
          "Some sites generate unlimited URLs: a calendar with a 'next month' link forever, session ids in every link, or faceted search with endless parameter combinations. Defend with a maximum URL length, a maximum depth from the seed, a cap on pages per host per crawl cycle, and detection of repeating path segments.",
          "Crawler traps"
        ),
        h2("Bottlenecks and trade-offs"),
        table(
          ["Risk", "Effect", "Mitigation"],
          [
            [
              "Single huge site",
              "Its back queue grows without bound",
              "Per-host page budget per cycle",
            ],
            [
              "Slow or hanging hosts",
              "Fetchers sit idle waiting",
              "Short connect and read timeouts; many concurrent fetches per fetcher",
            ],
            [
              "Frontier size",
              "Billions of pending URLs exceed memory",
              "Keep queue heads in memory, the rest on disk",
            ],
            [
              "Seen-filter growth",
              "False-positive rate climbs as it fills",
              "Size for expected count; shard by URL hash; rebuild periodically",
            ],
            [
              "Politeness vs throughput",
              "Per-host limits cap speed",
              "Crawl many hosts in parallel rather than any one faster",
            ],
          ],
          "Where a crawler strains."
        ),
        h2("How it scales"),
        ol(
          "Shard the frontier by host hash, so every URL for a host lands on the same machine and politeness stays a local decision.",
          "Scale fetchers and parsers independently; the parse queue between them absorbs differences in speed.",
          "Shard the seen-URL filter and content-hash store by hash, so lookups never need a global structure.",
          "Place fetchers in several regions to reduce latency to distant hosts, keeping each host assigned to one region."
        ),
        insight(
          "Politeness is the requirement that most shapes the frontier, and candidates who treat it as an afterthought end up redesigning the queue mid-interview. Raise it in requirements and the frontier design follows naturally.",
          "What interviewers listen for"
        ),
      ],
    },
    // -----------------------------------------------------------------------
    {
      slug: "case-study-payment-system",
      title: "Design a Payment System",
      summary:
        "Moving money correctly matters more than moving it fast: idempotency end to end, a double-entry ledger, and reconciliation against the outside world.",
      difficulty: "HARD",
      readingMinutes: 17,
      objectives: [
        "Make every step of a payment safe to retry, including calls to an external processor",
        "Model money movements in an append-only double-entry ledger",
        "Avoid dual-write inconsistencies with a transactional outbox",
        "Design daily reconciliation that catches what real-time processing missed",
      ],
      keyTakeaways: [
        "In payments, correctness beats latency and availability. Throughput is rarely the hard part.",
        "A timeout from the processor means 'unknown', not 'failed'. Resolve it by asking, never by charging again under a new id.",
        "A double-entry ledger is append-only and always balances; corrections are new entries, never edits.",
        "Reconciliation is not optional. Your records, the processor's records and the bank's records are compared every day.",
      ],
      content: [
        h2("Clarify the requirements"),
        ul(
          "Functional: a customer pays a merchant using a card, through an external payment processor.",
          "Functional: full and partial refunds.",
          "Functional: merchants see their balances and a history of payments and payouts.",
          "Functional: every movement of money is recorded and auditable.",
          "Out of scope: building card-network connectivity ourselves, fraud scoring, currency conversion. Note fraud checks as a step in the flow."
        ),
        ul(
          "Non-functional: never charge a customer twice for one purchase, and never lose a payment that succeeded.",
          "Non-functional: every balance is explainable from the records that produced it.",
          "Non-functional: card details never touch our systems in raw form; we hold processor tokens only."
        ),
        h2("Estimate"),
        note(
          "Illustrative assumptions. The useful conclusion is about where the difficulty lies, not about the exact numbers."
        ),
        table(
          ["Quantity", "Assumption", "Result"],
          [
            ["Payments", "10 million per day", "about 116/s average"],
            ["Peak", "5x average at sale events", "about 580/s"],
            [
              "Ledger entries",
              "At least 2 per movement (debit + credit)",
              "20 million+ rows/day",
            ],
            ["Ledger growth", "200 bytes per entry", "about 4 GB/day, 1.5 TB/year"],
          ],
          "A few hundred writes a second is well within one well-tuned relational database."
        ),
        p(
          "That is the important finding. The load is modest, so there is no reason to give up transactions, constraints or strong consistency to get scale. The hard parts are partial failures and disagreements with systems we do not control."
        ),
        h2("API"),
        code(
          "http",
          `POST /v1/payments
  Idempotency-Key: 6f1c...          (client-generated, one per checkout attempt)
  { "amountMinor": 2599, "currency": "USD", "merchantId": "m_42",
    "paymentMethodToken": "tok_...", "orderId": "o_991" }
  -> 201 { "paymentId": "pay_...", "status": "AUTHORIZED" }
  -> 202 { "paymentId": "pay_...", "status": "PENDING" }   (outcome not yet known)

GET  /v1/payments/{paymentId}
POST /v1/payments/{paymentId}/refunds   Idempotency-Key: ...  { "amountMinor": 1000 }

POST /v1/webhooks/processor             (signed; the processor reports outcomes)`,
          "Amounts are integers in minor units (cents). Never floating point for money."
        ),
        h2("Data model"),
        table(
          ["Table", "Key", "Contents", "Notes"],
          [
            [
              "payments",
              "payment_id",
              "idempotency_key (unique), merchant, amount_minor, currency, status",
              "A state machine; transitions are guarded",
            ],
            [
              "processor_attempts",
              "attempt_id",
              "payment_id, processor_reference, request, response, status",
              "One row per call to the processor",
            ],
            [
              "ledger_entries",
              "entry_id",
              "transaction_id, account_id, direction, amount_minor, currency, created_at",
              "Append-only; never updated or deleted",
            ],
            [
              "accounts",
              "account_id",
              "owner, type (customer funds, merchant payable, fees, ...)",
              "Balances derive from entries",
            ],
            [
              "outbox",
              "event_id",
              "event type, payload, published flag",
              "Written in the same transaction as the change",
            ],
          ],
          "The ledger is the source of truth for money. Everything else describes how a payment is progressing."
        ),
        h2("High-level design"),
        arch(
          {
            nodes: [
              { id: "client", kind: "client", label: "Checkout client" },
              {
                id: "api",
                kind: "api",
                label: "Payments API",
                note: "idempotency check first",
              },
              {
                id: "pay",
                kind: "service",
                label: "Payment Service",
                note: "state machine",
              },
              {
                id: "db",
                kind: "database",
                label: "Payments DB",
                note: "payments + attempts + outbox",
              },
              { id: "psp", kind: "external", label: "Payment Processor" },
              { id: "relay", kind: "worker", label: "Outbox Relay" },
              { id: "q", kind: "queue", label: "Payment events" },
              { id: "ledger", kind: "service", label: "Ledger Service" },
              {
                id: "ldb",
                kind: "database",
                label: "Ledger DB",
                note: "append-only, double entry",
              },
              { id: "recon", kind: "worker", label: "Reconciliation", note: "daily" },
              { id: "files", kind: "object_storage", label: "Settlement reports" },
            ],
            edges: [
              {
                id: "e1",
                from: "client",
                to: "api",
                label: "POST /payments + key",
                kind: "sync",
              },
              { id: "e2", from: "api", to: "pay", kind: "sync" },
              {
                id: "e3",
                from: "pay",
                to: "db",
                label: "state + outbox, one txn",
                kind: "sync",
              },
              {
                id: "e4",
                from: "pay",
                to: "psp",
                label: "authorize (attempt id as key)",
                kind: "sync",
              },
              { id: "e5", from: "psp", to: "api", label: "webhook", kind: "async" },
              {
                id: "e6",
                from: "relay",
                to: "db",
                label: "read unpublished",
                kind: "sync",
              },
              { id: "e7", from: "relay", to: "q", kind: "async" },
              { id: "e8", from: "q", to: "ledger", kind: "async" },
              {
                id: "e9",
                from: "ledger",
                to: "ldb",
                label: "balanced entries",
                kind: "sync",
              },
              {
                id: "e10",
                from: "psp",
                to: "files",
                label: "daily report",
                kind: "async",
              },
              { id: "e11", from: "recon", to: "files", kind: "sync" },
              { id: "e12", from: "recon", to: "ldb", kind: "sync" },
            ],
          },
          "The payment service talks to the processor; the ledger records the outcome; reconciliation checks both against the processor's own report."
        ),
        h2("Deep dive: idempotency end to end"),
        p(
          "There are two retry boundaries, and both need protecting. Between the client and us, the client's Idempotency-Key works exactly as in 'Timeouts, Retries and Idempotency': a repeat returns the stored result. Between us and the processor, we create an attempt row first, then send the processor our attempt id as its idempotency key, where the processor supports one. A retry of that call reuses the same attempt id, so the processor deduplicates it."
        ),
        worked(
          "We call the processor to authorise $25.99. The call times out after 10 seconds.",
          "The customer is charged once. The payment ends up AUTHORIZED without a second charge being attempted under a new id.",
          [
            {
              state:
                "Payment row PENDING; attempt a-17 created and committed before the call",
              note: "If we crash now, a recovery job will find a-17 and know a call may have been made.",
            },
            {
              state: "Call times out. Status of a-17 set to UNKNOWN",
              note: "Not FAILED. The authorisation may well have succeeded.",
            },
            {
              state:
                "Resolver queries the processor for a-17 (or retries with key a-17)",
              note: "Same key, so the processor returns the original result instead of charging again.",
            },
            {
              state:
                "Processor reports approved; payment moves to AUTHORIZED; outbox event written in the same transaction",
              note: "A webhook may also arrive with the same news. Applying a transition the payment already made is a no-op.",
            },
          ],
          "A timeout, handled correctly"
        ),
        warn(
          "The most damaging bug in this domain is treating a timeout as a failure and letting the user, or the code, try again with a fresh key. That is how customers get charged twice. Unknown outcomes are resolved by querying, never by guessing.",
          "Unknown is not failed"
        ),
        h2("Deep dive: the double-entry ledger"),
        concept(
          "Double-entry bookkeeping",
          "Every movement of money is recorded as at least two entries in different accounts - a debit in one and a credit in another - whose amounts sum to zero. The ledger as a whole therefore always balances, and any account's balance is the sum of its entries."
        ),
        table(
          ["Transaction", "Account", "Debit", "Credit"],
          [
            ["Capture $25.99", "Processor receivable", "2,599", "-"],
            ["Capture $25.99", "Merchant payable", "-", "2,524"],
            ["Capture $25.99", "Platform fee revenue", "-", "75"],
            ["Refund $10.00", "Merchant payable", "1,000", "-"],
            ["Refund $10.00", "Processor receivable", "-", "1,000"],
          ],
          "Amounts in cents, with an illustrative fee. Each transaction's debits equal its credits."
        ),
        p(
          "Entries are never updated or deleted. A mistake is corrected with a new reversing transaction, so the history of what the system believed, and when, is preserved for audit. Enforce the balance rule in the database: write a transaction's entries in one database transaction, and check that they sum to zero before committing."
        ),
        h2("Deep dive: the outbox"),
        p(
          "When a payment is captured, two things must happen: the payment's status changes, and the ledger must be told. Writing to the payments database and then publishing to a queue is a dual write; a crash between them loses the event, and the ledger never hears about money that moved."
        ),
        p(
          "The transactional outbox removes the gap. The status change and an outbox row describing the event are written in one database transaction, so either both happen or neither does. A relay reads unpublished outbox rows, publishes them, and marks them published. It may publish a row twice after a crash, so the ledger deduplicates by event id."
        ),
        compare(
          [
            {
              label: "Ledger written synchronously",
              time: "Adds a write to the request",
              space: "Payments and ledger in one DB",
              when: "When payments and ledger can share one database, so a single transaction covers both. Simplest and strongest; works at this scale.",
              preferred: true,
            },
            {
              label: "Outbox to a separate ledger",
              time: "Ledger lags by seconds",
              space: "An outbox table and a relay",
              when: "When the ledger is its own service with its own database. Gives the same guarantee asynchronously, with deduplication on the consumer.",
            },
            {
              label: "Dual write to DB and queue",
              time: "Fast",
              space: "Nothing extra",
              when: "Never for money. A crash between the two writes loses or invents an event, and nothing will notice until reconciliation.",
            },
          ],
          "Keeping the payment and the ledger in step"
        ),
        h2("Deep dive: reconciliation"),
        p(
          "However carefully the real-time path is built, three parties keep their own records: our ledger, the processor, and the bank that receives settlements. Reconciliation is a daily batch job that compares them line by line."
        ),
        ul(
          "In our ledger but not in the processor's report: a payment we think succeeded that the processor does not know about. Investigate before paying out the merchant.",
          "In the processor's report but not in our ledger: money moved that we never recorded, often a lost webhook or a missed UNKNOWN resolution. Record it with a correcting entry.",
          "In both, with different amounts or statuses: a partial capture, a fee difference, or a bug. Raise it for review.",
          "Settled total from the processor versus the deposit the bank actually received: checks the last hop."
        ),
        h2("Bottlenecks and trade-offs"),
        table(
          ["Risk", "Effect", "Mitigation"],
          [
            [
              "Processor outage",
              "Payments cannot be authorised",
              "A second processor with routing; queue retries for non-interactive cases",
            ],
            [
              "Unknown outcomes pile up",
              "Customers waiting on PENDING",
              "Aggressive status polling; webhook as the fast path",
            ],
            [
              "Hot merchant account",
              "Contention on one balance row",
              "Derive balances from entries; avoid a single mutable balance row",
            ],
            [
              "Ledger growth",
              "Large tables, slow balance queries",
              "Periodic balance snapshots plus entries since the snapshot",
            ],
            [
              "Duplicate webhooks",
              "Same event applied twice",
              "Guarded state transitions; dedupe by event id",
            ],
          ],
          "Where correctness is most at risk."
        ),
        h2("How it scales"),
        ol(
          "One relational database with strict transactions handles the illustrative load with room to spare. Do not partition early in this domain.",
          "Separate the ledger into its own service and database once its read load or audit requirements justify it, connected by the outbox.",
          "When needed, partition payments by merchant, keeping each merchant's payments and ledger accounts together so transactions stay on one partition.",
          "Scale reconciliation as a batch job over files and ledger snapshots; it does not need to share the real-time database."
        ),
        insight(
          "Saying 'the load is small enough that I will keep everything in one transactional database' is a strong move here, because it shows you chose correctness deliberately. Then spend the time on unknown outcomes, the ledger and reconciliation, which is where payment systems actually go wrong.",
          "What interviewers listen for"
        ),
      ],
    },
  ],
};

/** Reliability, and worked interview case studies. */
export const SD_RELIABILITY_CASE_SECTIONS: SectionSeed[] = [RELIABILITY, CASE_STUDIES];
