/**
 * Interview preparation tracks.
 *
 * ## Why these are not companies
 *
 * An earlier iteration of the schema had a `Company` table, and the obvious
 * feature to build on it was "prepare for <employer>". Tech Epitome does not
 * build that, because it cannot do it honestly: it has no sourced, dated,
 * attributable record of what any company asks. Filling the provenance
 * columns with invented citations would have produced a feature that looks
 * authoritative and is not, which is worse than not having it.
 *
 * What is defensible is describing the SHAPES that interview loops come in.
 * A generalist loop at a large engineering organisation is a different
 * preparation problem from a startup's full-stack loop or an infrastructure
 * role, and saying so names nobody and asserts nothing about anyone.
 *
 * ## The provenance rule
 *
 * Every problem and exercise on a track carries `source`, `reportedAt`,
 * `confidence` and a one-sentence `rationale`, and the UI prints them beside
 * the recommendation. Here `source` is "Tech Epitome editorial" and
 * `sourceUrl` is null, because that is the truth: these are our judgements
 * about which of our own exercises rehearse which skill. The columns exist
 * so that if a real citation ever arrives, there is somewhere honest to put
 * it — and only then would naming an employer become defensible.
 */

export type PrepStage = { name: string; detail: string };
export type PrepRoadmapStep = { title: string; detail: string; weeks: string };

export type PrepTrackSeed = {
  slug: string;
  name: string;
  blurb: string;
  order: number;
  interviewStages: PrepStage[];
  focusAreas: string[];
  roadmap: PrepRoadmapStep[];
  /** Problem slugs, each with the reason it is on this track. */
  problems: { slug: string; rationale: string; confidence: number }[];
  /** System design exercise slugs, same rule. */
  systemDesign: { slug: string; rationale: string; confidence: number }[];
};

/**
 * Shared attribution. Deliberately repeated into every row rather than
 * defaulted, so a future row from a real source is a visible difference in
 * the seed rather than an omission nobody notices.
 */
export const PREP_SOURCE = "Tech Epitome editorial" as const;

