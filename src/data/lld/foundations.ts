import {
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
 * Sections 1 and 2: what low-level design is, and the object-oriented
 * vocabulary the rest of the track is written in.
 *
 * Ordered so nothing uses a word it has not defined. Responsibility comes
 * before cohesion, cohesion before SOLID, and inheritance is introduced
 * alongside its alternative rather than before it — teaching inheritance
 * first and composition later is how a generation learned to reach for
 * the wrong one.
 *
 * All prose original.
 */

export const LLD_FOUNDATIONS: SectionSeed = {
  slug: "foundations",
  title: "Foundations",
  summary:
    "What low-level design actually decides, and the two ideas — responsibility and coupling — that every later section is about.",
  chapters: [
    {
      slug: "what-low-level-design-is",
      title: "What Low-Level Design Is",
      summary:
        "The decisions that live between 'which services exist' and 'which line of code runs'.",
      difficulty: "EASY",
      readingMinutes: 8,
      objectives: [
        "Say what question low-level design answers that architecture does not",
        "Recognise that most LLD decisions are about where change will land",
        "Resist designing for requirements nobody has stated",
      ],
      keyTakeaways: [
        "LLD assigns responsibilities to types and decides how they reach each other.",
        "A design is good relative to the changes it will actually face.",
        "Every abstraction is a bet. Unplaced bets cost nothing.",
      ],
      content: [
        h2("The layer in between"),
        p(
          "System design decides which services exist and how they communicate. Programming decides which statements run. Low-level design is the layer between them: given one service, what types live inside it, what is each one responsible for, and how do they reach one another."
        ),
        concept(
          "The question LLD answers",
          "When this requirement changes — and you should be able to name which one will — how many classes have to be opened, and does the compiler tell you about all of them?"
        ),
        p(
          "That framing is more useful than \"is this design clean\", because cleanliness is a matter of taste and the number of files you have to edit is not. Two designs can both look tidy; only one of them makes tomorrow's change a single new class."
        ),
        h2("Design is about anticipated change"),
        p(
          "There is no design that is best in the abstract. A parking garage with one fixed price needs no pricing abstraction, and adding one is not foresight — it is a guess dressed as architecture. The same abstraction becomes obviously right the moment a second pricing rule is on the roadmap."
        ),
        table(
          ["If this is likely to change", "Put a seam here"],
          [
            ["How something is priced, scored, or ranked", "Behind an interface the caller holds"],
            ["Which external system is called", "Behind an interface your code defines"],
            ["What kinds of a thing exist", "Behind a common supertype"],
            ["What happens after an event", "Behind a listener or handler list"],
            ["Nothing you can name", "Nowhere — write the straightforward code"],
          ],
          "Seams are bets on change. Place the ones you can justify."
        ),
        warn(
          "The most common failure in this subject is not under-designing. It is adding a factory, an interface and a strategy to a class with one implementation that has never changed, and calling the result extensible. Every seam is a layer somebody has to read through to find where the work happens.",
          "The expensive mistake"
        ),
        h2("What you are actually deciding"),
        ul(
          "Which things exist as types at all, and which are just fields on something else.",
          "What each type is the only thing that knows.",
          "Which types know about which others, and in which direction.",
          "Which of those relationships go through an abstraction and which are direct.",
          "What is fixed at construction and what can change at runtime.",
        ),
        insight(
          "Notice that none of those are about syntax, and none of them are about which patterns you can name. A design conversation that opens with 'we should use a Factory' has started at the answer. The questions above come first; patterns are names for recurring answers to them.",
          "Patterns come last, not first"
        ),
        note(
          "Diagrams in this track are data rather than pictures, the same as in System Design. Open 'Describe this diagram in words' beneath any of them to read the structure as prose — which is also exactly what the AI reviewer sees when it looks at a design you have drawn."
        ),
      ],
    },
    {
      slug: "responsibilities-and-entities",
      title: "Finding the Entities and Their Responsibilities",
      summary:
        "How to get from a paragraph of requirements to a set of types that each do one thing.",
      difficulty: "EASY",
      readingMinutes: 10,
      objectives: [
        "Extract candidate types from a written brief without inventing plumbing",
        "State a responsibility in one sentence, and notice when you cannot",
        "Decide whether something deserves to be a type or is merely a field",
      ],
      keyTakeaways: [
        "Nouns in the brief are candidates, not conclusions.",
        "If a responsibility needs the word 'and', you probably have two types.",
        "A type earns its existence by having behaviour, not just data.",
      ],
      content: [
        h2("Start from the brief, not from a pattern"),
        p(
          "Take the requirements and underline every noun. That gives you candidates — not a design. Most will survive as types, some will turn out to be fields on other types, and a few will be concepts the brief mentions but the system never needs to represent."
        ),
        p(
          "Then, for each survivor, write one sentence: \"X is the only thing that knows ___.\" The sentence is the test. If you cannot finish it, the type has no reason to exist yet. If you need \"and\" to finish it, you have found two types wearing one name."
        ),
        concept(
          "The one-sentence test",
          "A ParkingSpace is the only thing that knows whether it is occupied and what size vehicle it takes. A Garage is the only thing that knows which spaces exist. Neither sentence needs the other, which is why they are two types."
        ),
        h2("Data without behaviour is suspicious"),
        rp(
          "A type with five fields, five getters, five setters and no other methods is not really a type — it is a ",
          { strong: "record with ceremony" },
          ". That is fine when it genuinely is a record, like a Ticket that exists to be read. It is a problem when the behaviour that belongs to that data has drifted somewhere else, because now two places have to change together."
        ),
        p(
          "The tell is a method on class A that reads three fields from class B and computes something about B. That method usually belongs on B. Moving it is the single highest-value refactor in most first drafts."
        ),
        table(
          ["Smell", "What it usually means"],
          [
            ["A class with only getters and setters", "Its behaviour lives elsewhere"],
            ["A method that mostly reads another object's fields", "Wrong home for the method"],
            ["A class named ...Manager or ...Helper", "A responsibility nobody has named"],
            ["A class nothing else references", "It may not need to exist"],
            ["Two classes that always change together", "They may be one class"],
          ],
          "First-draft tells, and what to look at."
        ),
        warn(
          "A class called Manager, Helper, Processor or Util is almost always a bag of behaviour that belongs on the things it operates on. The name is a placeholder for a responsibility nobody could state in a sentence — which is precisely the test from earlier, failed.",
          "On -Manager and -Helper"
        ),
        h2("Which relationships actually exist"),
        p(
          "Once you have types, the next question is who knows about whom. Three distinctions matter more than the rest, and a lot of confusion disappears when you can name them."
        ),
        table(
          ["Relationship", "Means", "If the owner is destroyed"],
          [
            ["Composition", "The part belongs to the whole", "The part goes too"],
            ["Aggregation", "The whole holds the part, but does not own it", "The part survives"],
            ["Association", "One references the other", "Both survive"],
            ["Dependency", "One merely uses the other transiently", "Nothing is held"],
          ],
          "Ownership is the axis that separates them."
        ),
        p(
          "A Garage composes its ParkingSpaces: the spaces exist because the garage does. A Playlist aggregates Songs: delete the playlist and the songs remain. A Ticket is associated with a Vehicle: neither owns the other. A Garage depends on a FeePolicy: it calls it and holds nothing permanent."
        ),
        insight(
          "Getting these labels exactly right in UML matters far less than the thinking they force. Asking 'if I delete this, what should disappear?' will change your field types and your constructors, and that is the part that ends up in the code.",
          "Why the distinction earns its keep"
        ),
      ],
    },
    {
      slug: "coupling-and-cohesion",
      title: "Coupling and Cohesion",
      summary:
        "The two measurements every later principle is a special case of.",
      difficulty: "MEDIUM",
      readingMinutes: 9,
      objectives: [
        "Define coupling and cohesion precisely enough to argue about a design",
        "Spot the four kinds of coupling that cause real pain",
        "Explain why lowering coupling can raise it somewhere else",
      ],
      keyTakeaways: [
        "Cohesion: how much a type's contents belong together. High is good.",
        "Coupling: how much one type must know about another. Low is good.",
        "You cannot have zero coupling — you choose where it sits and what it is to.",
      ],
      content: [
        h2("Two measurements"),
        concept(
          "Cohesion",
          "How strongly the things inside one type relate to each other. A type whose fields and methods all serve one job is cohesive. A type holding a database connection, a date formatter and a discount rule is not."
        ),
        concept(
          "Coupling",
          "How much one type must know about another to work. If changing B's internals forces a change in A, A is tightly coupled to B."
        ),
        p(
          "Nearly every principle later in this track is one of these two wearing a specific hat. Single Responsibility is cohesion. Dependency Inversion is coupling. Interface Segregation is both."
        ),
        h2("The kinds of coupling that hurt"),
        table(
          ["Kind", "Looks like", "Why it bites"],
          [
            ["Concrete", "A holds a `new StripeGateway()`", "B cannot be swapped or faked in a test"],
            ["Structural", "A reads `b.getC().getD().value`", "A breaks when C or D changes shape"],
            ["Temporal", "`init()` must be called before `use()`", "Nothing in the type system says so"],
            ["Shared mutable state", "Both write the same object", "Order of operations becomes load-bearing"],
          ],
          "Four flavours, roughly in order of how often they cause trouble."
        ),
        rp(
          "Structural coupling has a well-known rule of thumb: ",
          { strong: "talk only to your immediate neighbours" },
          ". A chain like ",
          { code: "order.getCustomer().getAddress().getPostcode()" },
          " means the caller knows the shape of three types it has no business knowing. Asking the order for what you actually want — its delivery postcode — leaves one relationship instead of three."
        ),
        h2("Coupling cannot be removed, only moved"),
        p(
          "Suppose PaymentProcessor constructs a StripeGateway directly. That is concrete coupling, and the usual fix is to define a PaymentGateway interface and have the processor depend on it instead."
        ),
        p(
          "Notice what happened. The processor is now coupled to an interface you own rather than to a vendor's class — but something, somewhere, still has to decide that the real gateway is Stripe. The coupling moved to the composition root, where it is one line that is easy to find and easy to change. It did not disappear."
        ),
        insight(
          "This is the honest version of 'decoupling'. The question is never whether A depends on something, but whether it depends on something stable that you control, and whether the volatile choice has been pushed to a place where changing it is cheap.",
          "What decoupling actually buys"
        ),
        h2("A quick self-check"),
        ul(
          "Could I test this class without starting a database, a server or a clock? If not, what is it coupled to?",
          "If I renamed a private field on that other class, would this one still compile?",
          "Does this class have fields that are only used by half its methods? That is low cohesion.",
          "Could I describe this class's job without listing its methods?",
        ),
        warn(
          "Low coupling taken to an extreme produces a system where every call goes through three interfaces and no single file tells you what happens. That is not a well-designed system; it is a well-hidden one. The goal is that the volatile parts are isolated, not that everything is.",
          "The other extreme"
        ),
      ],
    },
  ],
};

export const LLD_OOP: SectionSeed = {
  slug: "oop-foundations",
  title: "Object-Oriented Foundations",
  summary:
    "Encapsulation, abstraction, polymorphism and composition — as tools with costs, not as a vocabulary test.",
  chapters: [
    {
      slug: "encapsulation-and-abstraction",
      title: "Encapsulation and Abstraction",
      summary:
        "Hiding state is the easy half. Hiding decisions is the half that matters.",
      difficulty: "EASY",
      readingMinutes: 8,
      objectives: [
        "Distinguish encapsulating data from encapsulating a decision",
        "Recognise that a getter can break encapsulation as thoroughly as a public field",
        "Design an interface around what a caller needs, not what an implementation has",
      ],
      keyTakeaways: [
        "Private fields plus public getters for all of them is a public field with extra steps.",
        "Encapsulate the rule, not just the variable.",
        "An abstraction should be describable without naming its implementation.",
      ],
      content: [
        h2("The version everyone is taught"),
        p(
          "Make fields private, expose getters and setters. This is real and worth doing, but on its own it achieves very little: a class with a private field and a public getter and setter for it has exactly the same coupling surface as a public field, plus more code."
        ),
        h2("The version that matters"),
        rp(
          "The useful form of encapsulation hides a ",
          { strong: "decision" },
          ", not a variable. Consider an order that knows its items and a caller that wants the total."
        ),
        table(
          ["Design", "The caller must know"],
          [
            ["`order.getItems()` and sum them", "How totals are computed, that discounts exist, tax rules"],
            ["`order.total()`", "Nothing"],
          ],
          "Both designs 'encapsulate' the items field. Only one encapsulates the decision."
        ),
        p(
          "In the first design, every caller that wants a total re-implements the rule, and they drift. When a discount is introduced, you find them by grepping and hoping. In the second, the rule has one home."
        ),
        insight(
          "A getter that returns a mutable internal collection is worse than a public field, because it looks safe. `getItems().clear()` reaches straight through the wall. If you must expose a collection, expose an unmodifiable view or a copy.",
          "The leaky getter"
        ),
        h2("Abstraction is about the caller"),
        p(
          "An abstraction is good when it can be described entirely in the caller's vocabulary. \"A PaymentGateway charges an amount to a customer and tells you whether it worked\" describes a seam. \"A StripeClientWrapper exposes the Stripe charge endpoint\" describes an implementation with an interface drawn around it — and it will leak Stripe's concepts into everything that touches it."
        ),
        warn(
          "The tell is an interface whose method names, parameters or error types mirror one vendor's SDK. You have not created a seam; you have created a second name for the same coupling, and the second provider will not fit through it.",
          "Interfaces that are not abstractions"
        ),
      ],
    },
    {
      slug: "inheritance-and-composition",
      title: "Inheritance and Composition",
      summary:
        "Two ways to reuse behaviour, taught together because choosing wrongly is the most common design mistake there is.",
      difficulty: "MEDIUM",
      readingMinutes: 11,
      objectives: [
        "State the one question that decides between inheritance and composition",
        "Recognise the combinatorial explosion inheritance causes",
        "Use polymorphism without requiring an inheritance hierarchy",
      ],
      keyTakeaways: [
        "Inheritance says 'is a'. Composition says 'has a' or 'uses a'.",
        "If two dimensions of variation exist, inheritance multiplies and composition adds.",
        "Inheritance is the tightest coupling available — a subclass depends on its parent's internals.",
      ],
      content: [
        h2("The question"),
        concept(
          "Choosing between them",
          "Is the subtype a permanent, total specialisation of the supertype — true for the object's whole life, in every context? If yes, inheritance may fit. If it is one aspect of behaviour that could vary independently, compose."
        ),
        p(
          "A Car is permanently a Vehicle; that is not a role it plays sometimes. But a Car's pricing rule, logging destination and fuel strategy are all things that could vary independently, and none of them should be in its type."
        ),
        h2("Why inheritance multiplies"),
        p(
          "Suppose notifications vary by channel — email, SMS, push — and by urgency — normal, batched, immediate. With inheritance you need a class per combination: EmailNormal, EmailBatched, EmailImmediate, SmsNormal, and so on. Three channels and three urgencies is nine classes, and a fourth channel makes twelve."
        ),
        p(
          "With composition, a Notifier holds a Channel and a DeliveryStrategy. Three plus three is six classes, a fourth channel makes seven, and any combination is a constructor call rather than a new class."
        ),
        table(
          ["", "Inheritance", "Composition"],
          [
            ["Two dimensions, n and m", "n × m classes", "n + m classes"],
            ["Changing behaviour at runtime", "Impossible — type is fixed", "Swap the collaborator"],
            ["Coupling to the reused code", "Total, including protected internals", "Only the interface"],
            ["Testing one piece alone", "Must construct the whole hierarchy", "Construct the one class"],
          ],
          "The asymmetry is not close."
        ),
        h2("Inheritance is the tightest coupling there is"),
        p(
          "A subclass can see its parent's protected state and depends on the order in which the parent calls its own methods. Change a parent's internal call order — a refactor that looks entirely private — and a subclass that overrode one of those methods can break, silently, without either file looking wrong."
        ),
        warn(
          "This is why extending a class you do not control, across a library boundary, is risky in a way that implementing its interface is not. An interface promises a contract. A base class exposes an implementation and then asks you not to depend on it.",
          "Inheriting across a boundary"
        ),
        h2("Polymorphism without a hierarchy"),
        p(
          "Polymorphism — calling the same method and getting different behaviour — is the genuinely valuable part, and it does not require inheritance. An interface gives you exactly that with none of the coupling, which is why most modern designs have wide, shallow interface hierarchies rather than deep class trees."
        ),
        insight(
          "A useful default: use interfaces for polymorphism, composition for reuse, and inheritance only when a subtype is a true and permanent specialisation and you own both sides. That covers nearly every case, and the exceptions are worth arguing about individually.",
          "A default worth holding"
        ),
        note(
          "The Event Logger exercise in this track is built specifically to show this: a logger that must write to console and file at once is impossible to express by subclassing and trivial to express by composing."
        ),
      ],
    },
  ],
};
