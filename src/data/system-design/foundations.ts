import {
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
 * Foundations: the vocabulary.
 *
 * Every system-design conversation runs on a handful of words that people
 * use loosely and mean differently — "scalable", "available", "consistent".
 * A learner who cannot say what they mean by availability cannot reason
 * about a trade-off involving it, so the vocabulary comes first and
 * everything later is expressed in it.
 *
 * All prose here is original.
 */
export const FOUNDATIONS: SectionSeed = {
  slug: "foundations",
  title: "Foundations",
  summary:
    "The words the rest of the track is written in: scale, latency, throughput, availability and the difference between them.",
  chapters: [
    {
      slug: "what-scale-actually-means",
      title: "What Scale Actually Means",
      summary:
        "Scaling is not 'make it faster'. It is keeping a property constant while a number grows.",
      difficulty: "EASY",
      readingMinutes: 8,
      objectives: [
        "State what quantity is growing before claiming a system scales",
        "Distinguish vertical from horizontal scaling by what fails first",
        "Recognise the point where adding machines stops helping",
      ],
      keyTakeaways: [
        "\"Scalable\" is meaningless until you say which number grows and which property must hold.",
        "Vertical scaling ends at the biggest machine you can buy; horizontal scaling ends at the part you cannot split.",
        "The bottleneck moves. Solving one exposes the next.",
      ],
      content: [
        h2("Scaling is a sentence with two halves"),
        p(
          "People say a system scales as though it were a property of the code. It is not. Scaling is a claim with two halves, and a claim missing either half cannot be checked."
        ),
        rp(
          "The first half is ",
          { strong: "what grows" },
          ": users, requests per second, stored bytes, concurrent connections, size of a single item. The second half is ",
          { strong: "what must stay constant" },
          ": response time, correctness, cost per request, operational effort."
        ),
        concept(
          "A usable definition",
          "A system scales along some dimension if you can grow that dimension by adding resources, without the properties you care about degrading and without the cost per unit rising."
        ),
        p(
          "Write it out for a real system and the vagueness disappears. \"This service scales\" becomes \"this service can go from one thousand to one hundred thousand writes per second by adding API instances, keeping the ninety-ninth percentile under two hundred milliseconds, at roughly linear cost.\" That is a sentence somebody can disagree with, which is what makes it useful."
        ),
        h2("Two directions, two different ceilings"),
        p(
          "There are only two ways to give a system more resources, and they fail for different reasons."
        ),
        table(
          ["", "Vertical", "Horizontal"],
          [
            ["What you do", "Bigger machine", "More machines"],
            ["Code changes", "Usually none", "Often substantial"],
            ["Ceiling", "The largest machine available", "The part that cannot be split"],
            ["Failure domain", "One machine, all of it", "One machine, a fraction of it"],
            ["Cost curve", "Superlinear at the top end", "Roughly linear, plus coordination"],
          ],
          "The two directions, and where each one stops."
        ),
        p(
          "Vertical scaling is genuinely underrated. It requires no distributed systems, no partitioning scheme, no consensus, and a single large machine today is very large indeed. The reason it is not the end of the story is that its ceiling is fixed by what the market sells, and that one machine is a single failure domain: when it goes, everything goes."
        ),
        p(
          "Horizontal scaling removes that ceiling and replaces it with a harder question — what happens to the parts of the system that cannot simply be duplicated?"
        ),
        insight(
          "Stateless components scale horizontally almost for free. Stateful ones are the entire subject of this track. Everything difficult in system design is downstream of the fact that data has to live somewhere specific.",
          "Where the difficulty actually is"
        ),
        h2("The bottleneck always moves"),
        p(
          "A system has one bottleneck at a time. Remove it and you do not get a system without a bottleneck; you get a system whose bottleneck is somewhere else."
        ),
        flow(
          [
            { id: "c", kind: "client", label: "Client" },
            { id: "lb", kind: "load_balancer", label: "Load Balancer" },
            { id: "api", kind: "api", label: "API Servers", note: "stateless, easy" },
            { id: "db", kind: "database", label: "Database", note: "the real limit" },
          ],
          "Adding API servers is cheap. It moves the pressure onto the database, which is where it stays."
        ),
        p(
          "This is why the honest answer to \"how would you scale this?\" is a sequence rather than an architecture. First the web tier saturates and you add instances. Then the database's connection count saturates and you pool. Then read throughput saturates and you add replicas. Then write throughput saturates, and now you are partitioning, which is a different kind of problem with a different kind of cost."
        ),
        warn(
          "Designing for the fourth bottleneck before you have met the first is the most common failure in system design interviews, and in real systems. You pay the complexity immediately and collect the benefit possibly never.",
          "Do not skip ahead"
        ),
        h2("How to use this in practice"),
        ul(
          "Say what grows and what must hold. If you cannot, you do not yet have a design problem, you have a slogan.",
          "Start with the simplest thing that meets today's numbers, and know which bottleneck you expect to hit first.",
          "When you add a component, say which bottleneck it removes and which one it exposes.",
          "Treat 'we could scale vertically for now' as a legitimate answer, not a cop-out."
        ),
        note(
          "Throughout this track, diagrams are data rather than pictures. Open 'Describe this diagram in words' under any of them to read the same structure as text — useful for notes, and for checking you actually understood the flow."
        ),
      ],
    },
    {
      slug: "latency-throughput-availability",
      title: "Latency, Throughput and Availability",
      summary:
        "Three numbers that are constantly confused, and the reason averages lie about all of them.",
      difficulty: "EASY",
      readingMinutes: 10,
      objectives: [
        "Separate latency from throughput and explain why improving one can worsen the other",
        "Read a percentile and say what it claims about real users",
        "Convert an availability target into an error budget",
      ],
      keyTakeaways: [
        "Latency is per request; throughput is per unit time. A queue improves throughput and worsens latency.",
        "Average latency describes nobody. Design against p99.",
        "Availability is a budget you spend, not a number you promise.",
      ],
      content: [
        h2("Latency and throughput are not the same axis"),
        p(
          "Latency is how long one request takes. Throughput is how many requests complete per second. They feel like the same thing and they are not — a system can improve one by sacrificing the other, and frequently should."
        ),
        concept(
          "The standard illustration",
          "A courier carrying one envelope across a city has low latency and terrible throughput. A lorry that leaves once a day carrying a hundred thousand envelopes has enormous throughput and dreadful latency. Both 'deliver post'. Neither substitutes for the other."
        ),
        p(
          "Batching is the clearest case. Group a hundred writes into one transaction and total throughput climbs sharply, because the fixed cost is paid once. But the first write in the batch now waits for the ninety-ninth, so its latency got worse. That is a real trade and often the right one — it is only a mistake when it is made accidentally."
        ),
        h2("Averages describe nobody"),
        p(
          "Suppose a hundred requests: ninety-nine take ten milliseconds and one takes two seconds. Mean latency is about thirty milliseconds. No request took thirty milliseconds. The number is arithmetically correct and describes no user's experience."
        ),
        table(
          ["Measure", "Says", "Use it for"],
          [
            ["p50 (median)", "The typical request", "Is the common path healthy?"],
            ["p95", "The slow twentieth", "Where degradation starts"],
            ["p99", "The slow hundredth", "What your worst-served users get"],
            ["max", "The single worst", "Finding pathological cases, not SLOs"],
          ],
          "Percentiles, and what each is actually for."
        ),
        insight(
          "On a page that makes twenty backend calls, roughly one in five page loads contains a p99 call. The tail is not a rare edge case — at fan-out, the tail is the median experience.",
          "Why p99 is not pedantry"
        ),
        h2("Availability is a budget"),
        p(
          "Availability is usually quoted as a number of nines. The useful move is to convert it immediately into time, because time is something a team can reason about."
        ),
        table(
          ["Target", "Downtime per year", "Per month", "Feels like"],
          [
            ["99%", "~3.7 days", "~7.2 hours", "Noticeably unreliable"],
            ["99.9%", "~8.8 hours", "~44 minutes", "One bad afternoon a year"],
            ["99.99%", "~53 minutes", "~4.4 minutes", "Needs redundancy everywhere"],
            ["99.999%", "~5 minutes", "~26 seconds", "Needs automation, not people"],
          ],
          "Nines translated into the only unit anyone can feel."
        ),
        p(
          "The reason to phrase it as a budget rather than a promise is that it makes the engineering decision explicit. Ninety-nine point nine percent means you may be down for forty-four minutes a month. If a deploy takes the system down for two minutes, you can afford twenty-two deploys — or you can invest in deploys that do not cause downtime. That is a conversation with a number in it."
        ),
        warn(
          "Dependencies multiply. A service that needs five dependencies, each independently available 99.9% of the time, is available about 99.5% of the time — roughly 3.6 hours of downtime a month before its own code has a single bug. Every synchronous dependency you add spends budget you did not have to spend.",
          "The arithmetic of dependencies"
        ),
        h2("Reliability is not availability"),
        p(
          "A system that responds instantly with the wrong answer is available and unreliable. One that is occasionally down but never wrong is reliable and less available. They pull in different directions: the usual way to raise availability is to serve something when the authoritative source is unreachable, and the usual thing you serve is stale."
        ),
        p(
          "Deciding which one matters more is a product question, not an engineering one, and it differs per endpoint inside the same system. A stale follower count is fine. A stale account balance is not."
        ),
      ],
    },
    {
      slug: "estimating-before-designing",
      title: "Estimating Before Designing",
      summary:
        "Rough numbers, computed out loud, that decide which architecture is even on the table.",
      difficulty: "MEDIUM",
      readingMinutes: 9,
      objectives: [
        "Turn a user count into requests per second and bytes per year",
        "Use an estimate to eliminate architectures rather than to sound precise",
        "State assumptions so a wrong estimate is correctable rather than misleading",
      ],
      keyTakeaways: [
        "Estimates exist to rule options out, not to be right.",
        "Peak is what you provision for; average is what you pay for.",
        "An unstated assumption is the actual error, not the arithmetic.",
      ],
      content: [
        h2("Why estimate at all"),
        p(
          "The purpose of a back-of-the-envelope estimate is not accuracy. It is elimination. If the answer is forty requests per second, a single machine with a single database is correct and everything else is overengineering. If it is four hundred thousand, sharding is not optional. The estimate decides which conversation you are having."
        ),
        insight(
          "Being wrong by a factor of two rarely changes the design. Being wrong by a factor of a thousand always does. Estimate to the nearest order of magnitude and move on.",
          "The precision that matters"
        ),
        h2("The numbers worth memorising"),
        p(
          "A handful of reference points make arithmetic possible without a calculator. These are deliberately round."
        ),
        table(
          ["Quantity", "Round value"],
          [
            ["Seconds in a day", "~100,000"],
            ["Seconds in a month", "~2.5 million"],
            ["Memory read, 1 MB", "~microseconds"],
            ["SSD random read", "~100 microseconds"],
            ["Round trip within a datacentre", "~0.5 ms"],
            ["Round trip across an ocean", "~150 ms"],
            ["One character of UTF-8 text", "~1 byte"],
            ["A modest JSON record", "~1 KB"],
          ],
          "Enough to do the arithmetic in your head."
        ),
        note(
          "The ratio that shapes most designs: a cross-continent round trip costs roughly three hundred times a within-datacentre one. That single fact is why CDNs exist, why chatty protocols fail, and why 'just call the other service' is not free."
        ),
        h2("A worked estimate"),
        p(
          "Take a link-shortening service. Ten million people use it, and each creates one link a day and follows twenty."
        ),
        ul(
          "Writes: 10 million/day ÷ 100,000 seconds ≈ 100 writes per second.",
          "Reads: 200 million/day ÷ 100,000 ≈ 2,000 reads per second.",
          "Read:write ratio ≈ 20:1 — this is a read-heavy system, which is the single most important thing the estimate told us.",
          "Storage: 10 million links/day × 500 bytes ≈ 5 GB/day, ≈ 1.8 TB/year.",
          "Peak: assume 3× average, so ~6,000 reads per second at the busy hour."
        ),
        p(
          "Now read what that implies. Two thousand reads per second is comfortably within one well-indexed database with a cache in front. One hundred writes per second is nothing at all. Under two terabytes a year fits on one machine for several years. So the correct first architecture is unglamorous: one database, one cache, several stateless API servers — and the estimate is what justifies refusing to shard."
        ),
        warn(
          "Notice that every one of those numbers came from an assumption that was invented. That is fine, provided the assumption is said out loud: 'I am assuming twenty reads per write; if it is two hundred, the cache stops being optional and becomes the system.' An estimate with hidden assumptions is worse than no estimate, because it looks like knowledge.",
          "State the assumption, always"
        ),
        h2("Peak, not average"),
        p(
          "Traffic is never flat. A consumer product might see three to five times its daily average in the evening peak, and a product tied to an event can see far more than that for a short window."
        ),
        p(
          "You provision for peak and you pay for average, which is the entire commercial argument for elastic infrastructure. When you cannot scale elastically, the peak multiple is what sizes the fleet — and it is worth asking whether the peak can be flattened instead, by moving work off the request path and into a queue."
        ),
      ],
    },
  ],
};
