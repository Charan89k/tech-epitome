import {
  code,
  concept,
  h2,
  h3,
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
 * SOLID, design principles, and the patterns worth knowing by name.
 *
 * Every pattern chapter follows the same five beats — the problem, the
 * shape, when it is worth it, when it is not, and the cost — because a
 * pattern presented without its cost is how codebases end up with a
 * factory returning one implementation.
 *
 * All examples original.
 */

export const LLD_SOLID: SectionSeed = {
  slug: "solid",
  title: "SOLID",
  summary:
    "Five principles, each with the specific pain it removes and the specific over-application that makes it harmful.",
  chapters: [
    {
      slug: "single-responsibility-and-open-closed",
      title: "Single Responsibility and Open/Closed",
      summary:
        "The two that do the most work, and the two most often quoted without their qualifier.",
      difficulty: "MEDIUM",
      readingMinutes: 11,
      objectives: [
        "State SRP in terms of reasons to change rather than counting methods",
        "Identify the axis of change a class should be closed against",
        "Recognise when applying either principle is premature",
      ],
      keyTakeaways: [
        "SRP is about who asks for changes, not how many methods a class has.",
        "Open/Closed is always relative to a named axis of change.",
        "Neither principle says 'add an interface everywhere'.",
      ],
      content: [
        h2("Single Responsibility"),
        concept(
          "The precise form",
          "A class should have one reason to change — meaning one source of change requests. Not one method, not one job loosely defined: one constituency whose decisions force this file open."
        ),
        p(
          "Consider a class that formats an invoice as HTML and also computes its tax. Two different people change those: a designer and an accountant. Their changes arrive on different schedules for unrelated reasons, and every time one of them touches the file, the other's work is in the diff. That is the cost SRP names."
        ),
        h3("A concrete violation"),
        code(
          "java",
          `// Three constituencies in one class.
final class Invoice {
    Money total() { ... }              // accounting changes this
    String toHtml() { ... }            // design changes this
    void save(Connection c) { ... }    // infrastructure changes this
}`,
          "Every release touches this file, for unrelated reasons."
        ),
        code(
          "java",
          `final class Invoice {          // the accounting rules
    Money total() { ... }
}

final class InvoiceHtmlView {  // the presentation
    String render(Invoice invoice) { ... }
}

interface InvoiceStore {       // the persistence seam
    void save(Invoice invoice);
}`,
          "Three files, three reasons to change, three independent diffs."
        ),
        warn(
          "SRP is routinely misread as 'a class should do one small thing', which produces fifty classes with one method each and a design nobody can follow. The test is reasons to change, not size. A cohesive class with eight methods that all serve one constituency is correct.",
          "The common misreading"
        ),
        h2("Open/Closed"),
        concept(
          "The precise form",
          "Open for extension, closed for modification — along a specific, named axis. New behaviour of that kind should arrive as new code, not as an edit to existing code."
        ),
        rp(
          "The qualifier is everything. ",
          { strong: "Closed against what?" },
          " A class cannot be closed against all change; asking it to be is how you get an abstraction for every field. Name the axis: new payment methods, new export formats, new vehicle types. Then close against that one and leave the rest open to ordinary editing."
        ),
        h3("The shape"),
        code(
          "java",
          `// Open against new export formats: adding CSV is a new class.
interface Exporter {
    String export(Report report);
}

final class ReportService {
    private final Map<Format, Exporter> exporters;

    String export(Report report, Format format) {
        return exporters.get(format).export(report);
    }
}`,
          "A new format never opens ReportService."
        ),
        p(
          "Compare that with a switch inside ReportService. The switch is not wrong — for two formats that have not changed in three years it is clearer. It becomes wrong when the same switch appears in four places and adding a format means finding all of them."
        ),
        insight(
          "A practical trigger: the second time you write a conditional on the same enum in a different method, that enum is an axis of change and it wants polymorphism. The first time, leave it alone.",
          "When to actually apply it"
        ),
      ],
    },
    {
      slug: "liskov-interface-segregation-dependency-inversion",
      title: "Liskov, Interface Segregation and Dependency Inversion",
      summary:
        "The three that describe how types relate: what a subtype owes, how wide an interface should be, and which way dependencies should point.",
      difficulty: "HARD",
      readingMinutes: 13,
      objectives: [
        "Detect an LSP violation from a subtype that strengthens a precondition",
        "Split an interface along how it is used rather than what implements it",
        "Explain why DIP is about ownership of the abstraction, not just about interfaces",
      ],
      keyTakeaways: [
        "A subtype must be usable anywhere its supertype is, without the caller checking which it has.",
        "An interface is too wide when an implementer is forced to throw.",
        "DIP: the abstraction belongs to the caller's module, not the implementation's.",
      ],
      content: [
        h2("Liskov Substitution"),
        concept(
          "The precise form",
          "Anywhere the supertype is expected, a subtype must work without the caller knowing the difference. A subtype may accept more and promise more; it may never accept less or promise less."
        ),
        h3("The classic violation, and why it is classic"),
        p(
          "A Rectangle with setWidth and setHeight, and a Square that inherits from it. Setting the width of a square must also set its height, or it is not a square. Now any code that sets both and expects width × height breaks — silently, only for squares."
        ),
        p(
          "The lesson is not about geometry. It is that \"is a\" in English is not \"is substitutable for\" in code. A square is a rectangle mathematically; a mutable Square is not substitutable for a mutable Rectangle. Mutability is what breaks it — immutable versions substitute perfectly."
        ),
        table(
          ["A subtype may not", "Because the caller"],
          [
            ["Throw where the supertype did not", "Has no reason to catch it"],
            ["Require more of its inputs", "Passes what the supertype allowed"],
            ["Return less than promised", "Relies on the contract"],
            ["Do nothing where an effect was promised", "Depends on the effect"],
          ],
          "Four ways to break substitutability without breaking compilation."
        ),
        warn(
          "The strongest practical signal of an LSP violation is a caller doing `if (x instanceof Special)` before using x. If callers must know which subtype they have, the abstraction is not delivering substitutability and is therefore not earning its complexity.",
          "The instanceof tell"
        ),
        h2("Interface Segregation"),
        concept(
          "The precise form",
          "No client should be forced to depend on methods it does not use. Split interfaces by how they are consumed, not by what happens to implement them."
        ),
        p(
          "A wide Repository interface with save, delete, findById, findAll, search and count forces a read-only cache implementation to provide save and delete, and the honest implementation of those is to throw. A method that exists only to throw is a contract that lies."
        ),
        code(
          "java",
          `// Split along how callers use it, not along storage technology.
interface ReadOnly<T> { Optional<T> findById(Id id); }
interface Writable<T> { void save(T entity); }
interface Searchable<T> { List<T> search(Query query); }

// A cache implements what it can honour, and nothing else.
final class InMemoryCache<T> implements ReadOnly<T> { ... }`,
          "Nothing is forced to throw."
        ),
        insight(
          "Interface Segregation is what makes the Composite pattern possible. A one-method LogSink can be implemented by something that forwards to a list of other sinks; a six-method LogSink cannot, without five meaningless implementations.",
          "Why narrow interfaces compose"
        ),
        h2("Dependency Inversion"),
        concept(
          "The precise form",
          "High-level policy should not depend on low-level detail; both should depend on an abstraction. And critically: that abstraction should be defined by and owned by the high-level module."
        ),
        rp(
          "The second sentence is the one usually dropped, and it is the one that does the work. If your ",
          { code: "OrderService" },
          " depends on an interface that lives in the Stripe adapter package and is shaped like Stripe's API, the dependency arrow still points at Stripe. Nothing was inverted — an interface was added."
        ),
        code(
          "java",
          `// in the ordering module — it owns this interface and its vocabulary
package ordering;
public interface PaymentGateway {
    PaymentResult charge(Money amount, CustomerId customer);
}

// in the infrastructure module — it depends on ordering, not the reverse
package infrastructure;
final class StripeGateway implements ordering.PaymentGateway { ... }`,
          "The arrow points inward: infrastructure depends on policy."
        ),
        p(
          "The payoff is that the ordering module compiles and is testable with no knowledge that Stripe exists, and swapping providers touches one package. The cost is a small amount of indirection and one wiring point at the composition root — which is where the concrete choice now lives, visibly, in one line."
        ),
        note(
          "The class-diagram diagnostics in this track's workspace will point out when a type depends on a concrete class that implements an interface, since that is this principle's most common near-miss: the abstraction exists, but somebody wired around it."
        ),
      ],
    },
  ],
};

export const LLD_PRINCIPLES: SectionSeed = {
  slug: "design-principles",
  title: "Design Principles",
  summary:
    "The heuristics that come up in review more often than the named patterns do.",
  chapters: [
    {
      slug: "principles-that-earn-their-keep",
      title: "Principles That Earn Their Keep",
      summary:
        "Composition over inheritance, programming to interfaces, encapsulating variation, and knowing when not to.",
      difficulty: "MEDIUM",
      readingMinutes: 10,
      objectives: [
        "Apply 'encapsulate what varies' as a concrete search procedure",
        "Use dependency injection without a framework",
        "Say when immutability is worth the copying",
      ],
      keyTakeaways: [
        "Find what varies, and put a seam exactly there — not everywhere.",
        "Dependency injection is just passing collaborators in. The framework is optional.",
        "Immutability removes a whole class of bug at the cost of allocation.",
      ],
      content: [
        h2("Encapsulate what varies"),
        p(
          "This is the most actionable principle in the set, because it is a procedure rather than an aspiration. Walk the requirements, and for each one ask: has this changed before, or is it on the roadmap? Those are your variation points. Everything else is stable, and stable things do not need seams."
        ),
        ul(
          "Pricing, scoring, ranking, matching — almost always varies.",
          "Which external provider is called — varies, eventually.",
          "The set of subtypes of a domain concept — usually grows.",
          "The order of two lines in a constructor — does not vary. Leave it alone.",
        ),
        h2("Program to interfaces"),
        rp(
          "Depend on the narrowest type that does the job. A parameter typed ",
          { code: "List<Order>" },
          " when the method only iterates should be ",
          { code: "Iterable<Order>" },
          ": it accepts more callers and promises less, which is the right direction on both counts."
        ),
        warn(
          "This does not mean every class needs an interface. An interface with exactly one implementation, created 'for testability', is usually a sign the class is hard to construct — fix that instead. Interfaces are for variation that exists or is genuinely imminent.",
          "The one-implementation interface"
        ),
        h2("Dependency injection, without ceremony"),
        p(
          "Dependency injection means a class is given its collaborators rather than constructing them. That is the whole idea; a container is an optional convenience for wiring, not the principle."
        ),
        code(
          "java",
          `// Not injected: impossible to test without a real clock and gateway.
final class Booking {
    private final Clock clock = Clock.systemUTC();
    private final PaymentGateway gateway = new StripeGateway();
}

// Injected: every collaborator is visible in the signature, and
// substitutable in a test.
final class Booking {
    private final Clock clock;
    private final PaymentGateway gateway;

    Booking(Clock clock, PaymentGateway gateway) {
        this.clock = clock;
        this.gateway = gateway;
    }
}`,
          "The second version's constructor is also its documentation."
        ),
        insight(
          "A constructor with seven parameters is not an argument against injection — it is the design telling you the class has seven collaborators and therefore probably several responsibilities. Hiding them in a container does not reduce the count, it only hides the evidence.",
          "When the constructor gets long"
        ),
        h2("Immutability where it pays"),
        p(
          "An immutable object cannot be in an invalid state after construction, cannot be changed by a method you passed it to, and is safe to share between threads. Those three properties remove entire categories of bug."
        ),
        p(
          "The cost is allocation on every change, which matters for large objects mutated in a tight loop and essentially never elsewhere. Value-like things — money, dates, identifiers, coordinates, events — should be immutable by default. Long-lived entities with genuine identity and lifecycle are the reasonable exception."
        ),
      ],
    },
  ],
};

export const LLD_PATTERNS: SectionSeed = {
  slug: "patterns",
  title: "Patterns Worth Knowing",
  summary:
    "Creational, structural and behavioural patterns — each with the problem it solves and the situation where it is overkill.",
  chapters: [
    {
      slug: "creational-patterns",
      title: "Creational Patterns",
      summary:
        "Factory Method, Abstract Factory, Builder and Singleton — mostly about not scattering `new` through your code.",
      difficulty: "MEDIUM",
      readingMinutes: 11,
      objectives: [
        "Choose between a factory and a builder from the shape of the problem",
        "Explain why Singleton is treated with suspicion",
        "Recognise when plain construction is the right answer",
      ],
      keyTakeaways: [
        "Factories centralise the decision of which type to create.",
        "Builders solve too many constructor parameters, not subtype selection.",
        "Singleton is global mutable state with a respectable name.",
      ],
      content: [
        h2("Factory Method"),
        p(
          "**Problem.** Deciding which concrete type to construct is scattered across the codebase, so adding a type means finding every `new`."
        ),
        p(
          "**Shape.** One place — a method or a small class — takes the inputs and returns the right implementation behind a shared interface. Callers ask for what they need and never name the concrete type."
        ),
        p(
          "**When it earns its keep.** Three or more implementations, chosen at runtime from data. **When it does not.** One implementation. A factory that returns the only class that exists is indirection with no payoff, and it will still be there in three years."
        ),
        h3("Abstract Factory"),
        p(
          "The same idea for a *family* of related types that must be consistent with each other — a set of widgets that must all be the same theme, or a set of storage adapters that must all target the same backend. The extra machinery only pays off when mixing families is a real bug you are preventing."
        ),
        h2("Builder"),
        p(
          "**Problem.** A constructor with many parameters, several optional, most of the same type. `new Pizza(true, false, true, false)` is unreadable and easy to get wrong in a way the compiler cannot catch."
        ),
        code(
          "java",
          `Report report = Report.builder()
    .title("Q3 revenue")
    .groupBy(Region)
    .includeSubtotals()
    .build();`,
          "Each option names itself, and build() validates the combination."
        ),
        p(
          "**When it earns its keep.** Four or more parameters, or several optional ones, or combinations that need validating together. **When it does not.** Two or three required parameters — a plain constructor is shorter and clearer."
        ),
        insight(
          "Builder and Factory solve different problems and are often confused. A factory chooses *which type* to make. A builder configures *one type* whose construction is complicated. If you are choosing between subtypes, a builder is the wrong tool.",
          "Not the same problem"
        ),
        h2("Singleton"),
        p(
          "**Problem.** Exactly one instance must exist, and everything needs access to it."
        ),
        warn(
          "Singleton is the one pattern in this chapter to reach for last. It is global mutable state: it hides a dependency from the constructor, makes tests order-dependent because state survives between them, and turns 'who can change this?' into a question with no local answer. Most uses are better served by constructing one instance at the composition root and injecting it — which gives you 'exactly one' without the global.",
          "Why this one is different"
        ),
        p(
          "The legitimate uses are narrow: genuinely stateless helpers, and objects representing a hardware or process-level resource that cannot meaningfully be duplicated. Even then, injecting the single instance costs nothing and keeps the dependency visible."
        ),
      ],
    },
    {
      slug: "structural-patterns",
      title: "Structural Patterns",
      summary:
        "Adapter, Decorator, Facade, Composite and Proxy — four ways to put something in front of something else, and one way to treat a group as one.",
      difficulty: "MEDIUM",
      readingMinutes: 11,
      objectives: [
        "Distinguish Adapter, Decorator and Proxy, which look identical in a diagram",
        "Use Composite to make a group substitutable for an individual",
        "Avoid a Facade that becomes a second god object",
      ],
      keyTakeaways: [
        "Adapter changes an interface. Decorator adds behaviour. Proxy controls access.",
        "All three wrap. The difference is intent, and intent is what you document.",
        "Composite only works if the shared interface is narrow.",
      ],
      content: [
        h2("Three wrappers, told apart by intent"),
        table(
          ["Pattern", "Interface of the wrapper", "Adds", "Reason to exist"],
          [
            ["Adapter", "Different from the wrapped", "Nothing", "Two incompatible interfaces must meet"],
            ["Decorator", "Same as the wrapped", "Behaviour", "Optional behaviour, stackable"],
            ["Proxy", "Same as the wrapped", "Control", "Lazy loading, access checks, caching"],
          ],
          "Structurally similar; the difference is what you are trying to achieve."
        ),
        p(
          "Adapter is the one with a different interface on each side — it exists precisely because the two do not fit. Decorator and Proxy both keep the interface identical, so they can be inserted invisibly; they differ in whether they are adding capability or governing access."
        ),
        h3("Decorator, where it shines"),
        code(
          "java",
          `LogSink sink = new TimestampSink(
                       new LevelFilterSink(WARN,
                       new FileSink(path)));`,
          "Each wrapper adds one behaviour, and the order is explicit."
        ),
        p(
          "The property that makes this work is that every wrapper implements the same one-method interface, so they stack in any combination. Try this with a six-method interface and each decorator must forward five methods it does not care about — which is Interface Segregation showing up as a practical constraint."
        ),
        h2("Composite"),
        p(
          "**Problem.** A caller wants to treat one thing and a group of things identically."
        ),
        p(
          "**Shape.** The group implements the same interface as the individual and forwards to its children. A CompositeSink that holds three sinks *is* a sink; nothing above it knows or cares."
        ),
        p(
          "**When it does not fit.** When the interface has methods a group cannot sensibly answer. A group has no single `getName()`, and inventing one is the design telling you Composite is wrong here."
        ),
        h2("Facade"),
        p(
          "**Problem.** A subsystem has many parts and a caller needs one common workflow through them."
        ),
        p(
          "**Shape.** One class exposing the workflow, delegating inward. **The risk.** A facade that accumulates a method per caller becomes exactly the god object it was meant to hide — with the additional problem that it is now the only documented way in. Keep it to the genuinely common paths and let unusual callers reach the parts directly."
        ),
      ],
    },
    {
      slug: "behavioural-patterns",
      title: "Behavioural Patterns",
      summary:
        "Strategy, Observer, Command, State and Template Method — the patterns about what happens, and when.",
      difficulty: "MEDIUM",
      readingMinutes: 12,
      objectives: [
        "Tell Strategy and State apart by who decides the transition",
        "Use Command to make an action storable, queueable and undoable",
        "Prefer Strategy to Template Method, and say why",
      ],
      keyTakeaways: [
        "Strategy: the caller picks. State: the object transitions itself.",
        "Command turns an action into an object, which is what makes undo and queueing possible.",
        "Template Method is inheritance-based Strategy, with inheritance's costs.",
      ],
      content: [
        h2("Strategy and State"),
        p(
          "These have nearly identical diagrams — an interface, several implementations, a context holding one — and are told apart by a single question: who decides which implementation is in use?"
        ),
        table(
          ["", "Strategy", "State"],
          [
            ["Chosen by", "The caller, usually at construction", "The object itself, as events arrive"],
            ["Changes during a lifetime", "Rarely", "Constantly — that is the point"],
            ["Implementations know each other", "No", "Yes — each returns the next"],
            ["Example", "A pricing rule", "A vending machine's mode"],
          ],
          "Same shape, opposite responsibility for the transition."
        ),
        p(
          "The Parking Garage exercise uses Strategy for its fee policy. The Vending Machine exercise uses State for its modes. Building both is the clearest way to feel the difference."
        ),
        h2("Command"),
        p(
          "**Problem.** An action needs to be more than a method call — it needs to be stored, queued, logged, retried or undone."
        ),
        p(
          "**Shape.** Wrap the action and its parameters in an object with an `execute()` method, and optionally an `undo()`. Once an action is an object it can go in a list, and a list of actions is a history."
        ),
        code(
          "java",
          `interface Command {
    void execute();
    void undo();
}

// Undo is now a stack, not a special case in every handler.
final class CommandHistory {
    private final Deque<Command> done = new ArrayDeque<>();

    void run(Command command) { command.execute(); done.push(command); }
    void undoLast()           { if (!done.isEmpty()) done.pop().undo(); }
}`,
          "Undo becomes a data structure problem rather than a design problem."
        ),
        h2("Observer"),
        p(
          "**Problem.** Several things must react when something happens, and the thing it happens to should not know who they are."
        ),
        p(
          "**Shape.** The subject holds a list of listeners and notifies them. Adding a reaction does not open the subject."
        ),
        warn(
          "Observer's costs are real and often unmentioned: the order listeners run in is usually unspecified, a listener that throws can stop the others, control flow becomes hard to follow in a debugger, and a listener that is never removed is a memory leak. Use it when the decoupling genuinely matters, not merely because a direct call felt inelegant.",
          "What Observer costs"
        ),
        h2("Template Method"),
        p(
          "**Shape.** A base class defines the skeleton of an algorithm and leaves named steps abstract for subclasses to fill in."
        ),
        p(
          "It works, and it is worth recognising in code you did not write. But it is Strategy implemented with inheritance, and it inherits inheritance's problems: one algorithm shape per subclass, no runtime change, and subclasses coupled to the base class's internal call order. Composing strategies gets the same result with less coupling, and that is the default worth reaching for."
        ),
        note(
          "A closing caution for this whole section: patterns are a vocabulary for describing designs you have arrived at, not a menu to choose from at the start. The right sequence is requirements, responsibilities, relationships — and only then, if a shape you recognise appears, the name for it."
        ),
      ],
    },
  ],
};
