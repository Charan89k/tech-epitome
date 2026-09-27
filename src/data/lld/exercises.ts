import type { Difficulty } from "@/generated/prisma/enums";
import type { ClassDiagram } from "@/lib/class-diagram/types";

/**
 * LLD exercises.
 *
 * The subjects are unavoidably familiar — a parking lot and a vending
 * machine are common because they are genuinely good vehicles for
 * teaching responsibility assignment — but every requirement, entity
 * description, hint, reference design and trade-off here is written for
 * this platform.
 *
 * `classDiagram`, `code` and `tradeoffs` are REFERENCE MATERIAL. They are
 * withheld by `services/lld.ts` until the learner submits, and they are
 * never placed in the AI reviewer's context.
 */

export type LLDExerciseSeed = {
  slug: string;
  title: string;
  tagline: string;
  difficulty: Difficulty;
  access?: "FREE" | "PRO";
  requirements: string[];
  constraints: string[];
  objectives: string[];
  principles: string[];
  designPatterns: string[];
  extensions: string[];
  entities: { name: string; responsibility: string }[];
  /** Conceptual → directional → structural → near-solution. */
  hints: string[];
  classDiagram: ClassDiagram;
  code: Record<string, string>;
  tradeoffs: { decision: string; chose: string; over: string; because: string }[];
};

const cls = (
  id: string,
  name: string,
  kind: ClassDiagram["types"][number]["kind"] = "class",
  attributes: ClassDiagram["types"][number]["attributes"] = [],
  methods: ClassDiagram["types"][number]["methods"] = []
) => ({ id, name, kind, attributes, methods });

