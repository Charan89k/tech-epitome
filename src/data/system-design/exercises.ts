import type { Difficulty } from "@/generated/prisma/enums";
import type { Diagram } from "@/lib/diagram/types";

/**
 * System-design exercises.
 *
 * Every requirement, constraint and trade-off here is written for this
 * platform. The *subjects* are unavoidably familiar — a link shortener and
 * a rate limiter are common because they are genuinely good teaching
 * vehicles — but the framing, the numbers, the discussion points and the
 * reference architectures are original, and the scenarios are deliberately
 * given neutral settings rather than being framed as any company's system.
 *
 * The reference architecture is withheld by `services/system-design.ts`
 * until the learner submits their own. An exercise whose answer is on the
 * page is a worked example.
 */

export type ExerciseSeed = {
  slug: string;
  title: string;
  tagline: string;
  difficulty: Difficulty;
  access?: "FREE" | "PRO";
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  /** Worked estimates, shown as reasoning rather than as facts. */
  scaleEstimate: Record<string, string>;
  apiDesign: { method: string; path: string; purpose: string }[];
  dataModel: { name: string; fields: string; notes?: string }[];
  bottlenecks: string[];
  architecture: Diagram;
  tradeoffs: { decision: string; chose: string; over: string; because: string }[];
  scalingNotes: { stage: string; problem: string; response: string }[];
};

