import {
  arch,
  concept,
  h2,
  insight,
  note,
  p,
  rp,
  table,
  ul,
  warn,
  type SectionSeed,
} from "@/data/curriculum/types";

/**
 * The last three sections: what breaks when one machine becomes several,
 * what you need in place to see it break, and how the pieces get arranged.
 *
 * All prose original.
 */

export const DISTRIBUTED: SectionSeed = {
  slug: "distributed-systems",
  title: "Distributed Systems",
  summary:
    "What changes when the network is between your components: CAP, consistency models, coordination and queues.",
  chapters: [
    {
      slug: "cap-and-consistency-models",
      title: "CAP and Consistency Models",
      summary:
        "CAP is narrower than people think, and the interesting choices live between its extremes.",
      difficulty: "HARD",
      readingMinutes: 11,
      objectives: [
        "State CAP precisely enough that the choice it describes is the real one",
        "Place a system on the spectrum from strong to eventual consistency",
        "Pick a consistency level per operation rather than per system",
      ],
      keyTakeaways: [
        "Partitions are not optional, so the real choice is what to do during one.",
        "Consistency is a spectrum, and CAP only names its endpoints.",
        "Different operations in one product deserve different answers.",
      ],
      content: [
        h2("What CAP actually says"),
        p(
          "CAP is usually recited as 'pick two of consistency, availability, partition tolerance', which makes it sound like a menu. It is not one — network partitions are a fact about networks, not a design option. You do not choose whether they happen."
        ),
        concept(
          "The precise version",
          "When a network partition occurs, a system must choose: refuse to answer until it can be sure the answer is current (giving up availability), or answer from what it has locally (giving up consistency). That is the whole theorem."
        ),
        p(
          "The theorem therefore describes behaviour during a partition — a rare event — and says nothing about the rest of the time. Most of the design work is in the rest of the time, which is why CAP is a starting point rather than a framework."
        ),
        h2("The spectrum between the endpoints"),
        table(
          ["Model", "Guarantees", "Costs"],
          [
            ["Strong / linearizable", "Every read sees the latest write", "Coordination on every operation"],
            ["Read your writes", "You see your own changes", "Routing or session pinning"],
            ["Monotonic reads", "You never see time go backwards", "Sticky replica selection"],
            ["Causal", "Related events observed in order", "Tracking causality"],
            ["Eventual", "Copies converge, eventually", "Readers may see stale or conflicting data"],
          ],
          "CAP names the top and bottom rows. The middle is where products actually live."
        ),
        insight(
          "The most useful habit is to stop asking 'is this system consistent?' and start asking 'what does this operation need?'. In one product: a payment needs linearizable, a profile edit needs read-your-writes, a follower count is fine eventually consistent. Applying the strictest requirement to everything is how a system gets slow for no benefit.",
          "Per operation, not per system"
        ),
        h2("Coordination is expensive"),
        p(
          "Agreement between machines requires round trips, and a majority must participate. That puts a floor under latency that no amount of optimisation removes, and it means availability now depends on a majority being reachable."
        ),
        rp(
          "This is why the practical advice is ",
          { strong: "avoid needing coordination" },
          " rather than 'make coordination fast'. Partition data so that operations touch one partition. Model operations so that order does not matter. Make writes idempotent so a retry is harmless. Each of these removes a coordination requirement instead of paying for it."
        ),
        warn(
          "Distributed locks are the tool people reach for first and regret most. A lock held by a process that dies must eventually expire, and once it can expire, another process can acquire it while the first is merely slow — so the lock does not guarantee what it appears to. If correctness depends on mutual exclusion, you generally want a fencing token or a single-writer design, not a lock with a timeout.",
          "On distributed locks"
        ),
      ],
    },
    {
      slug: "queues-and-event-driven-work",
      title: "Queues and Event-Driven Work",
      summary:
        "Taking work off the request path: what it buys, and the four things you must then handle.",
      difficulty: "MEDIUM",
      readingMinutes: 10,
      objectives: [
        "Decide whether work belongs on the request path or behind a queue",
        "Handle retries, duplicates, ordering and poison messages deliberately",
        "Explain what a queue does to your latency story",
      ],
      keyTakeaways: [
        "A queue converts a latency problem into a throughput problem, and a synchronous failure into a delayed one.",
        "At-least-once delivery is the norm, so consumers must be idempotent.",
        "Every queue needs somewhere for messages that will never succeed.",
      ],
      content: [
        h2("What a queue is for"),
        p(
          "If a user action triggers work they do not need to wait for — send the email, transcode the video, rebuild the index — putting it behind a queue returns the response immediately and lets the work happen at whatever rate the workers manage."
        ),
        arch(
          {
            nodes: [
              { id: "c", kind: "client", label: "Client" },
              { id: "api", kind: "api", label: "API", note: "returns immediately" },
              { id: "q", kind: "queue", label: "Job Queue" },
              { id: "w", kind: "worker", label: "Workers", note: "scale independently" },
              { id: "db", kind: "database", label: "Database" },
            ],
            edges: [
              { id: "e1", from: "c", to: "api", kind: "sync" },
              { id: "e2", from: "api", to: "q", label: "enqueue", kind: "async" },
              { id: "e3", from: "q", to: "w", label: "consume", kind: "async" },
              { id: "e4", from: "w", to: "db", kind: "sync" },
              { id: "e5", from: "api", to: "db", kind: "sync" },
            ],
          },
          "The queue decouples the response from the work, and lets workers scale on their own."
        ),
        p(
          "The second benefit is absorption. A traffic spike that would overwhelm synchronous processing instead lengthens the queue; the work still happens, just later. The queue converts a capacity problem into a delay problem, which is usually the better problem."
        ),
        h2("The four things you now own"),
        table(
          ["Problem", "Why it appears", "Usual answer"],
          [
            ["Duplicates", "At-least-once delivery retries on doubt", "Idempotent consumers keyed on a message id"],
            ["Ordering", "Parallel consumers finish out of order", "Order per partition key, or design for commutativity"],
            ["Poison messages", "A message that always fails, retried forever", "Dead-letter queue after N attempts"],
            ["Invisible failure", "Nobody is waiting for the result", "Queue depth and consumer-lag alerts"],
          ],
          "Adding a queue is adding these four. Decide each on purpose."
        ),
        insight(
          "Idempotency is the one that repays the most effort. If processing the same message twice is harmless, retries become free and almost every other failure mode gets easier. Achieving it is usually as simple as recording processed message ids, or writing with a deterministic key so the second write overwrites rather than duplicates.",
          "Make the consumer idempotent first"
        ),
        h2("Where it goes wrong"),
        warn(
          "The failure mode nobody plans for is the silent one. A synchronous call that breaks produces an error somebody sees. A consumer that has been failing for six hours produces a growing number in a dashboard nobody opened. If work matters enough to queue, queue depth and consumer lag matter enough to alert on.",
          "Asynchronous failures are quiet"
        ),
        note(
          "A queue does not make the work cheaper — it makes the waiting somebody else's problem. If the work genuinely must finish before the user can continue, a queue plus polling is usually worse than doing it synchronously and being honest about the latency."
        ),
      ],
    },
  ],
};