export const PREP_TRACKS: PrepTrackSeed[] = [
  {
    slug: "generalist-loop",
    name: "Generalist engineering loop",
    blurb:
      "The shape most large engineering organisations converge on: two or three coding rounds on data structures, one system design round, and a behavioural round with a hiring manager. Breadth matters more than depth in any one area — the loop is designed so that no single round decides it.",
    order: 10,
    interviewStages: [
      {
        name: "Phone screen",
        detail:
          "One medium coding problem in 45 minutes, usually with a shared editor and no execution. Being able to reason about correctness without running the code is the actual skill.",
      },
      {
        name: "Coding rounds",
        detail:
          "Two rounds, one problem each, with the interviewer probing your approach before you write. Silence is the most common way these go wrong.",
      },
      {
        name: "System design",
        detail:
          "An open brief with no correct answer. You are being assessed on scoping, on whether your numbers are sane, and on whether you can say what your design gives up.",
      },
      {
        name: "Behavioural",
        detail:
          "Past behaviour, not hypotheticals. Expect follow-ups that push for what you personally did rather than what the team did.",
      },
    ],
    focusAreas: [
      "Arrays, hashing and two pointers — the substrate almost everything else sits on",
      "Sliding window and binary search, which between them cover a large share of medium problems",
      "Trees and graphs at traversal level; heavy algorithms are rare",
      "Being able to state complexity without being asked",
      "Eight or so behavioural stories you can tell in four minutes each",
    ],
    roadmap: [
      {
        title: "Rebuild the fundamentals",
        detail:
          "Complexity analysis, arrays, hashing. Do not skip these because they look easy — a shaky hash-map instinct costs you time in every later round.",
        weeks: "Weeks 1–2",
      },
      {
        title: "The high-frequency patterns",
        detail:
          "Two pointers, sliding window, binary search. Work them until you recognise the shape from the problem statement rather than after ten minutes of thinking.",
        weeks: "Weeks 3–4",
      },
      {
        title: "Trees, graphs and recursion",
        detail:
          "Traversal, not tricks. Most graph questions in a generalist loop are a BFS or a DFS with a twist in the state you carry.",
        weeks: "Weeks 5–6",
      },
      {
        title: "Design and delivery",
        detail:
          "One system design exercise a week, submitted before you read the reference. In parallel, write your behavioural stories down — the writing is what makes them tellable.",
        weeks: "Weeks 7–8",
      },
      {
        title: "Mock under time pressure",
        detail:
          "Mock interviews only, with the timer honest. The gap between solving a problem and solving it out loud in 40 minutes is the thing left to close.",
        weeks: "Week 9 onwards",
      },
    ],
    problems: [
      {
        slug: "sorted-pair-target",
        rationale:
          "The cheapest possible rehearsal of the two-pointer instinct, which a generalist loop leans on constantly.",
        confidence: 70,
      },
      {
        slug: "longest-distinct-stretch",
        rationale:
          "The canonical variable-window shape. If this one is fluent, most window problems become recognisable.",
        confidence: 70,
      },
      {
        slug: "first-failing-build",
        rationale:
          "Binary search on a predicate rather than on a sorted array — the version that actually appears once the problem is dressed up.",
        confidence: 65,
      },
      {
        slug: "group-by-signature",
        rationale:
          "Forces you to design a hash key, which is the part of hashing problems that is genuinely a decision.",
        confidence: 65,
      },
      {
        slug: "product-without-self",
        rationale:
          "Rehearses the prefix/suffix idea and the follow-up constraint that removes the obvious solution.",
        confidence: 60,
      },
      {
        slug: "reverse-chain",
        rationale:
          "Pointer manipulation with no room to be vague. Frequently the warm-up in a coding round.",
        confidence: 60,
      },
    ],
    systemDesign: [
      {
        slug: "short-link-service",
        rationale:
          "The smallest brief that still requires an API, a storage decision and a read/write asymmetry — a good first design round.",
        confidence: 70,
      },
      {
        slug: "notification-delivery",
        rationale:
          "Introduces queues, retries and at-least-once delivery, which is where most generalist design rounds end up.",
        confidence: 60,
      },
    ],
  },

  {
    slug: "startup-fullstack",
    name: "Startup full-stack loop",
    blurb:
      "Fewer rounds, less abstraction, more about whether you can ship. Expect a practical coding exercise over an algorithmic puzzle, a design conversation about a system the company actually runs, and a strong emphasis on ownership — because there is nobody else to hand it to.",
    order: 20,
    interviewStages: [
      {
        name: "Practical exercise",
        detail:
          "Building or extending something small, often with real tooling. Assessed on whether it works and whether the code reads well, not on optimality.",
      },
      {
        name: "Code conversation",
        detail:
          "Walking through what you built, or through code you have written before. Be ready to defend a decision you made months ago.",
      },
      {
        name: "Pragmatic design",
        detail:
          "A design round anchored on their real system rather than on a hypothetical at planetary scale. Over-engineering counts against you here.",
      },
      {
        name: "Ownership and fit",
        detail:
          "Behavioural, weighted heavily towards things you drove yourself and situations with no process to fall back on.",
      },
    ],
    focusAreas: [
      "Writing clear, testable code quickly — readability over cleverness",
      "Low-level design: where responsibilities go, and what a class is the only thing that knows",
      "Scoping a design to the size of the actual problem",
      "Stories about ownership, ambiguity, and shipping something nobody asked for",
    ],
    roadmap: [
      {
        title: "Design small systems properly",
        detail:
          "Work the low-level design exercises. Submit a class design before you read the reference — comparing afterwards is the whole exercise.",
        weeks: "Weeks 1–2",
      },
      {
        title: "Practise writing code that reads",
        detail:
          "Solve problems you already know how to solve, then rewrite the solution for clarity. That second pass is what the code conversation is about.",
        weeks: "Weeks 3–4",
      },
      {
        title: "One right-sized design",
        detail:
          "Take a design brief and deliberately solve it for a hundred users rather than a hundred million. Then say what would change at scale. Knowing the difference is the signal.",
        weeks: "Week 5",
      },
      {
        title: "Ownership stories",
        detail:
          "Write the four hardest ones: something you shipped alone, something that broke, something you pushed back on, something you dropped.",
        weeks: "Week 6",
      },
    ],
    problems: [
      {
        slug: "compress-run-lengths",
        rationale:
          "Short, unglamorous, and easy to write badly — which makes it a good rehearsal for a round judged on how the code reads.",
        confidence: 55,
      },
      {
        slug: "valid-nesting",
        rationale:
          "A stack problem whose edge cases are the entire difficulty. Rewards careful reading over cleverness.",
        confidence: 55,
      },
      {
        slug: "recent-request-counter",
        rationale:
          "A small stateful component with a real API — closer to the shape of a practical exercise than a puzzle is.",
        confidence: 60,
      },
      {
        slug: "normalise-and-compare",
        rationale:
          "String handling with ambiguous requirements. Clarifying before coding is the point.",
        confidence: 50,
      },
    ],
    systemDesign: [
      {
        slug: "short-link-service",
        rationale:
          "Right-sizeable: it can be answered honestly for a small product, which is what a pragmatic design round is looking for.",
        confidence: 60,
      },
    ],
  },

  {
    slug: "infrastructure-systems",
    name: "Infrastructure and systems loop",
    blurb:
      "Weighted towards design, reliability and what happens when things fail. The coding rounds are usually less exotic than a generalist loop, and the design rounds go considerably deeper — expect to be pushed on consistency, partitioning and failure modes rather than on feature breadth.",
    order: 30,
    interviewStages: [
      {
        name: "Coding",
        detail:
          "Usually one round, often closer to systems programming than to puzzles. Correctness under concurrency or partial failure is a common theme.",
      },
      {
        name: "Design, twice",
        detail:
          "Two design rounds is normal: one broad, one a deep dive into storage, partitioning or the write path.",
      },
      {
        name: "Failure and operations",
        detail:
          "What breaks, how you would know, and what you would do at 3am. Real incidents you have handled carry a lot of weight.",
      },
      {
        name: "Behavioural",
        detail:
          "Weighted towards ownership of production systems and how you handle being wrong in public.",
      },
    ],
    focusAreas: [
      "Estimation you can do out loud without a calculator",
      "Partitioning, replication, and what each one costs",
      "Queues, backpressure and at-least-once versus exactly-once",
      "Naming the bottleneck before being asked for it",
      "A genuine incident story with a root cause and a durable fix",
    ],
    roadmap: [
      {
        title: "Estimation and the storage layer",
        detail:
          "Get comfortable sizing a system out loud. Then work through the data-modelling and partitioning material until the trade-offs are yours rather than remembered.",
        weeks: "Weeks 1–3",
      },
      {
        title: "Every design exercise, submitted first",
        detail:
          "Do all of them, and commit to a design before reading the reference. The reference is only useful as a disagreement.",
        weeks: "Weeks 4–6",
      },
      {
        title: "Failure modes",
        detail:
          "For each design you have done, write down what fails first, how you would detect it, and what you would do. This is the round people are least prepared for.",
        weeks: "Week 7",
      },
      {
        title: "Mock design interviews",
        detail:
          "Design mock interviews until being pushed on a decision stops feeling like being caught out.",
        weeks: "Week 8 onwards",
      },
    ],
    problems: [
      {
        slug: "sliding-window-maximum",
        rationale:
          "The monotonic-deque idea, which is the closest a DSA problem gets to the amortised-cost reasoning these loops like.",
        confidence: 55,
      },
      {
        slug: "minimum-throughput",
        rationale:
          "Binary search on an answer with a capacity constraint — the same shape as sizing a system to a rate.",
        confidence: 65,
      },
      {
        slug: "stack-with-minimum",
        rationale:
          "Designing a data structure to meet a stated cost, rather than using one. That is the systems version of the question.",
        confidence: 55,
      },
      {
        slug: "top-frequency-codes",
        rationale:
          "Heap versus sort versus bucket — a genuine trade-off with no single right answer, which is how these rounds are graded.",
        confidence: 50,
      },
    ],
    systemDesign: [
      {
        slug: "request-rate-limiter",
        rationale:
          "Small enough to finish and deep enough to argue about: distributed counters, clock skew and what to do when the store is down.",
        confidence: 75,
      },
      {
        slug: "notification-delivery",
        rationale:
          "Retries, idempotency and delivery guarantees — the deep-dive round in an infrastructure loop, almost verbatim.",
        confidence: 70,
      },
      {
        slug: "short-link-service",
        rationale:
          "Worth doing for the read/write asymmetry and the cache-invalidation conversation it leads to.",
        confidence: 55,
      },
    ],
  },
];
