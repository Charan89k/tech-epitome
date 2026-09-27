import {
  arch,
  concept,
  flow,
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
 * How a request reaches you, and where the data sits when it arrives.
 *
 * These two sections are paired deliberately: almost every latency
 * question is answered somewhere on the path from the user's DNS lookup to
 * the row on disk, and a learner who only knows one half keeps proposing
 * caches for problems that are actually network round trips.
 *
 * All prose original.
 */

export const NETWORKING: SectionSeed = {
  slug: "networking",
  title: "Networking",
  summary:
    "The path a request takes before your code runs, and the four places you can intervene on it.",
  chapters: [
    {
      slug: "the-path-of-a-request",
      title: "The Path of a Request",
      summary:
        "DNS, TCP, TLS and HTTP — what each one costs, and why the first request is always the slow one.",
      difficulty: "EASY",
      readingMinutes: 9,
      objectives: [
        "Account for the round trips before a single byte of your response is sent",
        "Explain why connection reuse matters more than payload size for small responses",
        "Identify which parts of the path you control and which you do not",
      ],
      keyTakeaways: [
        "A cold request pays DNS, TCP and TLS before your handler runs.",
        "For small responses, round trips dominate and bytes barely matter.",
        "You cannot optimise a path you have not counted.",
      ],
      content: [
        h2("Before your code runs"),
        p(
          "By the time a request handler executes, several round trips have already happened. Counting them is the cheapest performance work available, because each one is a fixed cost you pay regardless of how fast your code is."
        ),
        ul(
          "DNS resolution: turn a name into an address. Cached aggressively, but a cold lookup can cost tens of milliseconds.",
          "TCP handshake: one round trip to establish the connection.",
          "TLS handshake: one or two more, depending on version and whether the session resumes.",
          "The request itself: one more round trip before the first response byte.",
        ),
        insight(
          "On a connection to another continent at roughly 150 ms per round trip, a cold HTTPS request can spend most of a second on setup before your handler is invoked. Making the handler twice as fast changes almost nothing. Reusing the connection changes everything.",
          "Where the time actually went"
        ),
        h2("Four places to intervene"),
        p(
          "Everything in this section is one of four moves, and it is worth being able to name which one you are making."
        ),
        table(
          ["Move", "What it does", "Best for"],
          [
            ["Get closer", "Serve from a location near the user", "Static assets, cacheable reads"],
            ["Reuse the connection", "Avoid repeating handshakes", "Chatty clients, service-to-service"],
            ["Send less", "Compress, paginate, trim fields", "Large payloads on slow links"],
            ["Send less often", "Batch, coalesce, cache client-side", "High-frequency small calls"],
          ],
          "Nearly every network optimisation is one of these four."
        ),
        warn(
          "Compressing a 400-byte JSON response saves perhaps 200 bytes and costs a round trip's worth of nothing. For small responses the payload is not the problem — the trip is. Measure before you compress.",
          "The common mistake"
        ),
      ],
    },
    {
      slug: "load-balancers-and-cdns",
      title: "Load Balancers, Proxies and CDNs",
      summary:
        "Three boxes that all sit in front of your servers, and the genuinely different jobs they do.",
      difficulty: "MEDIUM",
      readingMinutes: 10,
      objectives: [
        "Distinguish a load balancer from a reverse proxy from a CDN by responsibility",
        "Choose a balancing strategy from the shape of the workload",
        "Explain why a load balancer needs health checks to be worth having",
      ],
      keyTakeaways: [
        "A load balancer spreads load; a reverse proxy adds behaviour; a CDN moves content closer.",
        "Without health checks, a load balancer reliably sends traffic to a dead machine.",
        "Sticky sessions are a way of avoiding shared state, and they cost you elasticity.",
      ],
      content: [
        h2("Three boxes, three jobs"),
        p(
          "They are often the same piece of software configured differently, which is exactly why the distinction is worth holding onto — the question is never 'which product' but 'which responsibility'."
        ),
        table(
          ["", "Question it answers", "Typically knows about"],
          [
            ["Load balancer", "Which instance handles this?", "Your fleet's health"],
            ["Reverse proxy", "What should happen to this request?", "Auth, rate limits, routing, TLS"],
            ["CDN", "Can this be served from nearer the user?", "Cacheability, geography"],
          ],
          "Same shape on a diagram, different reasons to exist."
        ),
        flow(
          [
            { id: "c", kind: "client", label: "Client" },
            { id: "cdn", kind: "cdn", label: "CDN", note: "static + cacheable" },
            { id: "lb", kind: "load_balancer", label: "Load Balancer" },
            { id: "api", kind: "api", label: "API Servers" },
          ],
          "The CDN answers what it can. Everything else continues to your fleet."
        ),
        h2("Choosing a strategy"),
        p(
          "How a balancer picks an instance matters more as requests become less uniform."
        ),
        table(
          ["Strategy", "Picks", "Breaks down when"],
          [
            ["Round robin", "The next one in order", "Requests differ wildly in cost"],
            ["Least connections", "The least busy", "Connections are long-lived but idle"],
            ["Hash on key", "Deterministically by user or key", "The fleet changes size"],
            ["Random with two choices", "Better of two at random", "Rarely — a strong default"],
          ],
          "Strategies, and the workload that defeats each."
        ),
        insight(
          "Round robin is fine when every request costs about the same. The moment one endpoint takes a hundred times longer than another, round robin will cheerfully pile the expensive ones onto one instance. 'Pick two at random, send to the less loaded' avoids almost all of that for almost no cost.",
          "A good default"
        ),
        h2("Health checks are the point"),
        p(
          "A load balancer without health checks is a hazard: it will keep routing a share of traffic to an instance that is dead, and it will do so with perfect fairness. The health check is what turns balancing into availability."
        ),
        warn(
          "A health check that only proves the process is listening will pass on an instance whose database connection pool is exhausted. A check that exercises the real dependencies can take the whole fleet out at once when a shared dependency wobbles. Neither extreme is right — check what this instance can serve, not what the world looks like.",
          "Checking the wrong thing"
        ),
        h2("Sticky sessions"),
        p(
          "Pinning a user to an instance lets you keep their session in that instance's memory. It is a real technique with a real cost: instances stop being interchangeable, so removing one drops those users' sessions, and load can no longer be evened out."
        ),
        rp(
          "The alternative is to move session state out — into a ",
          { code: "cache" },
          " or a signed token the client carries — which makes every instance identical again. That is usually the better trade, and it is the same principle as the previous section: ",
          { strong: "stateless components scale horizontally almost for free" },
          "."
        ),
      ],
    },
  ],
};

export const DATA: SectionSeed = {
  slug: "data",
  title: "Data",
  summary:
    "Where state lives: relational and non-relational stores, indexes, replicas, partitions and caches.",
  chapters: [
    {
      slug: "choosing-a-datastore",
      title: "Choosing a Datastore",
      summary:
        "SQL versus NoSQL is the wrong question. Access pattern versus data model is the right one.",
      difficulty: "MEDIUM",
      readingMinutes: 10,
      objectives: [
        "Choose a store from access patterns rather than from category",
        "Say what a relational database gives you that you would otherwise build",
        "Recognise when a second, specialised store is justified",
      ],
      keyTakeaways: [
        "Start relational unless you can name the specific property it fails to give you.",
        "Most 'NoSQL for scale' decisions are really 'we did not want to model the data'.",
        "Every additional store is a consistency problem you now own.",
      ],
      content: [
        h2("The question people ask, and the question that helps"),
        p(
          "\"SQL or NoSQL\" sorts databases by their query language, which is close to the least interesting thing about them. The useful questions are about what you will do with the data."
        ),
        ul(
          "How do you read it? By primary key, by range, by arbitrary filters, by full text?",
          "How does it change? Append-only, frequent small updates, bulk rewrites?",
          "What must be true across records? Nothing, or invariants spanning several?",
          "How big is it, and how fast does it grow?",
        ),
        concept(
          "A defensible default",
          "Start with a relational database. It gives transactions, constraints, joins, a mature query planner and a decade of operational knowledge. Move off it for a specific property it does not provide — not for a feeling about scale."
        ),
        h2("What you give up by leaving"),
        p(
          "The properties a relational store provides are not conveniences; they are things you will otherwise implement yourself, less well."
        ),
        table(
          ["Property", "If you leave, you now own"],
          [
            ["Transactions", "Reasoning about partial writes by hand"],
            ["Foreign keys", "Orphaned records and the cleanup jobs to find them"],
            ["Joins", "Fan-out queries in application code, and their N+1s"],
            ["Schema", "Every historical shape of every record, forever"],
            ["Query planner", "Hand-tuned access paths that rot as data grows"],
          ],
          "The bill for 'schemaless'."
        ),
        insight(
          "Document stores did not abolish schemas. They moved the schema into the application, where it is enforced by whichever code path happens to run — and where five years of old shapes accumulate in the same collection.",
          "Schemaless is a relocation, not a removal"
        ),
        h2("When a second store is genuinely right"),
        p(
          "Specialised stores earn their place when an access pattern is badly served by the primary one — full-text relevance ranking, very high write-rate time series, large binary objects, graph traversals many hops deep."
        ),
        warn(
          "The moment you have two stores holding related data, you have a synchronisation problem: they will disagree, and you must decide which one is right and how the other catches up. That is a real ongoing cost. Two stores is sometimes correct; two stores by accident never is.",
          "The cost of the second store"
        ),
      ],
    },
    {
      slug: "replication-partitioning-caching",
      title: "Replication, Partitioning and Caching",
      summary:
        "Three different answers to three different problems, routinely confused with one another.",
      difficulty: "HARD",
      readingMinutes: 12,
      objectives: [
        "Match each technique to the bottleneck it actually removes",
        "Choose a partition key by what it does to your queries, not your data",
        "Name the invalidation strategy before adding a cache",
      ],
      keyTakeaways: [
        "Replication buys read throughput and redundancy. Partitioning buys write throughput and capacity. Caching buys latency.",
        "A bad partition key is the most expensive mistake in this chapter, because it is the hardest to undo.",
        "A cache without an invalidation answer is a plan to serve wrong data.",
      ],
      content: [
        h2("Three problems, three tools"),
        table(
          ["Technique", "Removes", "Does not help with", "New problem"],
          [
            ["Replication", "Read throughput, single-node failure", "Write throughput", "Replication lag"],
            ["Partitioning", "Write throughput, storage limits", "Cross-partition queries", "Hot partitions, rebalancing"],
            ["Caching", "Latency, repeated expensive reads", "Writes, uncacheable reads", "Staleness, invalidation"],
          ],
          "Reach for the one that matches your bottleneck."
        ),
        h2("Replication and the lag you now have"),
        p(
          "Copy the data to more machines and reads spread across them while any single loss stops being fatal. The cost is that copies are not instantaneous."
        ),
        arch(
          {
            nodes: [
              { id: "api", kind: "api", label: "API" },
              { id: "primary", kind: "database", label: "Primary", note: "all writes" },
              { id: "r1", kind: "database", label: "Replica", note: "reads" },
              { id: "r2", kind: "database", label: "Replica", note: "reads" },
            ],
            edges: [
              { id: "w", from: "api", to: "primary", label: "writes", kind: "sync" },
              { id: "r1e", from: "api", to: "r1", label: "reads", kind: "sync" },
              { id: "r2e", from: "api", to: "r2", label: "reads", kind: "sync" },
              { id: "rep1", from: "primary", to: "r1", kind: "replication" },
              { id: "rep2", from: "primary", to: "r2", kind: "replication" },
            ],
          },
          "One primary takes writes; replicas serve reads and lag behind by some amount."
        ),
        p(
          "Asynchronous replication means a read from a replica may not reflect a write that has already been acknowledged. Concretely: a user updates their profile, the write succeeds, the page reloads, the read lands on a lagging replica, and their change appears to have vanished. Nothing is broken and the user is certain it is."
        ),
        insight(
          "The standard fix is 'read your own writes': route a user's reads to the primary for a short window after they write, or pin them to the replica that has caught up. It is a small amount of routing logic that removes an entire category of bug report.",
          "Read your own writes"
        ),
        h2("Partitioning, and the key you cannot change"),
        p(
          "Partitioning splits data so each machine holds a slice. It is the only technique here that raises write throughput, and its whole character is decided by one choice: the partition key."
        ),
        ul(
          "Partition by a key your queries filter on, or every query becomes a fan-out to every shard.",
          "Prefer a key with high cardinality and even distribution — partitioning by country puts most of the load on a handful of shards.",
          "Beware keys that concentrate recent activity: partitioning by timestamp sends every write to the newest shard.",
        ),
        warn(
          "Changing a partition key on a live system means rewriting every row into a new layout while serving traffic. It is among the most expensive operations in this entire track. Spend disproportionate time on this decision — it is nearly irreversible, and almost nothing else here is.",
          "The one decision to labour over"
        ),
        h2("Caching, and the invalidation you must name"),
        p(
          "A cache stores the result of expensive work close to whoever needs it. It buys latency and reduces load, and it introduces the possibility of serving something that is no longer true."
        ),
        table(
          ["Strategy", "How it works", "Trade"],
          [
            ["Cache-aside", "App checks cache, falls back to store, populates", "Simple; first read after a miss is slow"],
            ["Write-through", "Writes go to cache and store together", "Cache always warm; writes slower"],
            ["Write-behind", "Write to cache, flush to store later", "Fast writes; data loss window"],
            ["TTL only", "Expire after a fixed time", "Trivial; bounded staleness by design"],
          ],
          "Pick one on purpose."
        ),
        p(
          "The rule worth carrying: before adding a cache, answer 'how does an entry become wrong, and what removes it?' If the answer is a time-to-live, say what staleness is acceptable. If the answer is explicit invalidation, say who is responsible for firing it. A cache with no answer will serve wrong data, and the bug will surface far from the cache."
        ),
        note(
          "Thundering herd: when a popular key expires, every concurrent request misses at once and they all hit the database together. The fixes are small — a short lock so one request repopulates, or jittered expiry so keys do not expire in lockstep — but they must be deliberate."
        ),
      ],
    },
  ],
};