export const LLD_EXERCISES: LLDExerciseSeed[] = [
  {
    slug: "parking-garage",
    title: "Parking Garage",
    tagline:
      "Allocate spaces to vehicles of different sizes, and charge for the time used.",
    difficulty: "EASY",
    requirements: [
      "Park a vehicle in a space that fits it, and reject it when the garage is full",
      "Support several vehicle sizes with different space requirements",
      "Issue a ticket on entry recording the space and the time",
      "Calculate a fee on exit from the elapsed time and the vehicle size",
      "Free the space when the vehicle leaves",
    ],
    constraints: [
      "One garage, several floors; you may assume a single process",
      "Fees are computed at exit — no pre-payment or reservations",
      "You may assume a clock is available for timestamps",
    ],
    objectives: [
      "Assign responsibilities so that no class both allocates space and prices it",
      "Model vehicle sizing without a chain of conditionals per size",
      "Put the pricing rule behind a seam so a second rule can be added",
    ],
    principles: [
      "Single Responsibility",
      "Open/Closed",
      "Program to interfaces",
    ],
    designPatterns: ["Strategy", "Factory Method"],
    extensions: [
      "Add monthly pass holders who are never charged per hour",
      "Add electric bays that only certain vehicles may use",
      "Support a second garage with different pricing",
    ],
    entities: [
      { name: "Vehicle", responsibility: "Knows its identity and the size class it needs" },
      { name: "ParkingSpace", responsibility: "Knows its size and whether it is occupied" },
      { name: "Ticket", responsibility: "Records which vehicle took which space, and when" },
      { name: "Garage", responsibility: "Finds a fitting space and releases it again" },
      { name: "FeePolicy", responsibility: "Turns an elapsed duration into an amount" },
    ],
    hints: [
      "Start by listing the nouns in the requirements and asking, for each, what it is the only thing that knows. If two of your classes both know the price, one of them should not.",
      "Charging is a rule that will change — weekends, seasons, passes. Rules that change belong behind an abstraction rather than inside the class that happens to call them.",
      "Consider a FeePolicy interface with one method taking the ticket and returning an amount. The Garage then holds a FeePolicy rather than a pricing method, and a second policy is a new class rather than a new branch.",
      "A workable shape: an abstract Vehicle with concrete subclasses that declare their required size; ParkingSpace holding a size and an occupant; Garage composing many ParkingSpaces and depending on a FeePolicy interface; Ticket associating a Vehicle with a ParkingSpace and an entry time.",
    ],
    classDiagram: {
      types: [
        cls(
          "vehicle",
          "Vehicle",
          "abstract",
          [
            { name: "plate", type: "String", visibility: "protected" },
          ],
          [
            { name: "requiredSize", params: "", returns: "SpaceSize", visibility: "public", isAbstract: true },
          ]
        ),
        cls("car", "Car"),
        cls("motorcycle", "Motorcycle"),
        cls("van", "Van"),
        cls("size", "SpaceSize", "enum"),
        cls(
          "space",
          "ParkingSpace",
          "class",
          [
            { name: "size", type: "SpaceSize", visibility: "private" },
            { name: "occupant", type: "Vehicle", visibility: "private" },
          ],
          [
            { name: "fits", params: "v: Vehicle", returns: "boolean", visibility: "public" },
            { name: "release", params: "", returns: "void", visibility: "public" },
          ]
        ),
        cls(
          "ticket",
          "Ticket",
          "class",
          [
            { name: "issuedAt", type: "Instant", visibility: "private" },
          ],
          []
        ),
        cls(
          "policy",
          "FeePolicy",
          "interface",
          [],
          [
            { name: "feeFor", params: "t: Ticket, exit: Instant", returns: "Money", visibility: "public", isAbstract: true },
          ]
        ),
        cls("hourly", "HourlyFeePolicy"),
        cls(
          "garage",
          "Garage",
          "class",
          [],
          [
            { name: "park", params: "v: Vehicle", returns: "Ticket", visibility: "public" },
            { name: "leave", params: "t: Ticket", returns: "Money", visibility: "public" },
          ]
        ),
      ],
      relationships: [
        { id: "r1", from: "car", to: "vehicle", kind: "inheritance" },
        { id: "r2", from: "motorcycle", to: "vehicle", kind: "inheritance" },
        { id: "r3", from: "van", to: "vehicle", kind: "inheritance" },
        { id: "r4", from: "hourly", to: "policy", kind: "implementation" },
        { id: "r5", from: "garage", to: "space", kind: "composition", label: "1..*" },
        { id: "r6", from: "garage", to: "policy", kind: "dependency" },
        { id: "r7", from: "ticket", to: "vehicle", kind: "association" },
        { id: "r8", from: "ticket", to: "space", kind: "association" },
        { id: "r9", from: "space", to: "size", kind: "association" },
      ],
    },
    code: {
      JAVA: `public interface FeePolicy {
    Money feeFor(Ticket ticket, Instant exit);
}

public final class HourlyFeePolicy implements FeePolicy {
    private final Map<SpaceSize, Money> ratePerHour;

    public HourlyFeePolicy(Map<SpaceSize, Money> ratePerHour) {
        this.ratePerHour = Map.copyOf(ratePerHour);
    }

    @Override
    public Money feeFor(Ticket ticket, Instant exit) {
        long hours = Math.max(1, Duration.between(ticket.issuedAt(), exit).toHours());
        return ratePerHour.get(ticket.space().size()).times(hours);
    }
}

public final class Garage {
    private final List<ParkingSpace> spaces;
    private final FeePolicy feePolicy;   // the seam: a rule, not a method

    public Ticket park(Vehicle vehicle) {
        ParkingSpace space = spaces.stream()
            .filter(s -> s.fits(vehicle))
            .findFirst()
            .orElseThrow(() -> new GarageFullException(vehicle));
        return space.accept(vehicle, clock.instant());
    }

    public Money leave(Ticket ticket) {
        Money fee = feePolicy.feeFor(ticket, clock.instant());
        ticket.space().release();
        return fee;
    }
}`,
    },
    tradeoffs: [
      {
        decision: "How the fee is calculated",
        chose: "A FeePolicy interface the Garage depends on",
        over: "A calculateFee method on Garage",
        because:
          "Pricing is the part of this system most certain to change, and it changes for reasons that have nothing to do with allocating spaces. Separating them means a weekend rate is a new class rather than an edit to the class that also decides where cars go.",
      },
      {
        decision: "How vehicle size is modelled",
        chose: "An abstract method on Vehicle returning a SpaceSize",
        over: "A switch on a vehicle type enum wherever size is needed",
        because:
          "A switch has to be found and updated everywhere when a new vehicle appears; an abstract method makes the compiler point at the one place that is missing. The cost is a class per vehicle type, which is only worth it because vehicles differ in behaviour and not just in a label.",
      },
      {
        decision: "Whether Ticket holds the fee",
        chose: "No — the fee is computed at exit and returned",
        over: "Storing a fee field on Ticket at entry",
        because:
          "The fee is not knowable at entry, and a field that is null for most of an object's life is a sign the object is being asked to hold two different states. Computing on exit keeps Ticket a record of what happened rather than a mutable scratchpad.",
      },
    ],
  },

  {
    slug: "vending-machine",
    title: "Vending Machine",
    tagline:
      "Take money, dispense a product, give change — and behave correctly at every step in between.",
    difficulty: "MEDIUM",
    requirements: [
      "Accept coins one at a time and track the running balance",
      "Let a customer select a product only once enough money is inserted",
      "Dispense the product and return the correct change",
      "Refuse selection when the product is out of stock",
      "Allow the customer to cancel and get their money back at any point",
    ],
    constraints: [
      "A fixed set of coin denominations; you may assume the machine always has change",
      "One transaction at a time — no concurrency required",
      "Restocking is out of scope",
    ],
    objectives: [
      "Model a machine whose legal actions depend on what has happened so far",
      "Avoid a boolean field per condition and a conditional at every entry point",
      "Keep the rule about what may happen next in one place",
    ],
    principles: ["Single Responsibility", "Open/Closed", "Encapsulate what varies"],
    designPatterns: ["State", "Strategy"],
    extensions: [
      "Add card payment alongside coins",
      "Add a maintenance mode only an operator can enter",
      "Handle the machine running out of change mid-transaction",
    ],
    entities: [
      { name: "VendingMachine", responsibility: "Holds the current state and delegates every action to it" },
      { name: "MachineState", responsibility: "Decides what each action means right now, and what happens next" },
      { name: "Product", responsibility: "Knows its price and identity" },
      { name: "Inventory", responsibility: "Knows how many of each product remain" },
      { name: "CoinBox", responsibility: "Accumulates inserted coins and makes change" },
    ],
    hints: [
      "Write down every action a customer can take, then for each one ask: is it always legal? The ones whose answer is 'it depends' are telling you the machine has modes.",
      "If you find yourself adding a boolean like hasMoney or isDispensing, and then checking it at the top of every method, that is a state machine trying to get out.",
      "Consider making each mode a class implementing a common interface, with one method per action. The machine holds a current mode and forwards to it; each mode returns the mode that should come next.",
      "A workable shape: a MachineState interface with insertCoin, select and cancel; concrete Idle, HasMoney and Dispensing states implementing it; VendingMachine composing a current MachineState, an Inventory and a CoinBox, and delegating every public method to the current state.",
    ],
    classDiagram: {
      types: [
        cls(
          "state",
          "MachineState",
          "interface",
          [],
          [
            { name: "insertCoin", params: "c: Coin", returns: "MachineState", visibility: "public", isAbstract: true },
            { name: "select", params: "code: String", returns: "MachineState", visibility: "public", isAbstract: true },
            { name: "cancel", params: "", returns: "MachineState", visibility: "public", isAbstract: true },
          ]
        ),
        cls("idle", "IdleState"),
        cls("hasmoney", "HasMoneyState"),
        cls("dispensing", "DispensingState"),
        cls(
          "machine",
          "VendingMachine",
          "class",
          [{ name: "current", type: "MachineState", visibility: "private" }],
          [
            { name: "insertCoin", params: "c: Coin", returns: "void", visibility: "public" },
            { name: "select", params: "code: String", returns: "void", visibility: "public" },
            { name: "cancel", params: "", returns: "void", visibility: "public" },
          ]
        ),
        cls(
          "inventory",
          "Inventory",
          "class",
          [],
          [
            { name: "countOf", params: "p: Product", returns: "int", visibility: "public" },
            { name: "take", params: "p: Product", returns: "void", visibility: "public" },
          ]
        ),
        cls(
          "coinbox",
          "CoinBox",
          "class",
          [{ name: "balance", type: "Money", visibility: "private" }],
          [{ name: "makeChange", params: "amount: Money", returns: "List<Coin>", visibility: "public" }]
        ),
        cls("product", "Product", "class", [
          { name: "price", type: "Money", visibility: "private" },
        ]),
        cls("coin", "Coin", "enum"),
      ],
      relationships: [
        { id: "r1", from: "idle", to: "state", kind: "implementation" },
        { id: "r2", from: "hasmoney", to: "state", kind: "implementation" },
        { id: "r3", from: "dispensing", to: "state", kind: "implementation" },
        { id: "r4", from: "machine", to: "state", kind: "association", label: "current" },
        { id: "r5", from: "machine", to: "inventory", kind: "composition" },
        { id: "r6", from: "machine", to: "coinbox", kind: "composition" },
        { id: "r7", from: "inventory", to: "product", kind: "aggregation" },
        { id: "r8", from: "coinbox", to: "coin", kind: "aggregation" },
      ],
    },
    code: {
      JAVA: `public interface MachineState {
    MachineState insertCoin(Coin coin);
    MachineState select(String code);
    MachineState cancel();
}

/** Nothing inserted yet: selecting is meaningless, cancelling is a no-op. */
public final class IdleState implements MachineState {
    private final VendingMachine machine;

    @Override public MachineState insertCoin(Coin coin) {
        machine.coinBox().accept(coin);
        return new HasMoneyState(machine);
    }

    @Override public MachineState select(String code) {
        machine.display("Insert coins first");
        return this;                       // no illegal-state exception needed
    }

    @Override public MachineState cancel() { return this; }
}

public final class VendingMachine {
    private MachineState current = new IdleState(this);

    // Every public action is one line, because "is this legal now?" is
    // the state's job rather than a conditional repeated here.
    public void insertCoin(Coin coin) { current = current.insertCoin(coin); }
    public void select(String code)   { current = current.select(code); }
    public void cancel()              { current = current.cancel(); }
}`,
    },
    tradeoffs: [
      {
        decision: "How machine modes are represented",
        chose: "A class per state implementing a shared interface",
        over: "Boolean flags checked at the top of each method",
        because:
          "With flags, the rule about what is legal when is scattered across every method and has to be re-derived to change anything. With states, the rule lives in one class per mode and a new mode cannot silently break the others. The cost is more classes for a machine with only three modes — worth it here because the modes are the subject being taught.",
      },
      {
        decision: "What a state's action returns",
        chose: "The next state",
        over: "Mutating the machine's current state from inside the state",
        because:
          "Returning the next state makes the transition visible at the call site and keeps each state ignorant of how the machine stores it. A state that reaches back and mutates the machine creates a cycle that makes both harder to test alone.",
      },
      {
        decision: "Where change-making lives",
        chose: "A CoinBox the machine composes",
        over: "Change logic on VendingMachine",
        because:
          "Making change is a self-contained algorithm with its own edge cases, and it is the part most likely to grow. Keeping it separate means it can be tested without constructing a machine at all.",
      },
    ],
  },

  {
    slug: "event-logger",
    title: "Event Logger",
    tagline:
      "Write log events to several destinations, filtered by level, without the caller knowing where they go.",
    difficulty: "EASY",
    access: "FREE",
    requirements: [
      "Accept a message at one of several severity levels",
      "Write to more than one destination — console and file at minimum",
      "Drop events below a configured minimum level",
      "Let the destinations be configured without changing calling code",
      "Allow a destination to format its output differently from the others",
    ],
    constraints: [
      "Single process; concurrency is an extension, not a requirement",
      "You may assume a destination never fails",
    ],
    objectives: [
      "Separate deciding what to log from deciding where it goes",
      "Add a destination without editing the logger",
      "Recognise when a small interface is better than a large one",
    ],
    principles: [
      "Open/Closed",
      "Interface Segregation",
      "Dependency Inversion",
      "Composition over inheritance",
    ],
    designPatterns: ["Strategy", "Decorator", "Composite"],
    extensions: [
      "Add an asynchronous destination that batches writes",
      "Add a destination that only receives errors",
      "Make the logger safe to call from several threads",
    ],
    entities: [
      { name: "Logger", responsibility: "Accepts events and passes those above the threshold to its sinks" },
      { name: "LogSink", responsibility: "Writes one formatted event somewhere" },
      { name: "LogEvent", responsibility: "Carries the message, level and timestamp" },
      { name: "LogLevel", responsibility: "Orders severities so a threshold comparison is possible" },
      { name: "Formatter", responsibility: "Turns an event into the text a sink writes" },
    ],
    hints: [
      "There are two independent decisions here: whether an event is worth recording, and where a recorded event goes. Notice that they change for different reasons and at different times.",
      "If adding a new destination means editing the Logger class, the design is closed to the wrong thing. What would let a destination be handed in rather than known about?",
      "Consider a LogSink interface with a single write method, and a Logger holding a list of them. Formatting can be a second, separate interface a sink uses, so a sink that wants JSON and one that wants plain text do not need different sinks.",
      "A workable shape: LogSink as a one-method interface implemented by ConsoleSink and FileSink; a Formatter interface each sink composes; Logger holding a LogLevel threshold and a collection of LogSinks. A CompositeSink implementing LogSink and holding other sinks lets a group be treated as one.",
    ],
    classDiagram: {
      types: [
        cls("level", "LogLevel", "enum"),
        cls(
          "event",
          "LogEvent",
          "class",
          [
            { name: "level", type: "LogLevel", visibility: "private" },
            { name: "message", type: "String", visibility: "private" },
            { name: "at", type: "Instant", visibility: "private" },
          ],
          []
        ),
        cls(
          "sink",
          "LogSink",
          "interface",
          [],
          [{ name: "write", params: "e: LogEvent", returns: "void", visibility: "public", isAbstract: true }]
        ),
        cls("console", "ConsoleSink"),
        cls("file", "FileSink"),
        cls("composite", "CompositeSink"),
        cls(
          "formatter",
          "Formatter",
          "interface",
          [],
          [{ name: "format", params: "e: LogEvent", returns: "String", visibility: "public", isAbstract: true }]
        ),
        cls("plain", "PlainFormatter"),
        cls(
          "logger",
          "Logger",
          "class",
          [{ name: "threshold", type: "LogLevel", visibility: "private" }],
          [
            { name: "log", params: "level: LogLevel, msg: String", returns: "void", visibility: "public" },
          ]
        ),
      ],
      relationships: [
        { id: "r1", from: "console", to: "sink", kind: "implementation" },
        { id: "r2", from: "file", to: "sink", kind: "implementation" },
        { id: "r3", from: "composite", to: "sink", kind: "implementation" },
        { id: "r4", from: "composite", to: "sink", kind: "aggregation", label: "children" },
        { id: "r5", from: "plain", to: "formatter", kind: "implementation" },
        { id: "r6", from: "console", to: "formatter", kind: "dependency" },
        { id: "r7", from: "file", to: "formatter", kind: "dependency" },
        { id: "r8", from: "logger", to: "sink", kind: "aggregation", label: "1..*" },
        { id: "r9", from: "logger", to: "level", kind: "association" },
        { id: "r10", from: "logger", to: "event", kind: "dependency" },
      ],
    },
    code: {
      JAVA: `public interface LogSink {
    void write(LogEvent event);          // one method: nothing to segregate
}

public interface Formatter {
    String format(LogEvent event);
}

public final class ConsoleSink implements LogSink {
    private final Formatter formatter;   // composed, not inherited

    @Override public void write(LogEvent event) {
        System.out.println(formatter.format(event));
    }
}

/** Treats a group of sinks as one. Composite, and the reason LogSink is tiny. */
public final class CompositeSink implements LogSink {
    private final List<LogSink> children;

    @Override public void write(LogEvent event) {
        children.forEach(child -> child.write(event));
    }
}

public final class Logger {
    private final LogLevel threshold;
    private final LogSink sink;          // may be one, may be a composite

    public void log(LogLevel level, String message) {
        if (level.isBelow(threshold)) return;   // the only decision Logger makes
        sink.write(new LogEvent(level, message, clock.instant()));
    }
}`,
    },
    tradeoffs: [
      {
        decision: "How destinations are added",
        chose: "A LogSink interface the Logger holds",
        over: "Subclassing Logger per destination",
        because:
          "Subclassing forces a choice of exactly one destination per logger and makes 'console and file' impossible without multiple inheritance. Composing sinks makes that case trivial, and it is the clearest example in this track of why composition beats inheritance for varying behaviour.",
      },
      {
        decision: "Whether formatting belongs to the sink",
        chose: "A separate Formatter each sink composes",
        over: "A format method on LogSink",
        because:
          "Putting format on LogSink means every sink must implement it, including one that forwards to another sink and formats nothing. A separate interface keeps LogSink to the one method every sink genuinely has — which is Interface Segregation with a concrete cost attached.",
      },
      {
        decision: "Where the level threshold is checked",
        chose: "Once in Logger, before the event is constructed",
        over: "In each sink",
        because:
          "Checking once avoids building an object that is about to be discarded, and it keeps 'is this worth recording' as one decision rather than one per destination. The trade is that a sink cannot have its own stricter threshold — which the extension task asks you to solve.",
      },
    ],
  },
];
