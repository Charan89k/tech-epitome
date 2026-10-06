import type { ClassDiagram } from "@/lib/class-diagram/types";
import type { LLDExerciseSeed } from "./exercises";

type DiagramType = ClassDiagram["types"][number];

const cls = (
  id: string,
  name: string,
  kind: DiagramType["kind"] = "class",
  attributes: DiagramType["attributes"] = [],
  methods: DiagramType["methods"] = []
) => ({ id, name, kind, attributes, methods });

/** Further LLD exercises, appended after the originals. */
export const MORE_LLD_EXERCISES: LLDExerciseSeed[] = [
  {
    slug: "elevator-controller",
    title: "Elevator Controller",
    tagline:
      "Send the right car to each call, serve stops in a sensible order, and never move with the doors open.",
    difficulty: "MEDIUM",
    requirements: [
      "Accept hall calls (a floor and a direction) from the landing buttons",
      "Accept car calls (a destination floor) from the panel inside each car",
      "Assign every hall call to exactly one of several cars",
      "Serve each car's stops in its current direction of travel before reversing",
      "Open the doors on arrival, and never move a car while its doors are open",
    ],
    constraints: [
      "One building with a fixed number of floors and cars",
      "Time advances in discrete ticks; a moving car travels one floor per tick",
      "No physics, weight limits or emergency modes — those are extensions",
      "The controller runs on a single thread",
    ],
    objectives: [
      "Separate choosing which car answers a call from deciding the order a car serves its stops",
      "Make the doors-open safety rule a property of the structure rather than a check someone must remember",
      "Put the dispatch rule behind a seam so a different rule can be tried without editing the controller",
    ],
    principles: ["Single Responsibility", "Open/Closed", "Encapsulate what varies"],
    designPatterns: ["Strategy", "State"],
    extensions: [
      "Add a fire-service mode that recalls every car to the lobby and ignores new calls",
      "Skip hall calls for a car that reports it is at capacity",
      "Support destination dispatch, where riders choose their floor in the lobby before boarding",
    ],
    entities: [
      {
        name: "ElevatorController",
        responsibility: "Receives hall calls, hands each to one car, and advances time",
      },
      {
        name: "DispatchStrategy",
        responsibility: "Decides which car should answer a given hall call",
      },
      {
        name: "ElevatorCar",
        responsibility:
          "Knows its floor and heading, and delegates each tick to its state",
      },
      {
        name: "StopSet",
        responsibility:
          "Holds a car's requested floors and picks the next one to serve",
      },
      {
        name: "CarState",
        responsibility: "Decides what a car does on this tick and which state follows",
      },
      { name: "HallCall", responsibility: "Records a request made from a landing" },
    ],
    hints: [
      "There are two different questions hiding in 'run the elevators': which car should go to a waiting rider, and in what order a single car should visit the floors it has been asked for. They have different inputs and change for different reasons.",
      "A car standing with its doors open must refuse to move no matter who asks. If that rule lives in an if-statement at the top of a move method, every future change to movement has to remember it — look for a shape in which an open-doors car simply has no way to move.",
      "Consider a DispatchStrategy interface the controller holds, a StopSet per car that returns the next floor to visit given the current floor and heading, and a CarState interface with a single tick method returning the next state. Idle, Moving and DoorsOpen are its natural implementations.",
      "A workable shape: ElevatorController composing several ElevatorCars and depending on a DispatchStrategy (NearestCarStrategy as the first implementation); each ElevatorCar composing a StopSet backed by a sorted set and holding a current CarState. Idle asks the StopSet for the next floor and turns towards it; Moving advances one floor and switches to DoorsOpen when it reaches a requested floor; DoorsOpen counts down and returns to Idle. Only Moving ever changes the floor.",
    ],
    classDiagram: {
      types: [
        cls(
          "controller",
          "ElevatorController",
          "class",
          [],
          [
            {
              name: "hallCall",
              params: "call: HallCall",
              returns: "void",
              visibility: "public",
            },
            { name: "tick", params: "", returns: "void", visibility: "public" },
          ]
        ),
        cls(
          "dispatch",
          "DispatchStrategy",
          "interface",
          [],
          [
            {
              name: "choose",
              params: "call: HallCall, cars: List<ElevatorCar>",
              returns: "ElevatorCar",
              visibility: "public",
              isAbstract: true,
            },
          ]
        ),
        cls("nearest", "NearestCarStrategy"),
        cls(
          "car",
          "ElevatorCar",
          "class",
          [
            { name: "floor", type: "int", visibility: "private" },
            { name: "heading", type: "Direction", visibility: "private" },
          ],
          [
            {
              name: "request",
              params: "floor: int",
              returns: "void",
              visibility: "public",
            },
            { name: "tick", params: "", returns: "void", visibility: "public" },
          ]
        ),
        cls(
          "stops",
          "StopSet",
          "class",
          [{ name: "floors", type: "NavigableSet<Integer>", visibility: "private" }],
          [
            {
              name: "next",
              params: "current: int, heading: Direction",
              returns: "OptionalInt",
              visibility: "public",
            },
          ]
        ),
        cls(
          "state",
          "CarState",
          "interface",
          [],
          [
            {
              name: "tick",
              params: "car: ElevatorCar",
              returns: "CarState",
              visibility: "public",
              isAbstract: true,
            },
          ]
        ),
        cls("idle", "IdleState"),
        cls("moving", "MovingState"),
        cls("doors", "DoorsOpenState", "class", [
          { name: "ticksLeft", type: "int", visibility: "private" },
        ]),
        cls("call", "HallCall", "class", [
          { name: "floor", type: "int", visibility: "private" },
          { name: "direction", type: "Direction", visibility: "private" },
        ]),
      ],
      relationships: [
        { id: "r1", from: "nearest", to: "dispatch", kind: "implementation" },
        { id: "r2", from: "idle", to: "state", kind: "implementation" },
        { id: "r3", from: "moving", to: "state", kind: "implementation" },
        { id: "r4", from: "doors", to: "state", kind: "implementation" },
        { id: "r5", from: "controller", to: "car", kind: "composition", label: "1..*" },
        { id: "r6", from: "controller", to: "dispatch", kind: "dependency" },
        { id: "r7", from: "controller", to: "call", kind: "dependency" },
        { id: "r8", from: "car", to: "stops", kind: "composition" },
        { id: "r9", from: "car", to: "state", kind: "association", label: "current" },
        { id: "r10", from: "dispatch", to: "car", kind: "dependency" },
      ],
    },
    code: {
      JAVA: `public interface DispatchStrategy {
    ElevatorCar choose(HallCall call, List<ElevatorCar> cars);
}

/** Prefers a car already heading past the caller; a car moving away is a last resort. */
public final class NearestCarStrategy implements DispatchStrategy {
    private final int floorCount;

    @Override
    public ElevatorCar choose(HallCall call, List<ElevatorCar> cars) {
        return cars.stream()
            .min(Comparator.comparingInt(car -> cost(car, call)))
            .orElseThrow();
    }

    private int cost(ElevatorCar car, HallCall call) {
        int distance = Math.abs(car.floor() - call.floor());
        if (car.isIdle()) return distance;
        boolean onTheWay = car.heading() == call.direction()
            && (call.direction() == Direction.UP
                ? car.floor() <= call.floor()
                : car.floor() >= call.floor());
        return onTheWay ? distance : distance + 2 * floorCount;
    }
}

/** Requested floors, served in LOOK order: keep going while stops remain ahead, then turn. */
public final class StopSet {
    private final NavigableSet<Integer> floors = new TreeSet<>();

    public void add(int floor)        { floors.add(floor); }
    public void remove(int floor)     { floors.remove(floor); }
    public boolean contains(int floor) { return floors.contains(floor); }

    public OptionalInt next(int current, Direction heading) {
        Integer ahead  = heading == Direction.UP ? floors.ceiling(current) : floors.floor(current);
        Integer behind = heading == Direction.UP ? floors.floor(current) : floors.ceiling(current);
        Integer pick = ahead != null ? ahead : behind;
        return pick == null ? OptionalInt.empty() : OptionalInt.of(pick);
    }
}

public interface CarState {
    CarState tick(ElevatorCar car);
}

/** The only state that changes the floor — so "doors open" cannot move by construction. */
public final class MovingState implements CarState {
    @Override
    public CarState tick(ElevatorCar car) {
        car.stepOneFloor();
        if (car.stops().contains(car.floor())) {
            car.stops().remove(car.floor());
            return new DoorsOpenState(DWELL_TICKS);
        }
        return this;
    }
}

public final class ElevatorCar {
    private int floor;
    private Direction heading = Direction.UP;
    private CarState state = new IdleState();
    private final StopSet stops = new StopSet();

    public void request(int floor) { stops.add(floor); }
    public void tick()             { state = state.tick(this); }
}

public final class ElevatorController {
    private final List<ElevatorCar> cars;
    private final DispatchStrategy dispatch;   // the seam: a rule, not a method

    public void hallCall(HallCall call) {
        dispatch.choose(call, cars).request(call.floor());
    }

    public void tick() { cars.forEach(ElevatorCar::tick); }
}`,
    },
    tradeoffs: [
      {
        decision: "Who decides which car answers a hall call",
        chose: "A DispatchStrategy interface the controller depends on",
        over: "A nearest-car loop written inside ElevatorController",
        because:
          "Dispatch is the part of an elevator system that gets tuned — for morning up-peak, for energy saving, for a building with an express bank — and none of that has anything to do with moving cars or opening doors. Behind an interface, a new rule is a new class that can be compared against the old one in a simulation.",
      },
      {
        decision: "How a car's modes are represented",
        chose: "A CarState interface with Idle, Moving and DoorsOpen implementations",
        over: "A mode enum and a switch inside ElevatorCar.tick",
        because:
          "With three modes a switch is honestly readable, so this is a close call. The deciding factor is safety: when only MovingState can change the floor, 'never move with the doors open' is guaranteed by which code exists rather than by a guard every future edit must preserve. The cost is three small classes and a car that exposes a little more of itself to its states.",
      },
      {
        decision: "What a car's stop list remembers",
        chose: "A plain sorted set of floors",
        over: "Separate up and down queues tagged with each hall call's direction",
        because:
          "A single set is easy to reason about and gives LOOK ordering almost for free. It loses one piece of information: a car travelling up will stop for a rider who pressed 'down', who then has to wait for it to come back. Direction-tagged queues fix that at the price of a noticeably harder next-stop rule.",
      },
      {
        decision: "When a hall call is assigned to a car",
        chose: "Once, at the moment the button is pressed",
        over: "Re-evaluating every pending call on every tick",
        because:
          "Committing immediately is simple and lets a landing display tell the rider which car is coming. The cost is that an assignment can go stale — a car chosen as nearest may pick up several car calls on the way — which continuous reassignment avoids by spending far more work per tick and confusing riders when the promised car changes.",
      },
    ],
  },

  {
    slug: "library-lending",
    title: "Library Lending",
    tagline:
      "Lend physical copies, take them back, and queue members fairly for books that are all out.",
    difficulty: "EASY",
    requirements: [
      "Keep a catalogue of titles, each with one or more physical copies",
      "Let a member borrow an available copy, up to a limit on simultaneous loans",
      "Record a due date on each loan, and a late fine when a copy comes back overdue",
      "Let a member place a hold on a title when no copy is available",
      "When a copy is returned, reserve it for the earliest hold on that title, if there is one",
    ],
    constraints: [
      "One branch and a single process",
      "Holds are placed on a title, never on a specific copy",
      "Fines are calculated at return; collecting them is out of scope",
    ],
    objectives: [
      "Tell a title (the work) apart from a copy (the object on the shelf)",
      "Keep lending rules — limits, loan periods, fines — out of the classes that record what happened",
      "Give holds a clear owner and a first-come, first-served order",
    ],
    principles: [
      "Single Responsibility",
      "Encapsulate what varies",
      "Program to interfaces",
    ],
    designPatterns: ["Strategy"],
    extensions: [
      "Let a member renew a loan, unless another member holds that title",
      "Give staff members a higher loan limit and a longer loan period",
      "Expire a reserved copy that nobody collects within three days and pass it to the next hold",
    ],
    entities: [
      {
        name: "Title",
        responsibility: "Describes a work and owns its copies and its hold queue",
      },
      {
        name: "Copy",
        responsibility:
          "Knows its barcode and whether it is on the shelf, out or reserved",
      },
      { name: "Member", responsibility: "Identifies a borrower" },
      {
        name: "Loan",
        responsibility: "Records which member has which copy, and when it is due",
      },
      {
        name: "HoldQueue",
        responsibility: "Keeps waiting members for one title in arrival order",
      },
      {
        name: "LendingPolicy",
        responsibility: "Supplies loan limits, loan periods and fines",
      },
      { name: "Library", responsibility: "Coordinates borrowing, returns and holds" },
    ],
    hints: [
      "Read the requirements and notice that 'book' means two different things: something a member searches for and puts a hold on, and something with a barcode that can be late. Those are not the same object.",
      "Ask where each rule should live. 'At most five loans' and 'fourteen days' are library decisions that will change; 'this copy is out' is a fact. Facts and policies belong in different places.",
      "Consider a Loan class that connects a Member to a Copy with a due date, rather than putting a borrower field on Copy. Then put limits, periods and the fine calculation behind a LendingPolicy interface, and give each Title its own queue of holds.",
      "A workable shape: Library composing Titles and depending on a LendingPolicy; each Title composing its Copies and one HoldQueue of Members; Copy holding a CopyStatus enum (AVAILABLE, ON_LOAN, RESERVED); Loan associating a Member with a Copy and a due date. On return, Library closes the Loan, asks the policy for a fine, then asks the copy's Title whether anyone is waiting before putting it back on the shelf.",
    ],
    classDiagram: {
      types: [
        cls(
          "library",
          "Library",
          "class",
          [],
          [
            {
              name: "borrow",
              params: "m: Member, t: Title",
              returns: "Loan",
              visibility: "public",
            },
            {
              name: "giveBack",
              params: "c: Copy",
              returns: "Money",
              visibility: "public",
            },
            {
              name: "placeHold",
              params: "m: Member, t: Title",
              returns: "void",
              visibility: "public",
            },
          ]
        ),
        cls(
          "title",
          "Title",
          "class",
          [{ name: "isbn", type: "String", visibility: "private" }],
          [
            {
              name: "availableCopy",
              params: "",
              returns: "Optional<Copy>",
              visibility: "public",
            },
          ]
        ),
        cls(
          "copy",
          "Copy",
          "class",
          [
            { name: "barcode", type: "String", visibility: "private" },
            { name: "status", type: "CopyStatus", visibility: "private" },
          ],
          []
        ),
        cls("status", "CopyStatus", "enum"),
        cls("member", "Member", "class", [
          { name: "id", type: "String", visibility: "private" },
        ]),
        cls(
          "loan",
          "Loan",
          "class",
          [
            { name: "dueOn", type: "LocalDate", visibility: "private" },
            { name: "returnedOn", type: "LocalDate", visibility: "private" },
          ],
          []
        ),
        cls(
          "holds",
          "HoldQueue",
          "class",
          [],
          [
            {
              name: "join",
              params: "m: Member",
              returns: "void",
              visibility: "public",
            },
            {
              name: "next",
              params: "",
              returns: "Optional<Member>",
              visibility: "public",
            },
          ]
        ),
        cls(
          "policy",
          "LendingPolicy",
          "interface",
          [],
          [
            {
              name: "maxLoans",
              params: "m: Member",
              returns: "int",
              visibility: "public",
              isAbstract: true,
            },
            {
              name: "loanPeriod",
              params: "m: Member",
              returns: "Period",
              visibility: "public",
              isAbstract: true,
            },
            {
              name: "fineFor",
              params: "l: Loan, returnedOn: LocalDate",
              returns: "Money",
              visibility: "public",
              isAbstract: true,
            },
          ]
        ),
        cls("standard", "StandardLendingPolicy"),
      ],
      relationships: [
        { id: "r1", from: "standard", to: "policy", kind: "implementation" },
        { id: "r2", from: "library", to: "title", kind: "composition", label: "1..*" },
        { id: "r3", from: "library", to: "loan", kind: "aggregation", label: "active" },
        { id: "r4", from: "library", to: "policy", kind: "dependency" },
        { id: "r5", from: "title", to: "copy", kind: "composition", label: "1..*" },
        { id: "r6", from: "title", to: "holds", kind: "composition" },
        {
          id: "r7",
          from: "holds",
          to: "member",
          kind: "aggregation",
          label: "waiting",
        },
        { id: "r8", from: "copy", to: "status", kind: "association" },
        { id: "r9", from: "loan", to: "copy", kind: "association" },
        { id: "r10", from: "loan", to: "member", kind: "association" },
      ],
    },
    code: {
      JAVA: `public interface LendingPolicy {
    int maxLoans(Member member);
    Period loanPeriod(Member member);
    Money fineFor(Loan loan, LocalDate returnedOn);
}

public final class StandardLendingPolicy implements LendingPolicy {
    private final Money finePerDay;

    @Override public int maxLoans(Member member)      { return 5; }
    @Override public Period loanPeriod(Member member) { return Period.ofDays(14); }

    @Override
    public Money fineFor(Loan loan, LocalDate returnedOn) {
        long daysLate = ChronoUnit.DAYS.between(loan.dueOn(), returnedOn);
        return daysLate <= 0 ? Money.ZERO : finePerDay.times(daysLate);
    }
}

/** The work, not the object: owns its copies and decides who is next in line. */
public final class Title {
    private final List<Copy> copies;
    private final HoldQueue holds = new HoldQueue();

    public Optional<Copy> availableCopy() {
        return copies.stream().filter(Copy::isAvailable).findFirst();
    }

    /** A returned copy goes to the earliest hold, or back on the shelf. */
    public void receive(Copy copy) {
        holds.next().ifPresentOrElse(copy::reserveFor, copy::shelve);
    }
}

public final class Library {
    private final Map<Copy, Loan> activeLoans = new HashMap<>();
    private final LendingPolicy policy;
    private final Clock clock;

    public Loan borrow(Member member, Title title) {
        if (loansHeldBy(member) >= policy.maxLoans(member)) {
            throw new LoanLimitReachedException(member);
        }
        Copy copy = title.availableCopy()
            .orElseThrow(() -> new NoCopyAvailableException(title));
        LocalDate today = LocalDate.now(clock);
        Loan loan = new Loan(member, copy, today.plus(policy.loanPeriod(member)));
        copy.markOnLoan();
        activeLoans.put(copy, loan);
        return loan;
    }

    public Money giveBack(Copy copy) {
        Loan loan = activeLoans.remove(copy);
        LocalDate today = LocalDate.now(clock);
        loan.close(today);                       // Loan stays as history
        copy.title().receive(copy);              // holds are the title's business
        return policy.fineFor(loan, today);
    }
}`,
    },
    tradeoffs: [
      {
        decision: "How books are modelled",
        chose: "Separate Title and Copy classes",
        over: "A single Book class with an availableCount field",
        because:
          "A count can say that two copies are out but not which two, so it cannot tell you which one is overdue, who has it, or which barcode just came back. Holds, loans and damage all happen to one physical object, while search and holds attach to the work. Two classes is the smallest model that keeps both truthful.",
      },
      {
        decision: "Where the record of a loan lives",
        chose: "A Loan object linking Member and Copy",
        over: "borrower and dueDate fields on Copy",
        because:
          "Fields on Copy would be null whenever the book is on the shelf and overwritten on every loan, so the library would lose its history the moment a copy went out again. A Loan is created once and closed once, which keeps Copy about the physical object and makes questions like 'what has this member borrowed?' answerable.",
      },
      {
        decision: "Where holds are kept",
        chose: "A HoldQueue owned by each Title",
        over: "One library-wide list of holds searched on every return",
        because:
          "The only question a return asks is 'who is waiting for this title?', and giving each title its own queue answers it directly and keeps first-come, first-served order obvious. A global list would make every return scan holds for unrelated books and spread the ordering rule across whoever does the searching.",
      },
      {
        decision: "Where loan limits, periods and fines are defined",
        chose: "A LendingPolicy interface",
        over: "Constants inside Library",
        because:
          "These numbers are set by people, not by the domain, and they are the first thing to vary, as the staff-member extension shows. Keeping them behind an interface means Library's borrowing logic never changes when the rules do. The cost is one more indirection for an exercise that starts with a single policy.",
      },
    ],
  },

  {
    slug: "expense-splitter",
    title: "Expense Splitter",
    tagline:
      "Record shared expenses split several ways, keep every balance exact, and suggest how to settle up.",
    difficulty: "MEDIUM",
    requirements: [
      "Create a group of members who share expenses",
      "Record an expense paid by one member and shared among some or all of the group",
      "Split an expense equally, by exact amounts, or by percentages",
      "Show each member's net balance: how much they are owed, or how much they owe",
      "Suggest a short list of payments that would bring every balance to zero",
      "Record a payment from one member to another as a settlement",
    ],
    constraints: [
      "One currency; amounts are whole minor units (cents) held in a long, never a floating-point number",
      "A split that cannot be divided exactly must place the leftover cents deterministically",
      "Single process; persistence is out of scope",
    ],
    objectives: [
      "Add a new way of splitting without editing the expense or ledger code",
      "Keep balances exact, so that every member's balance always sums to zero across the group",
      "Separate the record of what happened from the suggestion of who should pay whom",
    ],
    principles: ["Open/Closed", "Single Responsibility", "Encapsulate what varies"],
    designPatterns: ["Strategy", "Value Object"],
    extensions: [
      "Add split by shares, where one member has two shares and everyone else one",
      "Support expenses in several currencies using a fixed exchange rate per expense",
      "Allow an expense to be edited, with balances updated correctly",
    ],
    entities: [
      {
        name: "Group",
        responsibility: "Holds members and the expenses recorded between them",
      },
      { name: "Member", responsibility: "Identifies a person in the group" },
      {
        name: "Expense",
        responsibility: "Records who paid, how much, and how it is to be split",
      },
      {
        name: "SplitStrategy",
        responsibility: "Turns a total and a list of participants into exact shares",
      },
      { name: "Ledger", responsibility: "Keeps each member's running net balance" },
      {
        name: "SettlementPlanner",
        responsibility: "Proposes transfers that clear every balance",
      },
      {
        name: "Transfer",
        responsibility: "A suggested or recorded payment from one member to another",
      },
    ],
    hints: [
      "Before modelling anything, decide what 'balance' means. One number per member — positive if owed, negative if owing — is enough to answer every question here, and the numbers across the group must always add up to zero.",
      "The three ways of splitting differ only in how a total becomes shares; everything else about an expense is identical. Ask what would let a fourth way be added without anyone touching Expense. And decide now where the extra cent goes when 100 is split three ways.",
      "Consider a SplitStrategy interface with one method returning a share per participant, implemented by EqualSplit, ExactSplit and PercentSplit. An Expense holds one strategy; recording it credits the payer with the total and debits each participant their share in a Ledger. Settling up is a separate class that reads the Ledger.",
      "A workable shape: Group aggregating Members and composing a list of Expenses and one Ledger; Expense associating a payer, a total, participants and a SplitStrategy; each strategy guaranteeing that its shares sum exactly to the total by handing leftover cents out one at a time in participant order. A SettlementPlanner repeatedly matches the member owed the most with the member who owes the most and emits a Transfer for the smaller of the two amounts, which never needs more than one fewer transfer than there are members.",
    ],
    classDiagram: {
      types: [
        cls(
          "group",
          "Group",
          "class",
          [],
          [
            {
              name: "record",
              params: "e: Expense",
              returns: "void",
              visibility: "public",
            },
            {
              name: "settle",
              params: "t: Transfer",
              returns: "void",
              visibility: "public",
            },
          ]
        ),
        cls("member", "Member", "class", [
          { name: "name", type: "String", visibility: "private" },
        ]),
        cls(
          "expense",
          "Expense",
          "class",
          [
            { name: "total", type: "long", visibility: "private" },
            { name: "participants", type: "List<Member>", visibility: "private" },
          ],
          [
            {
              name: "shares",
              params: "",
              returns: "Map<Member, Long>",
              visibility: "public",
            },
          ]
        ),
        cls(
          "split",
          "SplitStrategy",
          "interface",
          [],
          [
            {
              name: "shares",
              params: "total: long, people: List<Member>",
              returns: "Map<Member, Long>",
              visibility: "public",
              isAbstract: true,
            },
          ]
        ),
        cls("equal", "EqualSplit"),
        cls("exact", "ExactSplit", "class", [
          { name: "amounts", type: "Map<Member, Long>", visibility: "private" },
        ]),
        cls("percent", "PercentSplit", "class", [
          { name: "basisPoints", type: "Map<Member, Integer>", visibility: "private" },
        ]),
        cls(
          "ledger",
          "Ledger",
          "class",
          [{ name: "balances", type: "Map<Member, Long>", visibility: "private" }],
          [
            {
              name: "apply",
              params: "e: Expense",
              returns: "void",
              visibility: "public",
            },
            {
              name: "balanceOf",
              params: "m: Member",
              returns: "long",
              visibility: "public",
            },
          ]
        ),
        cls(
          "planner",
          "SettlementPlanner",
          "class",
          [],
          [
            {
              name: "plan",
              params: "l: Ledger",
              returns: "List<Transfer>",
              visibility: "public",
            },
          ]
        ),
        cls("transfer", "Transfer", "class", [
          { name: "amount", type: "long", visibility: "private" },
        ]),
      ],
      relationships: [
        { id: "r1", from: "equal", to: "split", kind: "implementation" },
        { id: "r2", from: "exact", to: "split", kind: "implementation" },
        { id: "r3", from: "percent", to: "split", kind: "implementation" },
        { id: "r4", from: "group", to: "member", kind: "aggregation", label: "2..*" },
        { id: "r5", from: "group", to: "expense", kind: "composition", label: "0..*" },
        { id: "r6", from: "group", to: "ledger", kind: "composition" },
        { id: "r7", from: "expense", to: "split", kind: "association" },
        {
          id: "r8",
          from: "expense",
          to: "member",
          kind: "association",
          label: "paidBy",
        },
        { id: "r9", from: "ledger", to: "member", kind: "association" },
        { id: "r10", from: "planner", to: "ledger", kind: "dependency" },
        { id: "r11", from: "planner", to: "transfer", kind: "dependency" },
        { id: "r12", from: "group", to: "planner", kind: "dependency" },
      ],
    },
    code: {
      JAVA: `public interface SplitStrategy {
    /** Shares must sum to exactly total: no cent may be created or lost. */
    Map<Member, Long> shares(long total, List<Member> people);
}

public final class EqualSplit implements SplitStrategy {
    @Override
    public Map<Member, Long> shares(long total, List<Member> people) {
        long base = total / people.size();
        long leftover = total % people.size();          // 100 / 3 leaves 1 cent
        Map<Member, Long> out = new LinkedHashMap<>();
        for (int i = 0; i < people.size(); i++) {
            out.put(people.get(i), base + (i < leftover ? 1 : 0));
        }
        return out;
    }
}

public final class PercentSplit implements SplitStrategy {
    private final Map<Member, Integer> basisPoints;     // 2500 = 25%; must sum to 10000

    @Override
    public Map<Member, Long> shares(long total, List<Member> people) {
        Map<Member, Long> out = new LinkedHashMap<>();
        long assigned = 0;
        for (Member m : people) {
            long share = total * basisPoints.get(m) / 10_000;   // floor
            out.put(m, share);
            assigned += share;
        }
        // Hand out the cents lost to flooring, one each, in a fixed order.
        for (int i = 0; assigned < total; i++, assigned++) {
            out.merge(people.get(i % people.size()), 1L, Long::sum);
        }
        return out;
    }
}

/** One signed number per member; the whole group always sums to zero. */
public final class Ledger {
    private final Map<Member, Long> balances = new HashMap<>();

    public void apply(Expense expense) {
        balances.merge(expense.paidBy(), expense.total(), Long::sum);
        expense.shares().forEach((m, share) -> balances.merge(m, -share, Long::sum));
    }

    public void apply(Transfer t) {
        balances.merge(t.from(), t.amount(), Long::sum);
        balances.merge(t.to(), -t.amount(), Long::sum);
    }
}

/** Greedy: at most n - 1 transfers, though not always the fewest possible. */
public final class SettlementPlanner {
    public List<Transfer> plan(Ledger ledger) {
        PriorityQueue<Entry> owed  = ledger.creditors();   // largest first
        PriorityQueue<Entry> owing = ledger.debtors();     // largest debt first
        List<Transfer> out = new ArrayList<>();
        while (!owed.isEmpty() && !owing.isEmpty()) {
            Entry c = owed.poll(), d = owing.poll();
            long amount = Math.min(c.amount(), d.amount());
            out.add(new Transfer(d.member(), c.member(), amount));
            if (c.amount() > amount) owed.add(c.minus(amount));
            if (d.amount() > amount) owing.add(d.minus(amount));
        }
        return out;
    }
}`,
    },
    tradeoffs: [
      {
        decision: "How the different kinds of split are modelled",
        chose: "A SplitStrategy that an Expense holds",
        over: "Subclasses EqualExpense, ExactExpense and PercentExpense",
        because:
          "The way of splitting is the only thing that varies between expenses; payer, total and participants are the same everywhere. Subclassing Expense ties that one variation to the object's identity, so changing an expense from equal to exact would mean replacing the expense. A strategy keeps Expense a single class and makes a new split rule a new class with one method.",
      },
      {
        decision: "How amounts are represented",
        chose: "Whole cents in a long, with leftovers assigned explicitly",
        over: "double amounts rounded for display",
        because:
          "Binary floating point cannot represent most decimal fractions, so balances drift by fractions of a cent and stop summing to zero, and once that invariant breaks nobody can trust the settle-up list. Integer cents make the invariant checkable; the price is that every split must decide where the indivisible cent goes, which is exactly the decision a floating-point design hides.",
      },
      {
        decision: "What the ledger stores",
        chose: "One net balance per member",
        over: "A matrix of what each member owes each other member",
        because:
          "Net balances are all that is needed to show who is up or down and to plan settlement, and they grow with the number of members rather than its square. What they lose is 'Asha owes Ben specifically for the taxi', which can still be rebuilt from the expense history if it is ever needed.",
      },
      {
        decision: "How settlements are planned",
        chose: "A greedy match of largest creditor against largest debtor",
        over: "Searching for the minimum possible number of transfers",
        because:
          "Finding the true minimum is NP-hard in general, because it depends on splitting the group into subsets whose balances cancel out. The greedy approach runs in O(n log n), is easy to explain, and never needs more than n − 1 transfers. It sometimes uses one or two more than the optimum, which for a group of friends is a fair price.",
      },
    ],
  },

  {
    slug: "chess-game",
    title: "Chess Game",
    tagline:
      "Enforce the full rules of chess for two players, including the moves that break the usual patterns, with undo.",
    difficulty: "HARD",
    requirements: [
      "Let two players alternate moves on an 8×8 board, starting from the standard position",
      "Move each kind of piece according to its own rules, including captures",
      "Reject any move that would leave the mover's own king in check",
      "Detect check, checkmate and stalemate after every move",
      "Support castling, en passant and pawn promotion",
      "Keep a history of moves and allow the last move to be undone",
    ],
    constraints: [
      "Two local players; no computer opponent and no game clock",
      "Draws by repetition, the fifty-move rule and agreement are out of scope",
      "Correctness matters more than speed, but checking legality should not copy the whole board for every candidate move",
    ],
    objectives: [
      "Give each piece its own movement rule without a switch on piece type",
      "Separate 'where can this piece go' from 'is the move legal', which depends on the whole position",
      "Make moves first-class objects so history, undo and legality testing share one mechanism",
    ],
    principles: ["Open/Closed", "Single Responsibility", "Liskov Substitution"],
    designPatterns: ["Command", "Template Method"],
    extensions: [
      "Export and import games in Portable Game Notation (PGN)",
      "Detect a draw by threefold repetition of the same position",
      "Add a chess clock with a time increment per move",
    ],
    entities: [
      {
        name: "Game",
        responsibility:
          "Tracks whose turn it is, applies legal moves and keeps the history",
      },
      { name: "Board", responsibility: "Knows which piece stands on which square" },
      {
        name: "Piece",
        responsibility: "Generates the moves its type could make from a square",
      },
      {
        name: "SlidingPiece",
        responsibility: "Shares the ray-walking logic of the rook, bishop and queen",
      },
      {
        name: "Move",
        responsibility: "Applies a change to the board and can exactly reverse it",
      },
      {
        name: "CastlingMove",
        responsibility: "Moves the king and a rook together as one reversible step",
      },
    ],
    hints: [
      "Separate two questions that are easy to blur: where a piece could move if you looked only at the board around it, and whether that move is allowed. A piece can be physically free to move yet pinned to its king, and only the whole position knows that.",
      "Rook, bishop and queen all move the same way — walk in a direction until you hit the edge or a piece — and differ only in which directions. Look for a shape where that loop is written once. Separately, think about what undo needs: if a move can reverse itself, what else could use that?",
      "Consider an abstract Piece with a method that returns candidate moves for a square, an abstract SlidingPiece that implements it once using a directions() hook, and a Move interface with execute and undo. The game can then test legality by playing each candidate, asking whether its own king is attacked, and taking the move back.",
      "A workable shape: Piece as an abstract class with Knight, Pawn and King extending it directly and Rook, Bishop and Queen extending SlidingPiece; Move as an interface implemented by StandardMove, CastlingMove, EnPassantMove and PromotionMove, each remembering what it captured or changed so undo can restore it; Board aggregating up to 32 pieces; Game composing the Board and a stack of played Moves. Legal moves are the candidates that do not leave the mover in check; no legal moves means checkmate if in check and stalemate otherwise. Castling must additionally check that the king does not pass through an attacked square.",
    ],
    classDiagram: {
      types: [
        cls(
          "game",
          "Game",
          "class",
          [{ name: "toMove", type: "Color", visibility: "private" }],
          [
            { name: "play", params: "m: Move", returns: "void", visibility: "public" },
            { name: "undo", params: "", returns: "void", visibility: "public" },
            {
              name: "legalMoves",
              params: "",
              returns: "List<Move>",
              visibility: "public",
            },
            { name: "status", params: "", returns: "GameStatus", visibility: "public" },
          ]
        ),
        cls(
          "board",
          "Board",
          "class",
          [{ name: "squares", type: "Piece[8][8]", visibility: "private" }],
          [
            {
              name: "pieceAt",
              params: "s: Square",
              returns: "Optional<Piece>",
              visibility: "public",
            },
            {
              name: "isInCheck",
              params: "c: Color",
              returns: "boolean",
              visibility: "public",
            },
          ]
        ),
        cls(
          "piece",
          "Piece",
          "abstract",
          [
            { name: "color", type: "Color", visibility: "protected" },
            { name: "hasMoved", type: "boolean", visibility: "protected" },
          ],
          [
            {
              name: "candidateMoves",
              params: "b: Board, from: Square",
              returns: "List<Move>",
              visibility: "public",
              isAbstract: true,
            },
          ]
        ),
        cls(
          "sliding",
          "SlidingPiece",
          "abstract",
          [],
          [
            {
              name: "directions",
              params: "",
              returns: "List<Direction>",
              visibility: "protected",
              isAbstract: true,
            },
            {
              name: "candidateMoves",
              params: "b: Board, from: Square",
              returns: "List<Move>",
              visibility: "public",
            },
          ]
        ),
        cls("rook", "Rook"),
        cls("knight", "Knight"),
        cls("pawn", "Pawn"),
        cls(
          "move",
          "Move",
          "interface",
          [],
          [
            {
              name: "execute",
              params: "b: Board",
              returns: "void",
              visibility: "public",
              isAbstract: true,
            },
            {
              name: "undo",
              params: "b: Board",
              returns: "void",
              visibility: "public",
              isAbstract: true,
            },
          ]
        ),
        cls("standard", "StandardMove", "class", [
          { name: "captured", type: "Piece", visibility: "private" },
        ]),
        cls("castling", "CastlingMove"),
      ],
      relationships: [
        { id: "r1", from: "sliding", to: "piece", kind: "inheritance" },
        { id: "r2", from: "rook", to: "sliding", kind: "inheritance" },
        { id: "r3", from: "knight", to: "piece", kind: "inheritance" },
        { id: "r4", from: "pawn", to: "piece", kind: "inheritance" },
        { id: "r5", from: "standard", to: "move", kind: "implementation" },
        { id: "r6", from: "castling", to: "move", kind: "implementation" },
        { id: "r7", from: "game", to: "board", kind: "composition" },
        { id: "r8", from: "game", to: "move", kind: "aggregation", label: "history" },
        { id: "r9", from: "board", to: "piece", kind: "aggregation", label: "0..32" },
        { id: "r10", from: "piece", to: "move", kind: "dependency" },
        { id: "r11", from: "castling", to: "rook", kind: "association" },
      ],
    },
    code: {
      JAVA: `public interface Move {
    void execute(Board board);
    void undo(Board board);   // the exact inverse: history and legality both rely on it
}

public abstract class Piece {
    protected final Color color;
    protected boolean hasMoved;

    /** Where this piece could go, ignoring whether its own king is left in check. */
    public abstract List<Move> candidateMoves(Board board, Square from);
}

/** Template Method: rook, bishop and queen differ only in their directions. */
public abstract class SlidingPiece extends Piece {
    protected abstract List<Direction> directions();

    @Override
    public final List<Move> candidateMoves(Board board, Square from) {
        List<Move> moves = new ArrayList<>();
        for (Direction d : directions()) {
            for (Square s = from.step(d); board.contains(s); s = s.step(d)) {
                Optional<Piece> occupant = board.pieceAt(s);
                if (occupant.isEmpty()) { moves.add(new StandardMove(from, s)); continue; }
                if (occupant.get().color != color) moves.add(new StandardMove(from, s));
                break;                 // blocked by a piece either way
            }
        }
        return moves;
    }
}

public final class Rook extends SlidingPiece {
    @Override protected List<Direction> directions() { return Direction.ORTHOGONAL; }
}

public final class StandardMove implements Move {
    private final Square from, to;
    private Piece captured;            // remembered on execute, restored on undo
    private boolean moverHadMoved;

    @Override
    public void execute(Board board) {
        Piece mover = board.pieceAt(from).orElseThrow();
        captured = board.pieceAt(to).orElse(null);
        moverHadMoved = mover.hasMoved;
        board.relocate(from, to);
        mover.hasMoved = true;
    }

    @Override
    public void undo(Board board) {
        Piece mover = board.pieceAt(to).orElseThrow();
        board.relocate(to, from);
        board.place(to, captured);     // null restores an empty square
        mover.hasMoved = moverHadMoved;
    }
}

public final class Game {
    private final Board board;
    private final Deque<Move> history = new ArrayDeque<>();
    private Color toMove = Color.WHITE;

    public void play(Move move) {
        if (!legalMoves().contains(move)) throw new IllegalMoveException(move);
        move.execute(board);
        history.push(move);
        toMove = toMove.opponent();
    }

    public void undo() {
        history.pop().undo(board);
        toMove = toMove.opponent();
    }

    /** Make each candidate, see whether our king is attacked, unmake it. */
    public List<Move> legalMoves() {
        List<Move> legal = new ArrayList<>();
        for (Move m : board.candidateMoves(toMove)) {
            m.execute(board);
            if (!board.isInCheck(toMove)) legal.add(m);
            m.undo(board);
        }
        return legal;
    }

    public GameStatus status() {
        if (!legalMoves().isEmpty()) {
            return board.isInCheck(toMove) ? GameStatus.CHECK : GameStatus.IN_PROGRESS;
        }
        return board.isInCheck(toMove) ? GameStatus.CHECKMATE : GameStatus.STALEMATE;
    }
}`,
    },
    tradeoffs: [
      {
        decision: "How a move is checked for legality",
        chose:
          "Generate candidate moves per piece, then play each, test for check and undo it",
        over: "Having each piece compute only fully legal moves, accounting for pins and checks itself",
        because:
          "Legality is a property of the whole position, not of one piece, so asking a knight to know whether it is pinned spreads king-safety logic into six classes. Make-and-unmake keeps that rule in one place and gets pins, discovered checks and checks against the king for free. It is slower than specialised generation, which matters to a chess engine searching millions of positions and not at all to two people at a board.",
      },
      {
        decision: "How undo is supported",
        chose: "Moves as commands that know how to reverse themselves",
        over: "Saving a full copy of the board before every move",
        because:
          "Snapshots are simpler and almost impossible to get wrong, but legality testing would then copy the board for every candidate on every turn. Reversible commands are cheap and give history and undo in the same object. The risk moves into each Move's undo: castling, en passant and promotion each change more than two squares, and an undo that forgets one corrupts the game silently, so these deserve the most tests.",
      },
      {
        decision: "How the different pieces are modelled",
        chose: "A Piece class hierarchy with SlidingPiece sharing the ray-walking loop",
        over: "A PieceType enum and a switch inside one move generator",
        because:
          "The six pieces genuinely differ in behaviour, so a switch would collect all of chess's movement rules into one long method that every change has to edit. Subclasses keep each rule beside its piece, and the Template Method stops rook, bishop and queen from duplicating the same loop. The cost shows up in promotion, which has to replace the Pawn object with a new Queen rather than changing a field.",
      },
      {
        decision: "Where the special moves live",
        chose: "Their own Move classes, such as CastlingMove and EnPassantMove",
        over: "Flags such as isCastle and isEnPassant on a single move class",
        because:
          "Each special move changes the board differently — two pieces move, or the captured pawn is not on the destination square — and each must undo itself differently. Flags would turn execute and undo into chains of conditionals that every new rule extends. Separate classes keep each unusual case self-contained and testable on its own.",
      },
    ],
  },

  {
    slug: "hotel-reservations",
    title: "Hotel Reservations",
    tagline:
      "Find rooms free for a range of nights, book them without double-booking, and follow each stay from booking to checkout.",
    difficulty: "MEDIUM",
    requirements: [
      "Search for rooms of a given type that are free for every night in a date range",
      "Book a specific room for a guest, never overlapping another active booking for that room",
      "Cancel a booking, freeing its nights for others",
      "Check a guest in and out, allowing only the transitions that make sense",
      "Calculate the cost of a stay from a nightly rate that can differ on particular nights, such as weekends",
    ],
    constraints: [
      "One hotel and a single process",
      "A stay covers whole nights: arriving on the 3rd and leaving on the 5th is two nights",
      "Two clerks may try to book the same room at the same moment; exactly one must succeed",
    ],
    objectives: [
      "Represent a stay so that back-to-back bookings never appear to clash",
      "Make checking availability and claiming a room a single indivisible step",
      "Keep the rate rules separate from the booking logic",
      "Make the booking lifecycle explicit, so an impossible transition is rejected rather than ignored",
    ],
    principles: ["Single Responsibility", "Open/Closed", "Encapsulate what varies"],
    designPatterns: ["Strategy", "Facade"],
    extensions: [
      "Book by room type and assign the actual room at check-in",
      "Book several rooms for one party, all or nothing",
      "Add a cancellation rule that charges the first night when cancelling within 24 hours",
    ],
    entities: [
      {
        name: "ReservationService",
        responsibility:
          "The front desk's entry point for searching, booking and cancelling",
      },
      {
        name: "Room",
        responsibility: "Knows its number and type, and owns its calendar",
      },
      {
        name: "RoomCalendar",
        responsibility: "Holds one room's bookings and refuses overlapping ones",
      },
      {
        name: "Booking",
        responsibility: "Records a guest's stay in a room and its lifecycle status",
      },
      {
        name: "DateRange",
        responsibility: "A half-open span of nights that can test overlap with another",
      },
      {
        name: "RatePlan",
        responsibility: "Gives the rate for a room type on a particular night",
      },
      { name: "Guest", responsibility: "Identifies the person staying" },
    ],
    hints: [
      "Start with the dates. If a guest leaves on the 5th and another arrives on the 5th, those stays must not conflict. Choose a representation in which that is true without any special case.",
      "Two clerks checking 'is room 204 free?' and then both booking it is the classic check-then-act race. The check and the booking have to happen as one step, under the protection of whoever knows about that room's bookings.",
      "Consider a DateRange value object with an overlaps method, and a RoomCalendar per room whose tryReserve method checks for a clash and records the booking in the same synchronized call. Keep rates behind a RatePlan interface asked once per night of the stay.",
      "A workable shape: ReservationService aggregating Rooms and depending on a RatePlan; each Room composing a RoomCalendar that keeps Bookings in a sorted map keyed by arrival date; Booking associating a Guest, a Room, a DateRange and a BookingStatus enum (CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED), with methods that refuse illegal transitions. Because bookings in one room never overlap, a new range only needs to be compared with the booking that starts latest before it ends.",
    ],
    classDiagram: {
      types: [
        cls(
          "service",
          "ReservationService",
          "class",
          [],
          [
            {
              name: "search",
              params: "type: RoomType, stay: DateRange",
              returns: "List<Room>",
              visibility: "public",
            },
            {
              name: "book",
              params: "g: Guest, r: Room, stay: DateRange",
              returns: "Booking",
              visibility: "public",
            },
            {
              name: "cancel",
              params: "b: Booking",
              returns: "void",
              visibility: "public",
            },
          ]
        ),
        cls(
          "room",
          "Room",
          "class",
          [
            { name: "number", type: "String", visibility: "private" },
            { name: "type", type: "RoomType", visibility: "private" },
          ],
          []
        ),
        cls("roomtype", "RoomType", "enum"),
        cls(
          "calendar",
          "RoomCalendar",
          "class",
          [
            {
              name: "byArrival",
              type: "NavigableMap<LocalDate, Booking>",
              visibility: "private",
            },
          ],
          [
            {
              name: "isFree",
              params: "stay: DateRange",
              returns: "boolean",
              visibility: "public",
            },
            {
              name: "tryReserve",
              params: "b: Booking",
              returns: "boolean",
              visibility: "public",
            },
          ]
        ),
        cls(
          "booking",
          "Booking",
          "class",
          [{ name: "status", type: "BookingStatus", visibility: "private" }],
          [
            { name: "checkIn", params: "", returns: "void", visibility: "public" },
            { name: "checkOut", params: "", returns: "void", visibility: "public" },
            { name: "cancel", params: "", returns: "void", visibility: "public" },
          ]
        ),
        cls("status", "BookingStatus", "enum"),
        cls(
          "range",
          "DateRange",
          "class",
          [
            { name: "start", type: "LocalDate", visibility: "private" },
            { name: "end", type: "LocalDate", visibility: "private" },
          ],
          [
            {
              name: "overlaps",
              params: "other: DateRange",
              returns: "boolean",
              visibility: "public",
            },
          ]
        ),
        cls("guest", "Guest", "class", [
          { name: "name", type: "String", visibility: "private" },
        ]),
        cls(
          "rateplan",
          "RatePlan",
          "interface",
          [],
          [
            {
              name: "rateFor",
              params: "type: RoomType, night: LocalDate",
              returns: "Money",
              visibility: "public",
              isAbstract: true,
            },
          ]
        ),
        cls("weekend", "WeekendRatePlan"),
      ],
      relationships: [
        { id: "r1", from: "weekend", to: "rateplan", kind: "implementation" },
        { id: "r2", from: "service", to: "room", kind: "aggregation", label: "1..*" },
        { id: "r3", from: "service", to: "rateplan", kind: "dependency" },
        { id: "r4", from: "room", to: "roomtype", kind: "association" },
        { id: "r5", from: "room", to: "calendar", kind: "composition" },
        {
          id: "r6",
          from: "calendar",
          to: "booking",
          kind: "aggregation",
          label: "0..*",
        },
        { id: "r7", from: "booking", to: "guest", kind: "association" },
        { id: "r8", from: "booking", to: "room", kind: "association" },
        { id: "r9", from: "booking", to: "range", kind: "composition", label: "stay" },
        { id: "r10", from: "booking", to: "status", kind: "association" },
      ],
    },
    code: {
      JAVA: `/** Half-open [start, end): leaving on the 5th and arriving on the 5th never clash. */
public record DateRange(LocalDate start, LocalDate end) {
    public DateRange {
        if (!start.isBefore(end)) throw new IllegalArgumentException("A stay needs at least one night");
    }

    public boolean overlaps(DateRange other) {
        return start.isBefore(other.end) && other.start.isBefore(end);
    }

    public Stream<LocalDate> nights() { return start.datesUntil(end); }
}

public final class RoomCalendar {
    private final NavigableMap<LocalDate, Booking> byArrival = new TreeMap<>();

    /**
     * Check and claim in one synchronized step, so two clerks cannot both
     * see the room as free. Bookings here never overlap, so only the one
     * arriving latest before this stay ends can possibly clash.
     */
    public synchronized boolean tryReserve(Booking booking) {
        DateRange stay = booking.stay();
        Map.Entry<LocalDate, Booking> previous = byArrival.lowerEntry(stay.end());
        if (previous != null && previous.getValue().stay().overlaps(stay)) return false;
        byArrival.put(stay.start(), booking);
        return true;
    }

    public synchronized void release(Booking booking) {
        byArrival.remove(booking.stay().start(), booking);
    }
}

public final class Booking {
    private BookingStatus status = BookingStatus.CONFIRMED;

    public void checkIn()  { status = transition(BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN); }
    public void checkOut() { status = transition(BookingStatus.CHECKED_IN, BookingStatus.CHECKED_OUT); }
    public void cancel()   { status = transition(BookingStatus.CONFIRMED, BookingStatus.CANCELLED); }

    private BookingStatus transition(BookingStatus required, BookingStatus next) {
        if (status != required) throw new IllegalStateException(status + " cannot become " + next);
        return next;
    }
}

public interface RatePlan {
    Money rateFor(RoomType type, LocalDate night);
}

public final class ReservationService {
    private final List<Room> rooms;
    private final RatePlan rates;

    public Booking book(Guest guest, Room room, DateRange stay) {
        Booking booking = new Booking(guest, room, stay);
        if (!room.calendar().tryReserve(booking)) {
            throw new RoomUnavailableException(room, stay);
        }
        return booking;
    }

    public void cancel(Booking booking) {
        booking.cancel();                                   // throws if already checked in
        booking.room().calendar().release(booking);
    }

    public Money costOf(Booking booking) {
        return booking.stay().nights()
            .map(night -> rates.rateFor(booking.room().type(), night))
            .reduce(Money.ZERO, Money::plus);
    }
}`,
    },
    tradeoffs: [
      {
        decision: "How a stay's dates are represented",
        chose: "A half-open DateRange: arrival included, departure excluded",
        over: "Inclusive first and last nights, or inclusive arrival and departure dates",
        because:
          "With half-open ranges, two stays overlap exactly when each starts before the other ends — one comparison with no plus-or-minus-one. Back-to-back stays fall out correctly and the number of nights is simply the days between the two dates. Inclusive dates make every overlap test and every night count carry a special case that will eventually be forgotten somewhere.",
      },
      {
        decision: "Where double-booking is prevented",
        chose: "A synchronized tryReserve on each room's calendar",
        over: "One lock around the whole ReservationService, or a separate isFree check followed by a book call",
        because:
          "A separate check followed by a booking is a race: both clerks can pass the check before either books. A lock per room makes check-and-claim atomic while still letting different rooms be booked in parallel, which a single service-wide lock would serialise. The price arrives with the multi-room extension, where holding several room locks at once needs a fixed locking order to avoid deadlock.",
      },
      {
        decision: "What a booking reserves",
        chose: "A specific room, chosen when booking",
        over: "A room type, with a count of free rooms per type per night and the room assigned at check-in",
        because:
          "Booking a specific room makes availability a simple per-room question and keeps this exercise focused on overlap and concurrency. Real hotels often book by type because it uses rooms more efficiently: with fixed rooms, a type can have a free room every night of a stay yet no single room free for all of them. That fragmentation is the cost of the simpler model, and the first extension asks you to remove it.",
      },
      {
        decision: "How the booking lifecycle is enforced",
        chose: "A status enum with guarded transition methods on Booking",
        over: "The State pattern with a class per status",
        because:
          "A booking's behaviour barely changes between statuses; what changes is which transition is allowed next. A guarded transition method states each rule in one line and rejects impossible moves loudly. State classes pay off when each mode behaves very differently, as in the vending machine, and here they would mostly hold a single guard each.",
      },
    ],
  },
];