export const INFRASTRUCTURE: SectionSeed = {
  slug: "infrastructure",
  title: "Infrastructure and Observability",
  summary:
    "Running the thing: where code executes, how services find each other, and how you see what happened.",
  chapters: [
    {
      slug: "seeing-what-happened",
      title: "Seeing What Happened",
      summary:
        "Logs, metrics and traces answer three different questions. Choosing the wrong one wastes an outage.",
      difficulty: "MEDIUM",
      readingMinutes: 9,
      objectives: [
        "Pick the right signal for the question being asked",
        "Explain why a trace is the only thing that answers 'where did the time go'",
        "Design an alert somebody should actually be woken by",
      ],
      keyTakeaways: [
        "Metrics say something is wrong; traces say where; logs say what.",
        "Alert on user-visible symptoms, not on causes.",
        "An alert nobody acts on trains people to ignore alerts.",
      ],
      content: [
        h2("Three signals, three questions"),
        table(
          ["Signal", "Shape", "Answers", "Costs"],
          [
            ["Metrics", "Numbers over time", "Is something wrong? Since when?", "Cheap; no detail"],
            ["Traces", "One request across services", "Where did the time go?", "Sampled; needs propagation"],
            ["Logs", "Events with context", "What exactly happened to this?", "Expensive at volume"],
          ],
          "Reach for the one that answers the question you have."
        ),
        p(
          "The usual order in an incident runs metrics to traces to logs: a metric tells you latency tripled at 14:02, a trace shows the time is spent waiting on one downstream call, and that service's logs show why. Starting with logs means grepping without knowing what you are looking for."
        ),
        insight(
          "Distributed tracing needs a request id propagated across every hop, including through queues. Retrofitting that later is tedious and always incomplete, which is why it is worth doing on day one, when it costs almost nothing.",
          "Propagate the request id early"
        ),
        h2("Alerting on symptoms"),
        p(
          "The temptation is to alert on causes — CPU above eighty percent, disk filling, a pod restarting. Most of these fire when nothing is wrong, and miss outages with none of those signatures."
        ),
        ul(
          "Alert on what a user would notice: error rate, latency at p99, work not completing.",
          "Page only for things a human must act on now; everything else is a dashboard or a ticket.",
          "Every alert should say what to do. An alert with no runbook is a notification.",
        ),
        warn(
          "The real cost of a noisy alert is not the interruption. It is that people learn to dismiss the channel, and the one that mattered arrives in a stream they have stopped reading.",
          "Alert fatigue is the failure"
        ),
      ],
    },
  ],
};

