import {
  beforeAfter,
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
 * Concurrency in object design, and five modelling case studies.
 *
 * Appended after the workflow section, which closes on "decide where
 * thread safety belongs". The concurrency chapters pick that thread up and
 * go one level deeper: which state is shared, who owns it, and how two
 * requests for the same seat are told apart. The case studies then run the
 * seven-step procedure from "From Brief to Design" on classic briefs, and
 * each one leans on at least one earlier chapter rather than re-teaching it.
 *
 * All prose and examples original.
 */

const CONCURRENCY: SectionSeed = {
  slug: "concurrency-in-design",
  title: "Concurrency in Object Design",
  summary:
    "Where shared mutable state comes from, how to remove it or guard it, and how to stop two requests from booking the same thing.",
  chapters: [
    // -----------------------------------------------------------------------
    {
      slug: "thread-safety-and-immutability",
      title: "Thread Safety and Immutability",
      summary:
        "A race needs shared, mutable state. Take away either word and the race cannot happen — that is most of thread-safe design.",
      difficulty: "MEDIUM",
      readingMinutes: 13,
      objectives: [
        "Explain why a read-modify-write on a shared field loses updates",
        "Write a genuinely immutable value class in Java and Python",
        "Change a shared value safely by swapping immutable snapshots",
        "Choose between immutability, confinement and locking for a given type",
      ],
      keyTakeaways: [
        "A data race needs sharing, mutation and no coordination. Remove any one and it is gone.",
        "Immutability is the cheapest form of thread safety: no lock, no protocol, no documentation.",
        "`final` and frozen dataclasses are shallow — the objects they point at must be immutable too.",
        "Confinement means exactly one thread can reach the object, so it never needs a lock.",
        "Locks are the last resort, applied to the one type that owns the state that must be shared.",
      ],
      content: [
        h2("Where concurrency bugs come from"),
        p(
          "Every concurrency bug in an object model has the same three ingredients: some state is reachable from more than one thread, at least one of those threads changes it, and nothing coordinates the accesses. That is a useful definition because it is a checklist. If you can remove any one of the three, there is nothing left to go wrong."
        ),
        code(
          "java",
          `final class HitCounter {
    private int count = 0;

    void hit() {
        count++;      // read, add, write: three steps, not one
    }

    int count() { return count; }
}`,
          "Looks atomic. Is not.",
          [5]
        ),
        worked(
          "count = 41; threads T1 and T2 both call hit()",
          "count = 42 — one hit has vanished, and no exception said so",
          [
            { state: "T1 reads 41", note: "T1 loads the field into a register." },
            { state: "T2 reads 41", note: "T2 loads the same, still-unchanged value." },
            { state: "T1 writes 42", note: "T1 adds one and stores." },
            {
              state: "T2 writes 42",
              note: "T2 adds one to its stale copy and overwrites T1's work.",
            },
          ],
          "A lost update"
        ),
        concept(
          "The three ingredients",
          "Shared (reachable from more than one thread), mutable (some thread changes it after construction), uncoordinated (no lock, atomic or queue orders the accesses). Thread-safe design is choosing which ingredient to remove, and the order of preference is: stop sharing, then stop mutating, and only then coordinate."
        ),
        h2("Immutable value objects"),
        rp(
          "An object that cannot change after its constructor finishes can be handed to any number of threads with no further thought. In Java that takes more than skipping the setters: the class is ",
          { code: "final" },
          " so no subclass can add mutable state, every field is ",
          { code: "private final" },
          ", mutable inputs are copied on the way in, and nothing mutable is handed out on the way out."
        ),
        code(
          "java",
          `public final class Itinerary {
    private final String travellerId;
    private final List<Leg> legs;          // Leg is itself a record

    public Itinerary(String travellerId, List<Leg> legs) {
        this.travellerId = Objects.requireNonNull(travellerId);
        this.legs = List.copyOf(legs);     // defensive copy, and unmodifiable
    }

    public List<Leg> legs() { return legs; }   // safe to hand out

    public Itinerary withLeg(Leg leg) {        // "change" = new object
        List<Leg> next = new ArrayList<>(legs);
        next.add(leg);
        return new Itinerary(travellerId, next);
    }
}`,
          "Every path to the state is either a copy or read-only.",
          [7, 12]
        ),
        beforeAfter(
          {
            label: "Mutable Address, shared",
            values: [
              "T1 reads city",
              "T2 setCity + setPin",
              "T1 reads pin",
              "new pin, old city",
            ],
          },
          {
            label: "Immutable Address, swapped",
            values: [
              "T1 holds address v1",
              "T2 builds address v2",
              "T1 still reads v1",
              "always consistent",
            ],
          },
          {
            title: "Two fields that must agree",
            note: "With a mutable object, a reader can observe half of a two-field update. With an immutable one, a reader sees the whole old value or the whole new value, never a mixture.",
          }
        ),
        warn(
          "`final` stops a field being reassigned; it does nothing to the object the field points at. A `private final List<Leg>` initialised with the caller's ArrayList is still mutable by the caller. The same is true in Python: a frozen dataclass holding a list can have that list appended to. Immutability has to go all the way down.",
          "Shallow immutability"
        ),
        code(
          "python",
          `from dataclasses import dataclass, replace
from decimal import Decimal


@dataclass(frozen=True)
class Money:
    amount: Decimal
    currency: str

    def plus(self, other: "Money") -> "Money":
        if other.currency != self.currency:
            raise ValueError("currency mismatch")
        return replace(self, amount=self.amount + other.amount)


@dataclass(frozen=True)
class Basket:
    lines: tuple[Money, ...]   # tuple, not list: frozen all the way down`,
          "frozen=True blocks reassignment; the tuple blocks the rest."
        ),
        h2("Changing a shared, immutable value"),
        rp(
          "Sometimes a value really does need to change while other threads are reading it — a configuration, a routing table, a set of feature flags. The pattern is copy-on-write: keep an immutable snapshot behind an ",
          { code: "AtomicReference" },
          ", let readers grab whichever snapshot is current, and let writers build a new snapshot and swap it in atomically."
        ),
        code(
          "java",
          `final class FeatureFlags {
    private final AtomicReference<Map<String, Boolean>> current =
        new AtomicReference<>(Map.of());

    boolean isOn(String flag) {                 // readers never block
        return current.get().getOrDefault(flag, false);
    }

    void set(String flag, boolean on) {
        current.updateAndGet(old -> {           // may retry under contention,
            Map<String, Boolean> next = new HashMap<>(old);   // so no side effects here
            next.put(flag, on);
            return Map.copyOf(next);
        });
    }
}`,
          "Readers see a whole map; writers race only on the swap."
        ),
        note(
          "`updateAndGet` is a compare-and-set loop underneath: it applies your function, then swaps only if nobody else swapped first, and retries if they did. That is the same idea as the version check in the double-booking chapter, at the scale of one field."
        ),
        h2("Confinement"),
        p(
          "The other way to remove an ingredient is to stop sharing. An object that only one thread can reach is thread-safe without being immutable, because there is nobody to race with. The discipline is making sure the reference never escapes."
        ),
        ul(
          "Stack confinement — a local variable inside a method. Each call has its own; nothing else can see it.",
          "Request confinement — an object created per request and dropped at the end of it, such as a builder or a unit-of-work.",
          "Owner-thread confinement — one thread (or a single-threaded executor) owns the state, and every other thread sends it messages instead of touching it. The elevator case study uses exactly this.",
          "ThreadLocal — per-thread copies of something expensive, such as a non-thread-safe formatter. Useful, and easy to leak in thread pools, so reach for it last."
        ),
        compare(
          [
            {
              label: "Immutability",
              time: "No coordination on reads",
              space: "A new object per change",
              when: "Values: money, dates, ids, coordinates, events, configuration snapshots. Anything whose identity is its contents.",
              preferred: true,
            },
            {
              label: "Confinement",
              time: "No coordination at all",
              space: "None extra",
              when: "Working state that belongs to one request or one owner thread, and can stay that way if references are not leaked.",
            },
            {
              label: "Synchronisation",
              time: "Contention under load",
              space: "Lock per guarded object",
              when: "State that genuinely must be shared and changed in place — a seat map, an account balance. Keep it inside one owning type.",
            },
          ],
          "Three ways to be thread-safe"
        ),
        h3("Safe publication"),
        p(
          "A last subtlety. Building an object correctly is not enough if another thread can see the reference before the constructor's writes are visible. Java's memory model guarantees that final fields are seen fully initialised by any thread that obtains the reference, provided `this` did not escape during construction — another reason immutable classes are the easy case. For mutable objects, publish through something that provides the ordering: a volatile field, an atomic reference, a concurrent collection, or a lock."
        ),
        table(
          ["Kind of type", "Default strategy"],
          [
            ["Value object (Money, DateRange, Position)", "Immutable"],
            [
              "Per-request working object (builder, command)",
              "Confined to the request",
            ],
            [
              "Read-mostly shared data (config, routing table)",
              "Immutable snapshot behind an atomic reference",
            ],
            [
              "Shared, frequently changed state (inventory, balances)",
              "One owning type, internally synchronised",
            ],
            [
              "Entity with a lifecycle (Order, Booking)",
              "Owned by one aggregate; concurrency handled at the store",
            ],
          ],
          "Decide per type, before writing any lock."
        ),
        insight(
          "Asking 'which of these types needs to be shared and mutable at all?' usually shrinks the concurrency problem to one or two classes. Those are the only places where locks belong, and they are the only places a reviewer has to think hard about.",
          "Shrink the problem first"
        ),
      ],
    },

    // -----------------------------------------------------------------------
    {
      slug: "locks-queues-producer-consumer",
      title: "Locks, Queues and Producer–Consumer",
      summary:
        "Guarding the state that must be shared: critical sections, how big a lock should be, bounded queues for handing work between threads, and how deadlock happens.",
      difficulty: "HARD",
      readingMinutes: 15,
      objectives: [
        "Keep a check-then-act sequence inside one critical section",
        "Choose a lock granularity from the contention it will see",
        "Decouple producers and consumers with a bounded queue that applies backpressure",
        "Name the four conditions for deadlock and break one of them by design",
      ],
      keyTakeaways: [
        "A lock protects an invariant, not a field; every step that reads or changes the invariant goes under the same lock.",
        "Two individually synchronised calls do not make a synchronised pair.",
        "Finer locks buy throughput at the cost of more ways to get ordering wrong.",
        "A bounded queue turns overload into back-pressure; an unbounded one turns it into an out-of-memory crash later.",
        "Global lock ordering removes circular wait, which removes deadlock.",
      ],
      content: [
        h2("Critical sections protect invariants"),
        p(
          "A lock gives two guarantees. Mutual exclusion: only one thread at a time runs code guarded by it. Visibility: everything a thread wrote before releasing the lock is visible to the next thread that acquires it. Together they let you treat a sequence of steps as if it were one."
        ),
        code(
          "java",
          `final class Account {
    private long balanceCents;   // invariant: never negative

    synchronized void deposit(long cents) {
        balanceCents += cents;
    }

    synchronized boolean withdraw(long cents) {
        if (balanceCents < cents) return false;   // check ...
        balanceCents -= cents;                     // ... and act, under one lock
        return true;
    }

    synchronized long balance() { return balanceCents; }
}`,
          "The check and the act share one critical section.",
          [9, 10]
        ),
        warn(
          "`if (account.balance() >= 500) account.withdraw(500);` is still a race even though both methods are synchronised: the lock is released between the two calls, and another thread can withdraw in the gap. Compound operations belong inside the owning class as one method, which is a design reason — not just a concurrency one — to tell objects what to do rather than asking them for data.",
          "Check-then-act across calls"
        ),
        h2("Lock granularity"),
        p(
          "How much state one lock covers is a trade-off. One lock for everything is easy to reason about and serialises all work. One lock per small piece of state allows parallelism, but every operation that spans pieces now has to take several locks, and that is where ordering bugs live."
        ),
        compare(
          [
            {
              label: "One global lock",
              time: "Fully serialised",
              space: "One lock",
              when: "Low traffic, or operations that genuinely touch everything. Start here when correctness matters more than throughput.",
            },
            {
              label: "Lock per aggregate (per show, per account)",
              time: "Parallel across aggregates",
              space: "One lock per aggregate",
              when: "Most operations touch one aggregate. The usual sweet spot, because aggregate boundaries are also consistency boundaries.",
              preferred: true,
            },
            {
              label: "Lock striping",
              time: "Parallel across stripes",
              space: "Fixed array of locks",
              when: "Many small keys, too many to give each a lock. Hash the key to one of N locks.",
            },
            {
              label: "Concurrent collection / atomics",
              time: "Lock-free or fine-grained",
              space: "Library-managed",
              when: "The invariant fits a single atomic operation such as putIfAbsent or compute. Prefer this to a lock you wrote yourself.",
            },
          ],
          "How much should one lock cover?"
        ),
        code(
          "java",
          `// Coarse: claims for different shows wait for each other.
final class SeatRegistry {
    private final Map<ShowId, Set<SeatId>> taken = new HashMap<>();

    synchronized boolean claim(ShowId show, SeatId seat) {
        return taken.computeIfAbsent(show, s -> new HashSet<>()).add(seat);
    }
}

// Finer: only claims for the same show contend, and the library
// does the locking.
final class ConcurrentSeatRegistry {
    private final ConcurrentMap<ShowId, Set<SeatId>> taken =
        new ConcurrentHashMap<>();

    boolean claim(ShowId show, SeatId seat) {
        return taken
            .computeIfAbsent(show, s -> ConcurrentHashMap.newKeySet())
            .add(seat);                       // atomic: false if already taken
    }
}`,
          "Same contract, very different contention."
        ),
        tip(
          "Hold a lock for as little as possible, and never call code you do not control while holding it — listeners, callbacks, I/O, a network call. You cannot know what locks that code takes or how long it blocks, which makes it the most common source of both stalls and deadlocks.",
          "No alien calls under a lock"
        ),
        h2("Producer–consumer with a bounded queue"),
        p(
          "Often the cleanest answer to shared state is to not share it, and pass work between threads instead. Producers put tasks on a queue; consumers take them off. The queue is the only shared object, it is thread-safe by construction, and neither side needs to know the other exists or how fast it runs."
        ),
        code(
          "java",
          `final class ThumbnailPipeline {
    private static final Upload STOP = new Upload("__stop__");
    private final BlockingQueue<Upload> queue = new ArrayBlockingQueue<>(500);

    // Producer side: called from request threads.
    boolean submit(Upload upload) throws InterruptedException {
        return queue.offer(upload, 2, TimeUnit.SECONDS);   // false = shed load
    }

    // Consumer side: each of N worker threads runs this.
    void runWorker() throws InterruptedException {
        while (true) {
            Upload next = queue.take();                    // blocks while empty
            if (next == STOP) return;
            render(next);
        }
    }

    void shutdown(int workers) throws InterruptedException {
        for (int i = 0; i < workers; i++) queue.put(STOP); // one pill per worker
    }
}`,
          "The queue owns all the coordination.",
          [3, 7, 13]
        ),
        concept(
          "Backpressure",
          "A bounded queue makes a fast producer feel a slow consumer: when the queue is full, the producer waits, times out or is refused. That is the system telling the truth about its capacity. An unbounded queue hides the mismatch until memory runs out, and by then every queued item is late anyway."
        ),
        beforeAfter(
          {
            label: "Unbounded queue depth",
            values: ["100", "5,000", "40,000", "300,000", "out of memory"],
          },
          {
            label: "Bounded (1,000) queue depth",
            values: ["100", "1,000", "1,000", "1,000", "1,000"],
          },
          {
            title: "A burst that outlasts the consumers",
            note: "The bounded queue caps memory and pushes the overload back to the callers, who can retry, degrade or fail fast. The unbounded one absorbs it silently until the process dies.",
          }
        ),
        code(
          "python",
          `import queue
import threading

jobs: queue.Queue = queue.Queue(maxsize=500)
STOP = object()


def worker() -> None:
    while True:
        job = jobs.get()          # blocks while empty
        try:
            if job is STOP:
                return
            render(job)
        finally:
            jobs.task_done()


def submit(job) -> None:
    jobs.put(job, timeout=2)      # raises queue.Full after 2 s: shed load


threads = [threading.Thread(target=worker, daemon=True) for _ in range(4)]`,
          "The same shape in Python's standard library."
        ),
        h2("Deadlock"),
        p(
          "Deadlock needs four conditions at once: resources are held exclusively, a thread holds one resource while waiting for another, nothing can force a thread to give a resource up, and there is a cycle of threads each waiting for the next. Remove any one condition and deadlock is impossible. The cycle is usually the easiest one to remove."
        ),
        code(
          "java",
          `// Deadlock-prone: lock order depends on argument order.
void transfer(Account from, Account to, long cents) {
    synchronized (from) {
        synchronized (to) {
            from.debit(cents);
            to.credit(cents);
        }
    }
}

// Fixed: every thread locks in the same global order (by id).
// Assumes ids are unique and from != to.
void transfer(Account from, Account to, long cents) {
    Account first  = from.id() < to.id() ? from : to;
    Account second = first == from ? to : from;
    synchronized (first) {
        synchronized (second) {
            from.debit(cents);
            to.credit(cents);
        }
    }
}`,
          "Same work, no cycle."
        ),
        worked(
          "T1 runs transfer(A, B); T2 runs transfer(B, A), at the same moment",
          "Both threads wait forever. With id ordering, both lock A first, so one simply waits for the other to finish.",
          [
            { state: "T1 holds A", note: "T1 enters the outer block on A." },
            { state: "T2 holds B", note: "T2 enters the outer block on B." },
            { state: "T1 waits for B", note: "Held by T2." },
            { state: "T2 waits for A", note: "Held by T1. The cycle is closed." },
          ],
          "How the cycle forms"
        ),
        table(
          ["Technique", "Condition it removes", "Cost"],
          [
            [
              "Global lock ordering",
              "Circular wait",
              "Every multi-lock path must follow the order",
            ],
            [
              "tryLock with timeout, then release and retry",
              "Hold-and-wait",
              "Retry logic; possible livelock without back-off",
            ],
            ["One coarser lock over both objects", "Hold-and-wait", "Less parallelism"],
            [
              "Single owner thread fed by a queue",
              "Shared exclusive resources altogether",
              "Throughput limited to one thread per owner",
            ],
          ],
          "Each fix breaks one of the four conditions."
        ),
        insight(
          "Nested locks are often a modelling smell. If a transfer must lock two accounts, perhaps the thing being changed is not two accounts but one ledger — and a ledger that records an immutable transfer entry needs one lock, or none.",
          "The design-level fix"
        ),
      ],
    },

    // -----------------------------------------------------------------------
    {
      slug: "reservations-and-double-booking",
      title: "Designing for Concurrent Access: Reservations and Double-Booking",
      summary:
        "Two people click 'book' on the last seat at the same moment. Pessimistic locks, version checks, compare-and-set and idempotent commands — and when each is the right answer.",
      difficulty: "HARD",
      readingMinutes: 16,
      objectives: [
        "Explain why an in-process lock cannot prevent double-booking across servers",
        "Implement optimistic concurrency with a version column and a conditional update",
        "Choose between pessimistic and optimistic control from the expected contention",
        "Make a booking command safe to retry with an idempotency key",
      ],
      keyTakeaways: [
        "Check-then-act across a network is a race; the check and the write must be one atomic step at the store.",
        "Pessimistic control locks before reading; optimistic control detects conflict when writing.",
        "A conditional update that reports rows affected is compare-and-set for a database.",
        "Retries are normal, so commands that change money or inventory need idempotency keys.",
        "Modelling a hold with an expiry turns a long-running lock into an ordinary state transition.",
      ],
      content: [
        h2("The double-booking problem"),
        p(
          "Seat 14C is free. Two customers, served by two different application servers, each load the seat map, see it free, and press 'book'. Each server checks the seat, finds it free, and writes a booking. Both customers get a confirmation email for the same seat."
        ),
        worked(
          "Seat 14C is FREE; requests from Asha (server 1) and Ben (server 2) arrive together",
          "Two bookings for one seat. Every individual step was correct.",
          [
            {
              state: "S1 reads 14C: FREE",
              note: "Asha's request checks availability.",
            },
            {
              state: "S2 reads 14C: FREE",
              note: "Ben's request checks, before S1 has written.",
            },
            { state: "S1 writes BOOKED (Asha)", note: "Asha's booking is saved." },
            {
              state: "S2 writes BOOKED (Ben)",
              note: "Ben's write overwrites or duplicates it.",
            },
          ],
          "The same lost update, now across machines"
        ),
        p(
          "This is the hit-counter race from the first chapter, one level up. A `synchronized` block cannot fix it, because the two requests are in different processes. The check and the write have to become one atomic step at the only thing both servers share: the data store."
        ),
        concept(
          "Pessimistic versus optimistic",
          "Pessimistic control assumes conflict is likely, so it locks the record before reading and makes everyone else wait. Optimistic control assumes conflict is rare, so it reads freely and checks at write time whether anyone changed the record in between — and if they did, the write fails and the caller decides what to do."
        ),
        h2("Pessimistic: lock, then decide"),
        code(
          "sql",
          `BEGIN;

SELECT status
  FROM seats
 WHERE show_id = 42 AND seat_no = '14C'
   FOR UPDATE;              -- a second transaction blocks here

-- application checks status = 'FREE'

UPDATE seats
   SET status = 'HELD', held_by = 'asha'
 WHERE show_id = 42 AND seat_no = '14C';

COMMIT;                     -- the waiting transaction now reads 'HELD'`,
          "Row lock held only for the length of the transaction."
        ),
        warn(
          "Never hold a database lock while waiting for a human. A customer who opens the payment page and goes to make tea would hold the row lock — and a connection — for ten minutes. The lock must last milliseconds; the customer's claim on the seat is a different thing, and it belongs in the model as a hold with an expiry.",
          "Locks are not reservations"
        ),
        h2("Optimistic: versions and compare-and-set"),
        rp(
          "Give each row a ",
          { code: "version" },
          " number. Read it with the data. When writing, update only if the version is still the one you read, and bump it. If someone else wrote first, the version has moved, the update matches zero rows, and you know you lost the race."
        ),
        code(
          "sql",
          `UPDATE seats
   SET status   = 'HELD',
       held_by  = 'ben',
       version  = version + 1
 WHERE show_id = 42
   AND seat_no = '14C'
   AND version = 3;          -- the version Ben read

-- 1 row affected: Ben has the seat.
-- 0 rows affected: someone changed it first. Re-read and decide.`,
          "The WHERE clause is the compare; the SET is the swap.",
          [7]
        ),
        code(
          "java",
          `final class HoldSeatHandler {
    private final SeatRepository seats;

    HoldResult handle(HoldSeat cmd) {
        Seat seat = seats.find(cmd.seatId());       // carries version 3
        if (!seat.isFree()) return HoldResult.taken();

        seat.holdFor(cmd.customer());               // domain rule, in memory
        boolean saved = seats.saveIfVersion(seat, seat.version());
        return saved ? HoldResult.held(seat.id())   // version is now 4
                     : HoldResult.taken();          // lost the race
    }
}`,
          "The domain object stays ignorant of the database; the repository does the conditional write."
        ),
        beforeAfter(
          {
            label: "No version check",
            values: [
              "A reads v3 FREE",
              "B reads v3 FREE",
              "A writes BOOKED",
              "B writes BOOKED",
              "double-booked",
            ],
          },
          {
            label: "Conditional on version",
            values: [
              "A reads v3 FREE",
              "B reads v3 FREE",
              "A: v3 to v4, 1 row",
              "B: v3? 0 rows",
              "B told: seat taken",
            ],
          },
          {
            title: "The same interleaving, with and without compare-and-set",
            note: "Nothing about the timing changed. What changed is that the second write is conditional, so it fails loudly instead of succeeding wrongly.",
          }
        ),
        p(
          "The in-memory version of the same idea is any atomic operation that checks and sets together. Inside one process, a concurrent map's conditional methods give you compare-and-set per key without writing a lock."
        ),
        code(
          "java",
          `final class SeatHolds {
    private final ConcurrentMap<SeatId, CustomerId> holders =
        new ConcurrentHashMap<>();

    boolean hold(SeatId seat, CustomerId who) {
        return holders.putIfAbsent(seat, who) == null;   // atomic check-and-set
    }

    boolean release(SeatId seat, CustomerId who) {
        return holders.remove(seat, who);                // only if still theirs
    }
}`,
          "Correct within one process — and only within one process."
        ),
        compare(
          [
            {
              label: "Pessimistic row lock (FOR UPDATE)",
              time: "Waits under contention",
              space: "Lock per row, per txn",
              when: "Hot rows with frequent conflict, where retrying would waste more work than waiting. Keep the transaction short.",
            },
            {
              label: "Optimistic version check",
              time: "No waiting; retry on conflict",
              space: "One version column",
              when: "Conflicts are rare, reads are many, and a conflict can be reported or retried cheaply. The usual default for entities.",
              preferred: true,
            },
            {
              label: "Unique constraint",
              time: "Insert fails on duplicate",
              space: "One index",
              when: "The invariant is 'at most one X per key' — one booking per (show, seat). Use it as the last line of defence even when you use one of the others.",
            },
            {
              label: "In-process lock or atomic",
              time: "Fast",
              space: "Memory only",
              when: "Only one process can touch the state: a single-node service, an in-memory game, an embedded device.",
            },
          ],
          "Four ways to stop the second write"
        ),
        tip(
          "Let the database enforce the invariant even when the application already checks it. A unique index on (show_id, seat_no) in the bookings table turns any bug in your concurrency logic into a failed insert rather than two customers in one seat.",
          "Belt and braces"
        ),
        h2("Idempotent commands"),
        p(
          "The other half of concurrent access is the same request arriving twice. A phone on a train sends 'confirm booking', the response is lost, and the app retries. Did the first one succeed? If the server cannot tell, the customer is charged twice. The fix is to make the command idempotent: the client sends a unique key with it, and the server records the key alongside the result, so a repeat returns the original answer instead of doing the work again."
        ),
        code(
          "java",
          `final class ConfirmBookingHandler {

    @Transactional
    BookingId handle(ConfirmBooking cmd) {
        Optional<BookingId> earlier = processed.find(cmd.idempotencyKey());
        if (earlier.isPresent()) return earlier.get();   // replay: same answer

        BookingId id = bookings.confirm(cmd.holdId());
        processed.record(cmd.idempotencyKey(), id);       // unique key column
        return id;
    }
}`,
          "The key and the booking are written in the same transaction."
        ),
        warn(
          "The lookup at the top is itself a check-then-act: two identical requests arriving together can both find nothing. What makes this safe is the unique constraint on the key column — the second insert fails, its transaction rolls back, and the handler can then read and return the first result.",
          "The idempotency check races too"
        ),
        table(
          ["Situation", "Reach for"],
          [
            ["Rare conflicts, many readers", "Optimistic version check"],
            [
              "A few hot rows, many writers",
              "Pessimistic lock with a short transaction, or a queue per hot key",
            ],
            ["At most one per key", "Unique constraint"],
            [
              "Customer needs minutes to pay",
              "A Hold entity with an expiry, not a lock",
            ],
            ["Client may retry", "Idempotency key stored with the result"],
          ],
          "A decision table for concurrent writes."
        ),
        insight(
          "The strongest move here is a modelling one. Once 'the customer is paying for this seat' is a Hold object with an owner and an expiry time, the concurrency problem shrinks to one short atomic step — create the hold if the seat is free — and everything after it is ordinary state transitions on an object nobody else is competing for.",
          "Model the claim, not the lock"
        ),
      ],
    },
  ],
};

const CASE_STUDIES: SectionSeed = {
  slug: "modelling-case-studies",
  title: "Modelling Case Studies",
  summary:
    "Five classic briefs worked from requirements to entities, responsibilities, relationships and patterns — with the trade-offs and the extensions that would change the model.",
  chapters: [
    // -----------------------------------------------------------------------
    {
      slug: "case-study-library-lending",
      title: "Case Study: A Library Lending System",
      summary:
        "Members, books, copies, loans and reservations — and why the difference between a book and a copy decides the whole design.",
      difficulty: "MEDIUM",
      readingMinutes: 13,
      objectives: [
        "Separate a catalogue title from the physical copies of it",
        "Model a Loan as the object that relates a member to a copy over time",
        "Put rules that vary by member type behind a policy interface",
      ],
      keyTakeaways: [
        "Book is the title; BookCopy is the thing on the shelf. Conflating them hides every interesting question.",
        "A relationship with its own dates and rules — a Loan — deserves to be an object.",
        "Fines and loan limits vary; put them behind policies and keep the lending flow stable.",
        "Reservations attach to the title, holds attach to a copy.",
      ],
      content: [
        h2("The brief"),
        p(
          "A library lends physical books. Members search the catalogue, borrow copies, renew them and return them. If every copy of a title is out, a member can reserve it and is notified when one comes back. Late returns earn a fine. Payments, acquisitions and inter-library loans are out of scope."
        ),
        ul(
          "Assume a member may hold at most five loans at once; staff accounts may hold more.",
          "Assume a 14-day loan period and one renewal, refused if another member is waiting for the title.",
          "Assume fines are charged per day late and capped per loan.",
          "Assume a member with unpaid fines over a threshold cannot borrow."
        ),
        h2("Entities"),
        rp(
          "Underlining nouns gives book, copy, member, loan, reservation, fine, catalogue. The single most important decision is splitting ",
          { strong: "Book" },
          " — the title, with an ISBN and an author — from ",
          { strong: "BookCopy" },
          " — one physical object with a barcode, a condition and a location. Members borrow copies and reserve books."
        ),
        beforeAfter(
          {
            label: "One Book class with a counter",
            values: [
              "Book(isbn, title)",
              "availableCount: 2",
              "who has which? ?",
              "which is damaged? ?",
            ],
          },
          {
            label: "Book plus BookCopy",
            values: [
              "Book(isbn, title)",
              "Copy A1: ON_LOAN",
              "Copy A2: AVAILABLE",
              "Copy A3: IN_REPAIR",
            ],
          },
          {
            title: "Why the split matters",
            note: "A counter answers 'how many are free' and nothing else. Copies answer who has which one, which is overdue, which is damaged, and which shelf it lives on.",
          }
        ),
        table(
          ["Entity", "Is the only thing that knows"],
          [
            ["Book", "A title's bibliographic details (ISBN, authors, edition)"],
            ["BookCopy", "One physical item's barcode, condition and status"],
            ["Member", "Who someone is and what type of membership they hold"],
            [
              "Loan",
              "Which member has which copy, since when, until when, and how often renewed",
            ],
            ["ReservationQueue", "Who is waiting for a title, in order"],
            ["FinePolicy", "How lateness turns into money"],
            [
              "LendingService",
              "The checkout, renewal and return workflows that span the above",
            ],
          ],
          "One sentence each. Anything that fails the sentence is not an entity yet."
        ),
        h2("Relationships: the Loan is an object"),
        p(
          "A tempting shortcut is to give Member a list of copies. It fails as soon as you ask when a copy was borrowed, when it is due, or how many times it was renewed — that data belongs to neither the member nor the copy but to the relationship between them. When a relationship carries its own attributes and rules, make it a class."
        ),
        code(
          "java",
          `final class Loan {
    private final LoanId id;
    private final MemberId member;
    private final CopyId copy;
    private final LocalDate borrowedOn;
    private LocalDate dueOn;
    private LocalDate returnedOn;          // null while the copy is out
    private int renewals;

    boolean isOverdue(LocalDate today) {
        return returnedOn == null && today.isAfter(dueOn);
    }

    void renew(LoanRules rules, boolean someoneIsWaiting) {
        if (someoneIsWaiting) throw new RenewalRefused("another member is waiting");
        if (renewals >= rules.maxRenewals()) throw new RenewalRefused("limit reached");
        dueOn = dueOn.plus(rules.loanPeriod());
        renewals++;
    }

    void close(LocalDate today) { returnedOn = today; }
}`,
          "The loan owns its dates and its renewal rule."
        ),
        code(
          "java",
          `final class LendingService {
    Loan checkout(MemberId memberId, CopyId copyId) {
        Member member = members.get(memberId);
        if (fines.unpaidFor(memberId).isGreaterThan(rules.fineBlockThreshold()))
            throw new CheckoutRefused("outstanding fines");
        if (loans.activeCount(memberId) >= rules.maxLoans(member.type()))
            throw new CheckoutRefused("loan limit reached");

        BookCopy copy = copies.get(copyId);
        copy.lendTo(memberId);        // refuses unless AVAILABLE, or ON_HOLD for this member
        LocalDate today = LocalDate.now(clock);
        return loans.save(Loan.open(memberId, copyId, today, today.plus(rules.loanPeriod())));
    }
}`,
          "The service coordinates; each entity guards its own rule."
        ),
        h2("Patterns, and why each one is here"),
        ul(
          "Strategy for FinePolicy and LoanRules — they differ by member type and will change when the library changes its rules. Everything else in checkout stays put.",
          "An enum with guarded transitions for copy status — the states are few and the behaviour per state is small, so a full State pattern would be ceremony.",
          "Observer (or a domain event) for 'copy returned' — the reservation queue and the notification sender both care, and the return workflow should not know about either.",
          "Repository interfaces at the persistence boundary, owned by the lending module, so the rules are testable without a database."
        ),
        code(
          "java",
          `enum CopyStatus {
    AVAILABLE, ON_LOAN, ON_HOLD, IN_REPAIR, LOST;

    boolean canMoveTo(CopyStatus next) {
        return switch (this) {
            case AVAILABLE -> next == ON_LOAN || next == ON_HOLD || next == IN_REPAIR;
            case ON_LOAN   -> next == AVAILABLE || next == ON_HOLD || next == LOST;
            case ON_HOLD   -> next == ON_LOAN || next == AVAILABLE;   // collected, or hold lapsed
            case IN_REPAIR -> next == AVAILABLE;
            case LOST      -> next == AVAILABLE;                      // found again
        };
    }
}`,
          "The legal transitions, in one place the compiler checks for completeness."
        ),
        code(
          "java",
          `interface FinePolicy {
    Money fineFor(Loan loan, LocalDate returnedOn);
}

final class PerDayCapped implements FinePolicy {
    private final Money perDay;
    private final Money cap;

    public Money fineFor(Loan loan, LocalDate returnedOn) {
        long daysLate = Math.max(0, ChronoUnit.DAYS.between(loan.dueOn(), returnedOn));
        Money owed = perDay.times(daysLate);
        return owed.isGreaterThan(cap) ? cap : owed;
    }
}`,
          "A new fine rule is a new class, not an edit to the return flow."
        ),
        h2("Reservations and holds"),
        p(
          "A reservation is for a title: the member wants any copy. When a copy of that title comes back and someone is waiting, the copy does not go back on the shelf. It moves to ON_HOLD for the first member in line, with a pick-up deadline. If they do not collect it, the hold lapses and the next member gets it."
        ),
        code(
          "python",
          `from collections import deque


class ReservationQueue:
    """Members waiting for one Book (the title, not a copy)."""

    def __init__(self) -> None:
        self._waiting: deque[str] = deque()

    def join(self, member_id: str) -> int:
        if member_id in self._waiting:
            raise ValueError("already waiting")
        self._waiting.append(member_id)
        return len(self._waiting)            # position in line

    def on_copy_returned(self, copy) -> str | None:
        if not self._waiting:
            return None                      # copy goes back on the shelf
        member_id = self._waiting.popleft()
        copy.hold_for(member_id)             # ON_HOLD, with a pick-up deadline
        return member_id`,
          "Subscribed to 'copy returned'; the return workflow never calls it directly."
        ),
        h2("Trade-offs"),
        compare(
          [
            {
              label: "All rules in LendingService",
              time: "Easy to find",
              space: "One large class",
              when: "A small library with one membership type and rules that rarely change.",
            },
            {
              label: "Entities guard their own state; policies hold variable rules",
              time: "One more hop to read",
              space: "A few small classes",
              when: "Rules vary by member type or change yearly. Each entity enforces what only it knows; the service sequences them.",
              preferred: true,
            },
            {
              label: "Rules engine / configuration-driven",
              time: "Indirect, harder to debug",
              space: "Engine plus rule data",
              when: "Many branches with genuinely different rules edited by non-developers. Rarely justified for one library.",
            },
          ],
          "Where do the lending rules live?"
        ),
        h2("Extensions that would change the model"),
        ul(
          "E-books — there is no physical copy, only a licence count and an expiry. A LendableItem abstraction over BookCopy and Licence becomes worth it now, and not before.",
          "Multiple branches — a copy gains a home branch and a current location, and 'return anywhere' introduces transfers.",
          "Two members collecting the last copy at two desks — this is the double-booking problem; a version check on the copy's status settles it.",
          "Fine payment — Money becomes a value object shared with a payments module, and fines become ledger entries rather than a number on Member."
        ),
      ],
    },

    // -----------------------------------------------------------------------
    {
      slug: "case-study-elevator-controller",
      title: "Case Study: An Elevator Controller",
      summary:
        "A bank of cars, hall calls and car calls: modelling elevator state, separating dispatch from stop ordering, and keeping the controller single-threaded.",
      difficulty: "HARD",
      readingMinutes: 15,
      objectives: [
        "Distinguish hall calls, which a dispatcher assigns, from car calls, which belong to one car",
        "Model a car's lifecycle as explicit states and transitions",
        "Put the dispatch algorithm behind a strategy so it can change without touching the cars",
        "Confine controller state to one thread fed by an event queue",
      ],
      keyTakeaways: [
        "Two decisions, two owners: the dispatcher picks a car; the car orders its own stops.",
        "Explicit states make illegal actions — moving with the doors open — impossible to express.",
        "Dispatch is the requirement most likely to change, so it is the seam.",
        "Many buttons, one controller thread: concurrency solved by confinement, not locks.",
      ],
      content: [
        h2("The brief"),
        p(
          "A building has N floors and M elevator cars. On each floor there are up and down buttons (hall calls); inside each car there is a button per floor (car calls). Design the controller that decides which car answers each hall call and in what order each car visits its stops. Motor physics, door hardware and fire service modes are out of scope, though the design should leave room for them."
        ),
        ul(
          "Assume a hall call is assigned to exactly one car once assigned.",
          "Assume a car serves stops in its current direction before reversing.",
          "Assume doors must be closed before a car moves — the one safety invariant in scope.",
          "Assume the dispatch rule will be tuned after launch."
        ),
        h2("Entities"),
        table(
          ["Entity", "Is the only thing that knows"],
          [
            ["Car", "Its current floor, direction, state and pending stops"],
            ["Door", "Whether it is open, closing, closed or obstructed"],
            ["HallCall", "A floor and a desired direction — a value"],
            ["Dispatcher", "Which car each hall call has been given to"],
            ["DispatchStrategy", "The rule for choosing a car"],
            ["Controller", "The order in which events are processed"],
          ],
          "Note what is missing: no Floor class. A floor is just an int here; it has no behaviour."
        ),
        concept(
          "Hall calls versus car calls",
          "A car call ('take me to 9') already belongs to the car the passenger is standing in. A hall call ('someone on 4 wants to go up') belongs to nobody until the dispatcher assigns it. Modelling them as the same thing makes the dispatcher responsible for car calls it has no say over, or makes cars compete for hall calls with no referee."
        ),
        h2("The car is a state machine"),
        table(
          ["State", "Event", "Next state", "Action"],
          [
            [
              "IDLE",
              "Stop assigned",
              "MOVING_UP / MOVING_DOWN",
              "Start motor towards it",
            ],
            [
              "MOVING",
              "Arrived at a stop",
              "DOORS_OPEN",
              "Stop, open doors, clear that stop",
            ],
            [
              "DOORS_OPEN",
              "Door timer expires, nothing blocking",
              "MOVING or IDLE",
              "Close doors, choose next stop",
            ],
            [
              "DOORS_OPEN",
              "Obstruction sensed",
              "DOORS_OPEN",
              "Restart the door timer",
            ],
            [
              "Any",
              "Maintenance key turned",
              "OUT_OF_SERVICE",
              "Finish current stop; refuse new hall calls",
            ],
          ],
          "The safety invariant lives in the transitions: no path goes from DOORS_OPEN to MOVING without closing."
        ),
        rp(
          "For four or five states with short actions, an enum and a ",
          { code: "switch" },
          " in the car's step method is clear and complete. The State pattern — one class per state — earns its keep when per-state behaviour grows: different door timings, different responses to the same button, modes added by a regulator. Start with the enum; promote it when a state's branch outgrows a screen."
        ),
        h2("Ordering a car's stops: LOOK"),
        p(
          "Within one car, the classic rule is LOOK, a refinement of the disk-scheduling SCAN algorithm: keep going in the current direction while there are stops ahead, then turn round. It never leaves a passenger behind indefinitely, which a pure nearest-stop rule can do in a busy building."
        ),
        code(
          "java",
          `final class Car {
    private int floor;
    private Direction direction = Direction.IDLE;
    private final TreeSet<Integer> stops = new TreeSet<>();

    void addStop(int target) { stops.add(target); }

    /** LOOK: continue while stops lie ahead, then reverse. */
    Optional<Integer> nextStop() {
        if (stops.isEmpty()) { direction = Direction.IDLE; return Optional.empty(); }
        Integer ahead = switch (direction) {
            case UP   -> stops.ceiling(floor);
            case DOWN -> stops.floor(floor);
            case IDLE -> nearest();
        };
        if (ahead == null) {                        // nothing left this way
            direction = direction == Direction.UP ? Direction.DOWN : Direction.UP;
            return nextStop();
        }
        if (ahead != floor) direction = ahead > floor ? Direction.UP : Direction.DOWN;
        return Optional.of(ahead);
    }

    private Integer nearest() {
        Integer up = stops.ceiling(floor), down = stops.floor(floor);
        if (up == null) return down;
        if (down == null) return up;
        return up - floor <= floor - down ? up : down;
    }
}`,
          "A sorted set makes 'next stop ahead' a single lookup."
        ),
        worked(
          "Car at floor 5 moving UP; stops {2, 7, 9}",
          "Visit order 7, 9, 6, 2 — everything above first, then everything below",
          [
            { state: "next = 7", note: "ceiling(5) is 7; keep going up." },
            {
              state: "at 7; car call for 6 arrives",
              note: "Stops are now {2, 6, 9}. 6 is behind us, so it waits.",
            },
            { state: "next = 9", note: "ceiling(7) is 9." },
            {
              state: "at 9; reverse",
              note: "ceiling(9) is null, so direction flips to DOWN; floor(9) is 6.",
            },
            {
              state: "next = 6, then 2",
              note: "Serve everything below on the way down.",
            },
          ],
          "LOOK in action"
        ),
        h2("Dispatch is the strategy"),
        p(
          "Choosing which car answers a hall call is the part building owners tune, and the part with the most competing algorithms. That makes it the variation point, so it goes behind an interface that receives read-only snapshots of the cars and returns a decision. It never moves a car itself."
        ),
        code(
          "java",
          `interface DispatchStrategy {
    CarId choose(HallCall call, List<CarSnapshot> cars);
}

final class NearestSuitableCar implements DispatchStrategy {
    private static final int TURNAROUND_PENALTY = 40;   // in floors, tunable

    public CarId choose(HallCall call, List<CarSnapshot> cars) {
        return cars.stream()
            .filter(CarSnapshot::inService)
            .min(Comparator.comparingInt(c -> cost(c, call)))
            .orElseThrow()
            .id();
    }

    private int cost(CarSnapshot car, HallCall call) {
        int distance = Math.abs(car.floor() - call.floor());
        boolean onTheWay = car.direction() == Direction.IDLE
            || (car.direction() == call.direction()
                && (call.direction() == Direction.UP
                        ? call.floor() >= car.floor()
                        : call.floor() <= car.floor()));
        return onTheWay ? distance : distance + TURNAROUND_PENALTY;
    }
}`,
          "Prefers a car already heading past the caller in the right direction."
        ),
        compare(
          [
            {
              label: "First come, first served",
              time: "Simple",
              space: "One queue",
              when: "A single car in a low building. Wastes travel badly as soon as calls interleave.",
            },
            {
              label: "Nearest suitable car",
              time: "O(cars) per call",
              space: "Snapshot per car",
              when: "A small bank of cars. Good default; easy to explain and tune with a cost function.",
              preferred: true,
            },
            {
              label: "Zoning",
              time: "O(1) zone lookup",
              space: "Zone table",
              when: "Tall buildings where some cars serve only high floors. Often swapped in by time of day.",
            },
            {
              label: "Destination dispatch",
              time: "Optimisation per call",
              space: "Destinations per call",
              when: "Passengers enter their destination in the lobby. Changes the model: a hall call carries a destination.",
            },
          ],
          "Dispatch strategies"
        ),
        h2("Concurrency: one thread owns the building"),
        p(
          "Buttons are pressed on many floors at once, and sensors report arrivals asynchronously. Rather than locking each car, the controller confines all car state to one thread. Every input becomes an event on a queue; one loop takes events in order and applies them. This is producer–consumer with one consumer, and it means the dispatch strategy and the cars can be written as ordinary single-threaded code."
        ),
        code(
          "python",
          `import queue


class Controller:
    def __init__(self, cars: dict, strategy) -> None:
        self._events: queue.Queue = queue.Queue()
        self._cars = cars
        self._strategy = strategy

    # Called from any thread: buttons, sensors, the clock.
    def press_hall(self, floor: int, direction: str) -> None:
        self._events.put(("hall", floor, direction))

    def press_car(self, car_id: str, floor: int) -> None:
        self._events.put(("car", car_id, floor))

    # Runs on exactly one thread. Only this loop touches car state.
    def run(self) -> None:
        while True:
            kind, *args = self._events.get()
            if kind == "hall":
                floor, direction = args
                car_id = self._strategy.choose(floor, direction, self._cars.values())
                self._cars[car_id].add_stop(floor)
            elif kind == "car":
                car_id, floor = args
                self._cars[car_id].add_stop(floor)
            elif kind == "tick":
                for car in self._cars.values():
                    car.step()`,
          "Confinement: the queue is the only shared object."
        ),
        warn(
          "Keep the strategy a pure decision: snapshots in, a car id out. A strategy that adds stops to cars itself cannot be unit-tested without a building, cannot be compared with another strategy on the same input, and makes 'who changed this car' a question with two answers.",
          "Strategies decide; they do not act"
        ),
        h2("Trade-offs and extensions"),
        ul(
          "Peak modes — up-peak in the morning, down-peak in the evening — are a different strategy per period, selected by a scheduler. The seam already exists.",
          "Capacity: a full car should skip hall calls. That adds load to the snapshot and a filter to the strategy, nothing else.",
          "Fire service mode is a new car state with its own transitions; it is the change that would justify promoting the enum to the State pattern.",
          "Re-assigning a hall call when a better car frees up improves wait times but means calls are no longer assigned once; the Dispatcher needs to own reassignment explicitly."
        ),
      ],
    },

    // -----------------------------------------------------------------------
    {
      slug: "case-study-chess-game",
      title: "Case Study: A Chess Game",
      summary:
        "Pieces, a board, moves and rules: where polymorphism helps, where a table of directions is simpler, and why legality belongs to the game rather than the piece.",
      difficulty: "MEDIUM",
      readingMinutes: 15,
      objectives: [
        "Model positions and moves as immutable values",
        "Compare a subclass-per-piece design with a table-driven one",
        "Separate a piece's movement geometry from the board-level rules of legality",
        "Support undo by recording everything a move destroys",
      ],
      keyTakeaways: [
        "Pieces differ in geometry, which is data; legality depends on the whole position, which is rules.",
        "Polymorphism is the right tool when behaviour differs, not when only numbers do.",
        "Generate pseudo-legal moves, then filter out any that leave your own king attacked.",
        "A move that can be undone must carry what it captured and what state it changed.",
      ],
      content: [
        h2("The brief"),
        p(
          "Two players play standard chess on one device. The program must reject illegal moves, detect check, checkmate and stalemate, support castling, en passant and promotion, and allow moves to be undone. A computer opponent, clocks and network play are out of scope for now."
        ),
        h2("Entities"),
        table(
          ["Entity", "Is the only thing that knows"],
          [
            ["Position (square)", "A file and rank on the board — an immutable value"],
            ["Piece", "Its type and colour"],
            ["Board", "Which piece stands on which square"],
            [
              "GameState",
              "Side to move, castling rights, en passant target, move counters",
            ],
            ["Move", "From, to, and what kind of move it is"],
            ["Rules", "Which moves are legal in a given state, and what the result is"],
            ["Game", "The sequence of moves played and how to undo them"],
          ],
          "Board and GameState are separate because castling rights are not visible from piece placement."
        ),
        code(
          "java",
          `public record Position(int file, int rank) {
    public Position {
        if (file < 0 || file > 7 || rank < 0 || rank > 7)
            throw new IllegalArgumentException("off board: " + file + "," + rank);
    }

    public Optional<Position> offset(int df, int dr) {
        int f = file + df, r = rank + dr;
        return (f < 0 || f > 7 || r < 0 || r > 7)
            ? Optional.empty()
            : Optional.of(new Position(f, r));
    }
}`,
          "An invalid square cannot be constructed, so nothing downstream checks."
        ),
        h2("Polymorphism or a table?"),
        p(
          "The textbook design is an abstract Piece with a subclass per piece type, each overriding a method that lists where it can move. It reads naturally and it works. It is worth asking, though, what actually differs between the subclasses."
        ),
        code(
          "java",
          `abstract class Piece {
    final Colour colour;
    Piece(Colour colour) { this.colour = colour; }
    abstract List<Position> candidateMoves(Position from, Board board);
}

final class Knight extends Piece {
    private static final int[][] JUMPS =
        {{1,2},{2,1},{2,-1},{1,-2},{-1,-2},{-2,-1},{-2,1},{-1,2}};

    Knight(Colour colour) { super(colour); }

    List<Position> candidateMoves(Position from, Board board) {
        List<Position> out = new ArrayList<>();
        for (int[] j : JUMPS)
            from.offset(j[0], j[1])
                .filter(to -> !board.hasPieceOf(to, colour))
                .ifPresent(out::add);
        return out;
    }
}
// ... Bishop, Rook and Queen repeat the same sliding loop with other directions`,
          "Subclass per piece: six classes, mostly the same loop."
        ),
        code(
          "java",
          `enum PieceType {
    KNIGHT(false, new int[][]{{1,2},{2,1},{2,-1},{1,-2},{-1,-2},{-2,-1},{-2,1},{-1,2}}),
    BISHOP(true,  new int[][]{{1,1},{1,-1},{-1,1},{-1,-1}}),
    ROOK(true,    new int[][]{{1,0},{-1,0},{0,1},{0,-1}}),
    QUEEN(true,   new int[][]{{1,1},{1,-1},{-1,1},{-1,-1},{1,0},{-1,0},{0,1},{0,-1}}),
    KING(false,   new int[][]{{1,1},{1,-1},{-1,1},{-1,-1},{1,0},{-1,0},{0,1},{0,-1}}),
    PAWN(false,   new int[][]{});   // pawns are special; a rule handles them

    final boolean slides;
    final int[][] directions;
    PieceType(boolean slides, int[][] directions) {
        this.slides = slides;
        this.directions = directions;
    }
}

// One generator serves every piece except the pawn.
List<Position> candidates(Piece piece, Position from, Board board) {
    List<Position> out = new ArrayList<>();
    for (int[] d : piece.type().directions) {
        Optional<Position> next = from.offset(d[0], d[1]);
        while (next.isPresent()) {
            Position to = next.get();
            if (board.hasPieceOf(to, piece.colour())) break;     // own piece blocks
            out.add(to);
            if (!piece.type().slides || board.isOccupied(to)) break;  // capture ends a slide
            next = to.offset(d[0], d[1]);
        }
    }
    return out;
}`,
          "Table-driven: the differences are data, so they are written as data."
        ),
        compare(
          [
            {
              label: "Subclass per piece",
              time: "Virtual call per piece",
              space: "Six classes",
              when: "Pieces genuinely behave differently — fairy-chess variants with pieces that swap, teleport or have effects beyond movement.",
            },
            {
              label: "Table of directions",
              time: "One loop for all",
              space: "One enum",
              when: "Standard chess, where five of six pieces differ only in directions and whether they slide.",
            },
            {
              label: "Table for geometry, rule objects for special moves",
              time: "One loop plus a few rules",
              space: "Enum plus small rule classes",
              when: "The usual best answer: geometry as data; pawn moves, castling, en passant and promotion as separate rules that can each be tested alone.",
              preferred: true,
            },
          ],
          "How to model what pieces can do"
        ),
        insight(
          "Whether a move is legal depends on more than the piece: is the path clear, has the king moved, did the opponent's pawn just advance two squares, would this leave my own king in check? None of that is a property of a knight. Pure piece polymorphism tends to leak board knowledge into every subclass, which is the real argument for moving legality into a Rules object.",
          "Why legality is not the piece's job"
        ),
        h2("Validating a move"),
        ol(
          "There is a piece on the from-square and it belongs to the side to move.",
          "The destination is in that piece's pseudo-legal set: geometry, blocking and capture only.",
          "Special-move rules are satisfied: castling rights and empty, unattacked transit squares; the en passant target; promotion on the last rank.",
          "After applying the move, the mover's own king is not attacked. This step catches pins and moving into check."
        ),
        code(
          "java",
          `List<Move> legalMoves(GamePosition pos, Colour side) {
    List<Move> legal = new ArrayList<>();
    for (Move m : pseudoLegal(pos, side)) {
        Undo undo = pos.apply(m);                       // make
        if (!isAttacked(pos, pos.kingOf(side), side.opponent()))
            legal.add(m);
        pos.undo(undo);                                 // unmake
    }
    return legal;
}

GameStatus status(GamePosition pos, Colour side) {
    boolean inCheck = isAttacked(pos, pos.kingOf(side), side.opponent());
    if (!legalMoves(pos, side).isEmpty()) return inCheck ? GameStatus.CHECK : GameStatus.ONGOING;
    return inCheck ? GameStatus.CHECKMATE : GameStatus.STALEMATE;
}`,
          "Checkmate and stalemate are the same test with one bit different."
        ),
        h2("Moves as values, undo as a command"),
        p(
          "Undo needs more than from and to. Reversing a capture needs the captured piece; reversing a king move needs the castling rights that existed before it; reversing anything needs the previous en passant square. Record what a move destroyed at the moment it is applied, and undo becomes exact. This is the Command pattern with its undo half taken seriously."
        ),
        code(
          "java",
          `enum MoveKind { NORMAL, DOUBLE_PAWN_PUSH, CASTLE_KINGSIDE, CASTLE_QUEENSIDE, EN_PASSANT, PROMOTION }

record Move(Position from, Position to, MoveKind kind, Optional<PieceType> promotion) {}

// Everything apply() overwrote, so undo() can restore it exactly.
record Undo(Move move,
            Optional<Piece> captured,
            CastlingRights castlingBefore,
            Optional<Position> enPassantBefore,
            int halfmoveClockBefore) {}`,
          "Both records are immutable, so history can be shared and replayed safely."
        ),
        beforeAfter(
          {
            label: "Move(from, to) only",
            values: [
              "e5 to d6",
              "captured: ?",
              "castling rights: ?",
              "en passant was: ?",
              "undo: guesswork",
            ],
          },
          {
            label: "Move plus Undo record",
            values: [
              "e5 to d6, EN_PASSANT",
              "captured: pawn on d5",
              "castling rights: KQkq",
              "en passant was: d6",
              "undo: exact",
            ],
          },
          {
            title: "What undo needs to know",
            note: "En passant captures a pawn that is not on the destination square, so even 'what was captured' cannot be recovered from the move alone.",
          }
        ),
        h2("Trade-offs and extensions"),
        ul(
          "Draw rules — threefold repetition needs a hash of each position, which is a reason to keep GameState compact and comparable from the start.",
          "Chess960 changes only the castling rule and the starting set-up; with castling as its own rule object, that is one replacement class.",
          "Clocks are an observer of 'move played' events with their own timer; the rules never need to know about time.",
          "A computer opponent needs millions of make and unmake operations per second, which pushes the board towards bitboards — a case where performance, not elegance, would change the model."
        ),
      ],
    },

    // -----------------------------------------------------------------------
    {
      slug: "case-study-expense-splitting",
      title: "Case Study: An Expense-Splitting App",
      summary:
        "Groups, expenses, splits and settling up: money as a value object, split rules as strategies, balances as derived data, and simplifying who pays whom.",
      difficulty: "MEDIUM",
      readingMinutes: 14,
      objectives: [
        "Represent money exactly and split it without losing or inventing a cent",
        "Model equal, exact and percentage splits as interchangeable strategies",
        "Derive net balances from an append-only list of expenses and settlements",
        "Reduce a set of balances to a short list of transfers",
      ],
      keyTakeaways: [
        "Never use floating point for money. Use integer minor units or a decimal type, and always carry the currency.",
        "Splitting must distribute the remainder explicitly so the parts sum to the whole.",
        "Every net balance in a group sums to zero; that invariant is the first test to write.",
        "Greedy settlement needs at most n − 1 transfers; the true minimum is a much harder problem.",
        "Expenses are facts: correct them with new entries, not edits.",
      ],
      content: [
        h2("The brief"),
        p(
          "Friends share costs on a trip. Anyone in a group can record an expense they paid and say who it was for, split equally, by exact amounts, or by percentages. The app shows each person's balance, suggests a short list of payments to settle everything, and records settlements. Moving real money is out of scope; multiple currencies are an extension."
        ),
        h2("Money is a value object"),
        rp(
          "The first decision is the most consequential. Binary floating point cannot represent most decimal fractions exactly, so ",
          { code: "0.1 + 0.2" },
          " is not ",
          { code: "0.3" },
          " in a double, and errors accumulate across thousands of expenses. Store amounts as integer minor units (cents, paise) or a decimal type, and never let an amount travel without its currency."
        ),
        beforeAfter(
          {
            label: "double, rounded per share",
            values: ["33.33", "33.33", "33.33", "sum: 99.99", "a cent has vanished"],
          },
          {
            label: "Money.allocate(3)",
            values: ["33.34", "33.33", "33.33", "sum: 100.00", "nothing lost"],
          },
          {
            title: "Splitting 100.00 three ways",
            note: "Rounding each share independently loses the remainder. Allocation hands the leftover minor units out one at a time, so the parts always add back up to the total.",
          }
        ),
        code(
          "java",
          `public record Money(long minor, Currency currency) {

    public static Money zero(Currency currency) { return new Money(0, currency); }

    public Money plus(Money other) {
        requireSameCurrency(other);
        return new Money(Math.addExact(minor, other.minor), currency);
    }

    /** n parts that differ by at most one minor unit and sum exactly. Assumes minor >= 0. */
    public List<Money> allocate(int n) {
        long base = minor / n, remainder = minor % n;
        List<Money> parts = new ArrayList<>(n);
        for (int i = 0; i < n; i++)
            parts.add(new Money(base + (i < remainder ? 1 : 0), currency));
        return parts;
    }

    private void requireSameCurrency(Money other) {
        if (!currency.equals(other.currency))
            throw new IllegalArgumentException(currency + " vs " + other.currency);
    }
}`,
          "Immutable, currency-aware, and incapable of losing a cent.",
          [12, 15]
        ),
        code(
          "python",
          `def allocate(total_cents: int, weights: list[int]) -> list[int]:
    """Split by weights; leftover cents go to the largest fractional parts."""
    whole = sum(weights)
    raw = [total_cents * w for w in weights]
    parts = [r // whole for r in raw]
    leftover = total_cents - sum(parts)
    by_fraction = sorted(range(len(weights)), key=lambda i: raw[i] % whole, reverse=True)
    for i in by_fraction[:leftover]:
        parts[i] += 1
    return parts


allocate(10_000, [1, 1, 1])     # [3334, 3333, 3333]
allocate(10_000, [50, 30, 20])  # [5000, 3000, 2000]`,
          "Weighted allocation covers percentage and share-based splits with one function."
        ),
        h2("Entities"),
        table(
          ["Entity", "Is the only thing that knows"],
          [
            ["Member", "Who a person is within a group"],
            ["Group", "Who is in it and which expenses belong to it"],
            [
              "Expense",
              "Who paid, how much, and the resulting share per member — immutable once recorded",
            ],
            ["SplitStrategy", "How a total becomes per-member shares"],
            ["Settlement", "A recorded payment from one member to another"],
            ["Ledger", "Net balances, derived from expenses and settlements"],
            ["DebtSimplifier", "How to turn balances into a short list of transfers"],
          ],
          "Ledger stores nothing of its own; it is a view over the facts."
        ),
        h2("Splits are strategies"),
        code(
          "java",
          `interface SplitStrategy {
    Map<MemberId, Money> shares(Money total, List<MemberId> participants);
}

final class EqualSplit implements SplitStrategy {
    public Map<MemberId, Money> shares(Money total, List<MemberId> people) {
        List<Money> parts = total.allocate(people.size());
        Map<MemberId, Money> out = new LinkedHashMap<>();
        for (int i = 0; i < people.size(); i++) out.put(people.get(i), parts.get(i));
        return out;
    }
}

final class ExactSplit implements SplitStrategy {
    private final Map<MemberId, Money> amounts;
    ExactSplit(Map<MemberId, Money> amounts) { this.amounts = Map.copyOf(amounts); }

    public Map<MemberId, Money> shares(Money total, List<MemberId> people) {
        Money sum = amounts.values().stream()
            .reduce(Money.zero(total.currency()), Money::plus);
        if (!sum.equals(total))
            throw new InvalidSplit("shares sum to " + sum + ", expense is " + total);
        return amounts;
    }
}`,
          "A new split type is a new class; Expense never changes."
        ),
        warn(
          "Validate when the expense is created, not when balances are computed. Exact shares must sum to the total and percentages to 100; once accepted, the Expense stores the resulting shares as money, so a later change to a split rule cannot silently rewrite history.",
          "Validate at the door"
        ),
        h2("Balances are derived"),
        p(
          "Each member's net balance is what they paid minus what they owe. Rather than keeping mutable balance counters that every expense must update correctly — and that two simultaneous expenses can corrupt — compute balances from the list of expenses and settlements. Cache the result if it gets slow; the list stays the source of truth."
        ),
        worked(
          "Group {A, B, C}. A pays 90 for all three. B pays 30 for B and C.",
          "Net: A +60, B −15, C −45. The three balances sum to zero.",
          [
            {
              state: "Expense 1: A paid 90",
              note: "Shares 30 each. A: +90 − 30 = +60; B: −30; C: −30.",
            },
            {
              state: "Expense 2: B paid 30",
              note: "Shares 15 each for B and C. B: −30 + 30 − 15 = −15; C: −30 − 15 = −45.",
            },
            {
              state: "Check the invariant",
              note: "+60 − 15 − 45 = 0. Any other sum means a bug.",
            },
          ],
          "Deriving balances"
        ),
        h2("Simplifying debts"),
        p(
          "Recording who owes whom per expense would leave B owing A, C owing A and C owing B: three payments. Using net balances instead, a greedy pass repeatedly matches the biggest creditor with the biggest debtor and settles the smaller of the two amounts. Each step zeroes at least one person, so a group of n people needs at most n − 1 transfers."
        ),
        code(
          "java",
          `List<Transfer> simplify(Map<MemberId, Long> net) {     // > 0 is owed, < 0 owes
    PriorityQueue<Map.Entry<MemberId, Long>> creditors =
        new PriorityQueue<>(Map.Entry.<MemberId, Long>comparingByValue().reversed());
    PriorityQueue<Map.Entry<MemberId, Long>> debtors =
        new PriorityQueue<>(Map.Entry.comparingByValue());    // most negative first
    net.forEach((who, amount) -> {
        if (amount > 0) creditors.add(Map.entry(who, amount));
        if (amount < 0) debtors.add(Map.entry(who, amount));
    });

    List<Transfer> transfers = new ArrayList<>();
    while (!creditors.isEmpty()) {
        var c = creditors.poll();
        var d = debtors.poll();
        long amount = Math.min(c.getValue(), -d.getValue());
        transfers.add(new Transfer(d.getKey(), c.getKey(), amount));
        if (c.getValue() > amount) creditors.add(Map.entry(c.getKey(), c.getValue() - amount));
        if (-d.getValue() > amount) debtors.add(Map.entry(d.getKey(), d.getValue() + amount));
    }
    return transfers;
}`,
          "Balances sum to zero, so creditors and debtors run out together."
        ),
        worked(
          "Net: A +60, B −15, C −45",
          "Two transfers: C pays A 45, B pays A 15",
          [
            {
              state: "Match A (+60) with C (−45)",
              note: "Settle 45. A is still owed 15; C is done.",
            },
            {
              state: "Match A (+15) with B (−15)",
              note: "Settle 15. Everyone is at zero.",
            },
          ],
          "Greedy settlement on the example"
        ),
        compare(
          [
            {
              label: "Pay back per expense",
              time: "O(expenses)",
              space: "One debt per share",
              when: "Never as a suggestion — it is how the data is recorded, not how people should settle.",
            },
            {
              label: "Greedy on net balances",
              time: "O(n log n)",
              space: "Two heaps",
              when: "Almost always. At most n − 1 transfers, fast, and easy to explain to users.",
              preferred: true,
            },
            {
              label: "Exact minimum transfers",
              time: "Exponential in n",
              space: "Subset search",
              when: "Small groups where saving one payment matters. The minimum relates to splitting people into the most zero-sum subgroups, which is NP-hard in general.",
            },
          ],
          "Turning balances into payments"
        ),
        h2("Trade-offs and extensions"),
        ul(
          "Editing an expense: record a reversal and a replacement rather than mutating the original. Balances stay derivable and every change is explainable — the same reason accountants never use an eraser.",
          "Multiple currencies: keep balances per currency, and convert only at settlement time with the rate recorded on the Settlement. Converting at entry time bakes a rate into history.",
          "Concurrent edits: appending immutable expenses cannot lose an update, whereas two requests incrementing the same balance counter can. The model choice removes the race.",
          "Recurring expenses are a schedule that produces ordinary expenses; the ledger does not need to know they exist."
        ),
        insight(
          "An append-only list of facts with balances derived from it is event sourcing in miniature. It is a good fit here because the facts are naturally immutable and the history is itself a feature users want to see.",
          "The shape underneath"
        ),
      ],
    },

    // -----------------------------------------------------------------------
    {
      slug: "case-study-hotel-booking",
      title: "Case Study: A Hotel Booking System",
      summary:
        "Searching availability by night, holding inventory while a guest pays, and cancellation policies that cannot change after the fact.",
      difficulty: "HARD",
      readingMinutes: 17,
      objectives: [
        "Model availability as inventory per room type per night",
        "Reserve a multi-night stay atomically with a conditional update",
        "Represent the reservation lifecycle, including expiring holds, as explicit states",
        "Snapshot price and cancellation policy onto the reservation at booking time",
      ],
      keyTakeaways: [
        "Guests book a room type for a range of nights; a specific room is assigned at check-in.",
        "Stays are half-open date ranges: check-out day is the next guest's check-in day.",
        "A stay is bookable only if every night is; reserve all nights in one transaction or none.",
        "A hold is a reservation in its first state, with an expiry — not a database lock.",
        "Terms agreed at booking are copied onto the booking, so later policy changes cannot alter them.",
      ],
      content: [
        h2("The brief"),
        p(
          "Guests search a hotel for available rooms between two dates, choose a room type, hold it while they enter payment details, and confirm. They may cancel later and receive a refund according to the cancellation terms they booked under. Staff check guests in, assign rooms and check them out. Rate management, housekeeping and loyalty schemes are out of scope."
        ),
        h2("Entities"),
        table(
          ["Entity", "Is the only thing that knows"],
          [
            ["Hotel", "Its room types, rooms and local time zone"],
            ["RoomType", "A category (Deluxe King) and how many rooms of it exist"],
            ["Room", "One physical room's number and condition"],
            ["Stay", "A check-in and check-out date — an immutable value"],
            [
              "NightInventory",
              "For one room type and one night: total, held and booked counts",
            ],
            [
              "Reservation",
              "One guest's claim on a room type for a stay, its status and agreed terms",
            ],
            [
              "CancellationPolicy",
              "How much is refunded when a booking is cancelled at a given time",
            ],
          ],
          "Room and RoomType are as distinct as Book and BookCopy in the library."
        ),
        concept(
          "Book the type, assign the room",
          "A guest does not care whether they get room 412 or 415, only that it is a Deluxe King. Booking against the room type, and assigning a room at check-in, lets the hotel fill gaps that room-level booking would leave empty."
        ),
        beforeAfter(
          {
            label: "Book room 412 for Mon–Wed",
            values: [
              "Mon: 412 free",
              "Tue: 412 taken",
              "result: unavailable",
              "(415 was free Tue)",
            ],
          },
          {
            label: "Book DELUXE for Mon–Wed",
            values: [
              "Mon: 3 of 10 left",
              "Tue: 1 of 10 left",
              "result: bookable",
              "assign at check-in",
            ],
          },
          {
            title: "Same hotel, same nights",
            note: "Room-level booking turns away a guest the hotel could have housed by moving one booking between two identical rooms.",
          }
        ),
        code(
          "java",
          `public record Stay(LocalDate checkIn, LocalDate checkOut) {
    public Stay {
        if (!checkOut.isAfter(checkIn))
            throw new IllegalArgumentException("a stay is at least one night");
    }

    public long nights() { return ChronoUnit.DAYS.between(checkIn, checkOut); }

    /** Half-open: [checkIn, checkOut). Back-to-back stays do not overlap. */
    public boolean overlaps(Stay other) {
        return checkIn.isBefore(other.checkOut) && other.checkIn.isBefore(checkOut);
    }

    public Stream<LocalDate> eachNight() { return checkIn.datesUntil(checkOut); }
}`,
          "The nights of a stay are check-in up to, not including, check-out."
        ),
        tip(
          "Half-open ranges remove a whole family of off-by-one bugs. A guest leaving on the 15th and another arriving on the 15th do not clash, the number of nights is a subtraction, and splitting a stay at any date produces two ranges that neither overlap nor leave a gap.",
          "Why half-open"
        ),
        h2("Availability is inventory per night"),
        p(
          "Availability questions are per night: is there a Deluxe King free on the 12th, the 13th and the 14th? So store one inventory row per room type per night, holding the total and how many are held or booked. Available is total minus held minus booked. A three-night stay is bookable only if all three rows have room, and it must take all three or none."
        ),
        code(
          "sql",
          `-- One row per room type per night: total, held, booked.
UPDATE room_inventory
   SET held = held + 1
 WHERE room_type_id = 7
   AND night >= DATE '2026-11-12'
   AND night <  DATE '2026-11-15'
   AND held + booked < total;

-- Expect 3 rows (one per night). Fewer means a night is full: ROLLBACK.`,
          "The availability check is inside the write, so there is no gap to race through.",
          [7]
        ),
        code(
          "java",
          `final class InventoryService {

    @Transactional
    Reservation hold(RoomTypeId type, Stay stay, GuestId guest, CancellationPolicy terms, Money price) {
        int updated = inventory.incrementHeldIfAvailable(type, stay);   // the UPDATE above
        if (updated != stay.nights())
            throw new SoldOut(type, stay);       // exception rolls back every night
        Instant expiresAt = clock.instant().plus(HOLD_DURATION);
        return reservations.save(Reservation.held(type, stay, guest, terms, price, expiresAt));
    }
}`,
          "All nights or none, in one transaction."
        ),
        note(
          "Each row's condition is evaluated as the row is locked for the update, so two guests racing for the last room on the 13th cannot both succeed: one increments it, and the other's update finds the condition false and matches one row fewer. This is the conditional-write idea from the double-booking chapter, applied to a counter instead of a version."
        ),
        h2("Holds and the reservation lifecycle"),
        p(
          "Entering card details takes minutes. The guest needs the room kept for them during that time, but a database lock must last milliseconds. So the hold is the reservation's first state: inventory is counted as held, and the reservation carries an expiry. Confirming moves held to booked; expiry releases it."
        ),
        table(
          ["From", "Event", "To", "Inventory effect"],
          [
            ["—", "Guest holds a stay", "HELD", "held + 1 on each night"],
            [
              "HELD",
              "Payment confirmed before expiry",
              "CONFIRMED",
              "held − 1, booked + 1",
            ],
            ["HELD", "Expiry passes", "EXPIRED", "held − 1"],
            [
              "CONFIRMED",
              "Guest cancels",
              "CANCELLED",
              "booked − 1; refund per policy",
            ],
            ["CONFIRMED", "Guest arrives", "CHECKED_IN", "Room assigned"],
            [
              "CONFIRMED",
              "Check-in day ends without arrival",
              "NO_SHOW",
              "Charged per policy",
            ],
            ["CHECKED_IN", "Guest leaves", "CHECKED_OUT", "None"],
          ],
          "Every status change has a matching, explicit inventory change."
        ),
        code(
          "java",
          `final class Reservation {
    private final ReservationId id;
    private Status status;
    private final Instant holdExpiresAt;
    private final Money price;                    // agreed at booking
    private final CancellationPolicy terms;       // agreed at booking
    private PaymentReference payment;

    void confirm(PaymentReference payment, Instant now) {
        if (status != Status.HELD)
            throw new IllegalStateException("cannot confirm a " + status + " reservation");
        if (!now.isBefore(holdExpiresAt))
            throw new HoldExpired(id);            // a sweeper releases the inventory
        this.payment = payment;
        this.status = Status.CONFIRMED;
    }

    Money cancel(ZonedDateTime checkInAt, ZonedDateTime now) {
        if (status != Status.CONFIRMED)
            throw new IllegalStateException("cannot cancel a " + status + " reservation");
        status = Status.CANCELLED;
        return terms.refund(price, checkInAt, now);
    }
}`,
          "The reservation guards its own transitions; the service adjusts inventory to match."
        ),
        h2("Cancellation policies"),
        code(
          "java",
          `interface CancellationPolicy {
    Money refund(Money paid, ZonedDateTime checkInAt, ZonedDateTime cancelledAt);
}

final class FreeUntil implements CancellationPolicy {
    private final Duration notice;                // e.g. 48 hours

    public Money refund(Money paid, ZonedDateTime checkInAt, ZonedDateTime at) {
        return at.isBefore(checkInAt.minus(notice)) ? paid : Money.zero(paid.currency());
    }
}

final class NonRefundable implements CancellationPolicy {
    public Money refund(Money paid, ZonedDateTime checkInAt, ZonedDateTime at) {
        return Money.zero(paid.currency());
    }
}`,
          "Check-in time is zoned: '48 hours before check-in' means the hotel's local time, not the server's."
        ),
        code(
          "python",
          `from dataclasses import dataclass
from datetime import datetime, timedelta


@dataclass(frozen=True)
class Tier:
    at_least_before: timedelta
    refund_percent: int


@dataclass(frozen=True)
class TieredPolicy:
    tiers: tuple[Tier, ...]          # most generous first

    def refund_cents(self, paid_cents: int, check_in: datetime, cancelled_at: datetime) -> int:
        notice = check_in - cancelled_at
        for tier in self.tiers:
            if notice >= tier.at_least_before:
                return paid_cents * tier.refund_percent // 100
        return 0


policy = TieredPolicy((Tier(timedelta(days=7), 100), Tier(timedelta(days=2), 50)))`,
          "A tiered policy is just data plus one loop — and frozen, so it can be shared safely."
        ),
        warn(
          "Copy the price and the cancellation terms onto the reservation when it is made. If the reservation instead points at the hotel's current policy, a policy change next month silently rewrites the terms of every existing booking — a bug that is also a broken promise to the guest.",
          "Terms are a snapshot"
        ),
        compare(
          [
            {
              label: "Lock inventory rows, then check",
              time: "Waits under contention",
              space: "Row locks per txn",
              when: "Very hot dates where conflicting retries would be wasteful. Keep the transaction to the update and nothing else.",
            },
            {
              label: "Conditional counter update",
              time: "One statement per stay",
              space: "One row per type per night",
              when: "The default. The check is part of the write, all nights succeed or the transaction rolls back.",
              preferred: true,
            },
            {
              label: "Single writer per hotel",
              time: "Serialised per hotel",
              space: "One queue per hotel",
              when: "Very complex allocation rules that are hard to express as one conditional update; throughput per hotel is modest anyway.",
            },
            {
              label: "Assign rooms at booking with (room, night) unique",
              time: "Index check per night",
              space: "One row per room per night",
              when: "Guests choose a specific room — a particular view, accessibility needs. Pays the fragmentation cost for the guarantee.",
            },
          ],
          "Keeping two guests out of the last room"
        ),
        h2("Extensions"),
        ul(
          "Overbooking: allow held + booked to reach a configured multiple of total. One number in the condition, but a policy decision with real costs, so it belongs in a named, owned setting.",
          "Multi-room bookings: hold every room type in one transaction, so a family's two rooms are all-or-nothing.",
          "Payment retries: confirming must be idempotent, keyed on the payment reference, or a retried confirmation charges twice.",
          "Selling through several travel sites: each channel becomes a client of the same inventory rows; whatever the channel, the conditional update stays the single point where availability is decided."
        ),
      ],
    },
  ],
};

/** Concurrency in object design, and modelling case studies. */
export const LLD_MORE_SECTIONS: SectionSeed[] = [CONCURRENCY, CASE_STUDIES];