export const SYSTEM_DESIGN_EXERCISES: ExerciseSeed[] = [
  {
    slug: "short-link-service",
    title: "Short Link Service",
    tagline: "Turn long URLs into short ones, and redirect billions of times.",
    difficulty: "EASY",
    functionalRequirements: [
      "Accept a long URL and return a short code that redirects to it",
      "Allow an optional custom code, rejected if already taken",
      "Redirect a short code to its target with an HTTP redirect",
      "Let the creator see how many times their link was followed",
      "Allow an optional expiry after which the code stops resolving",
    ],
    nonFunctionalRequirements: [
      "Redirects should complete well under 100 ms at p99",
      "A code, once issued, must never resolve to a different target",
      "Redirect availability matters far more than creation availability",
      "Codes should not be guessable in bulk",
    ],
    scaleEstimate: {
      "New links per day": "10 million (~100/second average)",
      "Redirects per day": "200 million (~2,000/second average)",
      "Read:write ratio": "20:1 — this is a read system with a write feature attached",
      "Peak multiplier": "~3x average, so ~6,000 redirects/second",
      "Storage per year": "~1.8 TB at ~500 bytes per link",
      "Code space": "7 chars of [A-Za-z0-9] ≈ 3.5 trillion codes",
    },
    apiDesign: [
      { method: "POST", path: "/v1/links", purpose: "Create a short link, optionally with a custom code" },
      { method: "GET", path: "/{code}", purpose: "Resolve and redirect; the hot path" },
      { method: "GET", path: "/v1/links/{code}/stats", purpose: "Follow count for the creator" },
      { method: "DELETE", path: "/v1/links/{code}", purpose: "Revoke a link you own" },
    ],
    dataModel: [
      { name: "Link", fields: "code (PK), targetUrl, ownerId, createdAt, expiresAt", notes: "Read by code on every redirect" },
      { name: "FollowEvent", fields: "code, occurredAt, coarseRegion", notes: "Append-only; aggregated, never read per row" },
    ],
    bottlenecks: [
      "Redirect reads dominate everything else by an order of magnitude",
      "Counting every follow synchronously turns a read into a write",
      "A single link going viral concentrates load on one key",
      "Custom codes need a uniqueness check on the write path",
    ],
    architecture: {
      nodes: [
        { id: "client", kind: "client", label: "Client" },
        { id: "cdn", kind: "cdn", label: "Edge", note: "caches hot codes" },
        { id: "lb", kind: "load_balancer", label: "Load Balancer" },
        { id: "api", kind: "api", label: "Redirect API", note: "stateless" },
        { id: "cache", kind: "cache", label: "Code Cache", note: "code → target" },
        { id: "db", kind: "database", label: "Link Store", note: "source of truth" },
        { id: "q", kind: "queue", label: "Follow Events", note: "fire and forget" },
        { id: "worker", kind: "worker", label: "Stats Worker" },
        { id: "stats", kind: "database", label: "Stats Store", note: "aggregates" },
      ],
      edges: [
        { id: "e1", from: "client", to: "cdn", kind: "sync" },
        { id: "e2", from: "cdn", to: "lb", label: "on miss", kind: "sync" },
        { id: "e3", from: "lb", to: "api", kind: "sync" },
        { id: "e4", from: "api", to: "cache", label: "read", kind: "sync" },
        { id: "e5", from: "api", to: "db", label: "on miss", kind: "sync" },
        { id: "e6", from: "api", to: "q", label: "record follow", kind: "async" },
        { id: "e7", from: "q", to: "worker", kind: "async" },
        { id: "e8", from: "worker", to: "stats", kind: "sync" },
      ],
    },
    tradeoffs: [
      {
        decision: "How codes are generated",
        chose: "Random codes with a collision retry",
        over: "A monotonic counter encoded to base62",
        because:
          "A counter is denser and needs no retry, but it makes every issued code enumerable — a competitor can walk your entire link set. Randomness costs an occasional retry at these volumes and buys unguessability.",
      },
      {
        decision: "When follow counts are updated",
        chose: "Asynchronously, via a queue",
        over: "A synchronous increment on the redirect path",
        because:
          "A synchronous counter turns every read into a write and makes the hot path depend on the write store. Counts that lag a few seconds are perfectly acceptable for this feature; a slow redirect is not.",
      },
      {
        decision: "Whether to cache at the edge",
        chose: "Yes, with a short TTL",
        over: "Origin-only caching",
        because:
          "Redirects are the definition of cacheable: tiny, immutable while they live, and requested from everywhere. The TTL bounds how long a revoked link can still resolve, which is the cost being accepted.",
      },
      {
        decision: "Consistency of link creation",
        chose: "Strong, on the write path only",
        over: "Eventually consistent creation",
        because:
          "A code must never resolve to two different targets, so the uniqueness check has to be authoritative. This is affordable precisely because creates are a hundredth of the traffic.",
      },
    ],
    scalingNotes: [
      { stage: "Early", problem: "Nothing is stressed", response: "One database, one cache, a few stateless API instances" },
      { stage: "Reads climb", problem: "Database read load grows", response: "Raise cache hit rate; add read replicas" },
      { stage: "A link goes viral", problem: "One key concentrates traffic", response: "Edge caching absorbs it; the key is immutable so this is safe" },
      { stage: "Storage grows", problem: "Single node runs out of room", response: "Partition by code hash — reads are by primary key, so no cross-partition queries" },
    ],
  },
  {
    slug: "request-rate-limiter",
    title: "Request Rate Limiter",
    tagline: "Decide, in under a millisecond, whether this caller may proceed.",
    difficulty: "MEDIUM",
    functionalRequirements: [
      "Allow or reject a request against a per-caller quota",
      "Support several named policies with different limits and windows",
      "Tell the caller when they may retry",
      "Apply limits per API key, per user and per IP independently",
    ],
    nonFunctionalRequirements: [
      "The check must add no meaningful latency to a request",
      "Limits should hold across many application instances",
      "The limiter failing must not take the API down with it",
      "Counting must be accurate enough to be fair, not perfectly exact",
    ],
    scaleEstimate: {
      "Requests checked": "50,000/second across the fleet",
      "Distinct keys": "~2 million active in any window",
      "State per key": "~100 bytes (counter, window start)",
      "Total working set": "~200 MB — comfortably in memory",
      "Latency budget": "under 1 ms, so at most one network hop",
    },
    apiDesign: [
      { method: "internal", path: "check(key, policy)", purpose: "Returns allowed, remaining, resetAt" },
      { method: "GET", path: "/v1/limits/{key}", purpose: "Current consumption, for support and debugging" },
      { method: "PUT", path: "/v1/policies/{name}", purpose: "Define or update a policy" },
    ],
    dataModel: [
      { name: "Policy", fields: "name, limit, windowSeconds, scope", notes: "Small, cacheable, rarely changes" },
      { name: "Counter", fields: "key, windowStart, count", notes: "Hot, short-lived, in memory" },
    ],
    bottlenecks: [
      "Every single request pays the check, so its cost is multiplied by all traffic",
      "Shared counters require coordination between instances",
      "A fixed window lets a caller send double the limit across a boundary",
      "The limiter becomes a dependency of everything it protects",
    ],
    architecture: {
      nodes: [
        { id: "client", kind: "client", label: "Caller" },
        { id: "gw", kind: "api", label: "API Gateway", note: "runs the check" },
        { id: "local", kind: "cache", label: "Local Counter", note: "per instance, short TTL" },
        { id: "shared", kind: "cache", label: "Shared Counter", note: "atomic increment" },
        { id: "svc", kind: "service", label: "Protected Service" },
        { id: "cfg", kind: "database", label: "Policy Store" },
      ],
      edges: [
        { id: "e1", from: "client", to: "gw", kind: "sync" },
        { id: "e2", from: "gw", to: "local", label: "fast path", kind: "sync" },
        { id: "e3", from: "gw", to: "shared", label: "increment", kind: "sync" },
        { id: "e4", from: "gw", to: "svc", label: "if allowed", kind: "sync" },
        { id: "e5", from: "gw", to: "cfg", label: "load policies", kind: "sync" },
      ],
    },
    tradeoffs: [
      {
        decision: "Which counting algorithm",
        chose: "Sliding window counter",
        over: "Fixed window",
        because:
          "A fixed window is trivial but permits twice the limit across a boundary — send the full quota at 0:59 and again at 1:00. A sliding window approximates the true rate with one extra number and removes that hole.",
      },
      {
        decision: "Where counters live",
        chose: "Shared store, with a local fast path",
        over: "Purely per-instance counters",
        because:
          "Per-instance counters mean the effective limit is the policy times the fleet size, which is not a limit. A shared store makes it real; the local layer keeps the common case off the network.",
      },
      {
        decision: "Behaviour when the limiter is unreachable",
        chose: "Fail open, and alert",
        over: "Fail closed",
        because:
          "Failing closed turns a limiter outage into a total outage — the protective control becomes the incident. Failing open risks a window of unlimited traffic, which is the lesser harm for most APIs. A limiter in front of something genuinely destructive should invert this.",
      },
      {
        decision: "Exactness of counting",
        chose: "Approximate, biased toward allowing",
        over: "Exact counting via coordination",
        because:
          "Exactness requires coordination on every request, which costs more latency than the thing it protects. Being occasionally generous by a few requests is invisible; adding a millisecond to every request is not.",
      },
    ],
    scalingNotes: [
      { stage: "Single instance", problem: "None", response: "In-process counters are correct and free" },
      { stage: "Several instances", problem: "Limits multiply by fleet size", response: "Move counters to a shared in-memory store" },
      { stage: "Shared store saturates", problem: "One store, all traffic", response: "Shard by key; counters are independent so this partitions perfectly" },
      { stage: "Cross-region", problem: "Coordination costs more than the limit is worth", response: "Limit per region and accept the looser global bound" },
    ],
  },
  {
    slug: "notification-delivery",
    title: "Notification Delivery",
    tagline: "Fan one event out to many people across several channels, exactly once enough.",
    difficulty: "MEDIUM",
    access: "PRO",
    functionalRequirements: [
      "Accept an event and deliver it to the right recipients",
      "Support several channels: in-app, email, push",
      "Respect per-user channel preferences and quiet hours",
      "Collapse repeated notifications about the same subject",
      "Let a user read their in-app history",
    ],
    nonFunctionalRequirements: [
      "In-app delivery should feel immediate; email may take longer",
      "A user must never receive the same notification twice",
      "A failing channel provider must not block the others",
      "Preferences must be honoured even under retry",
    ],
    scaleEstimate: {
      "Events per day": "20 million",
      "Average fan-out": "~8 recipients per event",
      "Deliveries per day": "~160 million (~1,600/second average)",
      "Peak multiplier": "~5x, driven by scheduled digests",
      "Retention": "90 days of in-app history",
    },
    apiDesign: [
      { method: "POST", path: "/v1/events", purpose: "Publish an event for fan-out" },
      { method: "GET", path: "/v1/notifications", purpose: "The signed-in user's in-app feed" },
      { method: "POST", path: "/v1/notifications/read", purpose: "Mark one or many as read" },
      { method: "PUT", path: "/v1/preferences", purpose: "Per-channel and quiet-hour settings" },
    ],
    dataModel: [
      { name: "Event", fields: "id, type, subjectId, payload, createdAt" },
      { name: "Delivery", fields: "id, userId, eventId, channel, status, dedupeKey", notes: "Unique on (userId, dedupeKey)" },
      { name: "Preference", fields: "userId, channel, enabled, quietFrom, quietTo" },
    ],
    bottlenecks: [
      "Fan-out turns one write into many, so the write amplification is the system",
      "Third-party providers rate limit and fail independently",
      "Preference checks sit on the hot path for every recipient",
      "A popular subject can fan out to an enormous audience at once",
    ],
    architecture: {
      nodes: [
        { id: "producer", kind: "service", label: "Producing Service" },
        { id: "api", kind: "api", label: "Ingest API" },
        { id: "events", kind: "queue", label: "Event Queue" },
        { id: "fanout", kind: "worker", label: "Fan-out Worker", note: "expands to recipients" },
        { id: "prefs", kind: "cache", label: "Preference Cache" },
        { id: "perchan", kind: "queue", label: "Per-channel Queues", note: "isolates failures" },
        { id: "senders", kind: "worker", label: "Channel Senders" },
        { id: "providers", kind: "external", label: "Email / Push Providers" },
        { id: "store", kind: "database", label: "Delivery Store", note: "dedupe key unique" },
      ],
      edges: [
        { id: "e1", from: "producer", to: "api", kind: "sync" },
        { id: "e2", from: "api", to: "events", kind: "async" },
        { id: "e3", from: "events", to: "fanout", kind: "async" },
        { id: "e4", from: "fanout", to: "prefs", kind: "sync" },
        { id: "e5", from: "fanout", to: "store", label: "claim dedupe key", kind: "sync" },
        { id: "e6", from: "fanout", to: "perchan", kind: "async" },
        { id: "e7", from: "perchan", to: "senders", kind: "async" },
        { id: "e8", from: "senders", to: "providers", kind: "sync" },
      ],
    },
    tradeoffs: [
      {
        decision: "When fan-out happens",
        chose: "On write, into per-recipient rows",
        over: "On read, computed per request",
        because:
          "Read-time fan-out keeps writes tiny but makes every feed load expensive and makes read-state hard. Write-time fan-out costs storage and write amplification, and it is the right trade when feeds are read far more often than events are produced.",
      },
      {
        decision: "How duplicates are prevented",
        chose: "A unique dedupe key per (user, subject, window)",
        over: "Trusting at-least-once delivery not to duplicate",
        because:
          "Queues retry on doubt, so duplicates are certain rather than possible. A uniqueness constraint in the store makes the second attempt a no-op and turns an ordering problem into a database problem, which is where it is easiest to solve.",
      },
      {
        decision: "Channel isolation",
        chose: "A separate queue per channel",
        over: "One queue for all deliveries",
        because:
          "A single queue means an email provider outage blocks push and in-app behind it. Separate queues let each channel fail, back off and drain on its own schedule.",
      },
      {
        decision: "Very large fan-outs",
        chose: "Chunked expansion with checkpointing",
        over: "Expanding the whole audience in one task",
        because:
          "A single task expanding a million recipients holds one worker for minutes and restarts from zero on failure. Chunking makes progress durable and lets the work spread across workers.",
      },
    ],
    scalingNotes: [
      { stage: "Low volume", problem: "None", response: "Send inline; a queue would be premature" },
      { stage: "Providers throttle", problem: "Bursts exceed provider limits", response: "Queue per channel with rate-limited consumers" },
      { stage: "Fan-out dominates", problem: "One event blocks a worker", response: "Chunk expansion, checkpoint progress" },
      { stage: "Feed reads grow", problem: "History queries slow", response: "Index on (userId, createdAt); age rows out past retention" },
    ],
  },
];