export const PATTERNS: SectionSeed = {
  slug: "architecture-patterns",
  title: "Architecture Patterns",
  summary:
    "Monolith, modular monolith, microservices and event-driven — as a sequence of trades rather than a ranking.",
  chapters: [
    {
      slug: "monolith-to-services",
      title: "From Monolith to Services",
      summary:
        "The question is not which is better. It is which problem you currently have.",
      difficulty: "MEDIUM",
      readingMinutes: 11,
      objectives: [
        "Describe what splitting a system actually buys, and in what unit",
        "Recognise a distributed monolith before building one",
        "Choose a boundary that survives the next feature",
      ],
      keyTakeaways: [
        "Microservices are primarily an organisational technique with technical consequences.",
        "A modular monolith gets most of the boundary benefit at none of the network cost.",
        "Splitting on the wrong boundary produces something worse than either option.",
      ],
      content: [
        h2("What splitting actually buys"),
        p(
          "Separate deployability, independent scaling, fault isolation, and teams that can move without coordinating. Every one of those is real. The last is usually the one that matters most, and it is a statement about people rather than software."
        ),
        concept(
          "The honest framing",
          "Microservices trade in-process calls — fast, reliable, atomic, easy to debug — for network calls that are slower, fail independently, cannot be transactional, and require distributed tracing to follow. You pay that continuously. You should be buying something specific with it."
        ),
        table(
          ["", "Monolith", "Modular monolith", "Microservices"],
          [
            ["Deploy", "All at once", "All at once", "Independently"],
            ["Calls", "In process", "In process", "Over the network"],
            ["Transactions", "Native", "Native", "Sagas and compensation"],
            ["Debugging", "One stack trace", "One stack trace", "Distributed tracing"],
            ["Team coupling", "High", "Moderate", "Low"],
            ["Operational load", "One thing", "One thing", "N things"],
          ],
          "The middle column is underused and often the right answer."
        ),
        h2("The modular monolith"),
        p(
          "Enforce module boundaries inside one deployable: each module owns its data, exposes an explicit interface, and reaching into another module's tables is a build error rather than a code review comment."
        ),
        p(
          "This captures most of the architectural benefit — clear ownership, independent reasoning, a boundary you could later split along — while calls stay in-process and transactions stay real. It is also the cheapest way to discover whether your boundaries are right, because getting them wrong costs a refactor rather than a migration."
        ),
        h2("The distributed monolith"),
        warn(
          "Services that must be deployed together, share a database, and break when any one of them is down have every cost of distribution and none of its benefits. It is the most common outcome of splitting too early, and the usual cause is a boundary drawn around technical layers rather than around what changes together.",
          "The failure mode to name"
        ),
        p(
          "A sound boundary means a typical feature touches one service. If most features require coordinated changes across three, the boundary is wrong — and no amount of tooling will fix that, because the problem is the line, not the plumbing."
        ),
        insight(
          "Useful test: could this piece be owned end to end by one team, deployed on its own schedule, and be down without the rest of the product becoming useless? Three yeses and it is a service. Otherwise it is a module.",
          "A boundary test"
        ),
      ],
    },
  ],
};
