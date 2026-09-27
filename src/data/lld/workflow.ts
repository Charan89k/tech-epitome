import {
  concept,
  h2,
  insight,
  note,
  ol,
  p,
  rp,
  table,
  ul,
  warn,
  type SectionSeed,
} from "@/data/curriculum/types";

/**
 * The procedure, and the considerations that only show up once a design
 * has to survive contact with a real system.
 *
 * Placed last because it is the section that assumes everything else.
 * All prose original.
 */
export const LLD_WORKFLOW: SectionSeed = {
  slug: "design-workflow",
  title: "Design Workflow",
  summary:
    "A repeatable procedure for getting from a brief to a defensible design, and what to consider once it has to run for real.",
  chapters: [
    {
      slug: "from-brief-to-design",
      title: "From Brief to Design",
      summary:
        "Seven steps, in order, with the mistake each one prevents.",
      difficulty: "MEDIUM",
      readingMinutes: 10,
      objectives: [
        "Work a brief in a fixed order rather than starting from a pattern",
        "Identify variation points before choosing any abstraction",
        "Defend a design by naming what it optimises for",
      ],
      keyTakeaways: [
        "Requirements, entities, responsibilities, relationships, variation, patterns — in that order.",
        "Patterns are step six, never step one.",
        "A design you cannot justify in one sentence per decision is not finished.",
      ],
      content: [
        h2("The order matters"),
        p(
          "Under time pressure — an interview, a sprint — the temptation is to jump to a shape you recognise. That produces designs that are locally clever and globally wrong, because the shape was chosen before the problem was understood. A fixed order prevents it."
        ),
        ol(
          "Clarify the requirements. Ask what is in scope and, more usefully, what is out. Write down the assumptions you are allowed to make.",
          "Extract candidate entities. Underline the nouns. Do not filter yet.",
          "Assign responsibilities. For each candidate, finish 'X is the only thing that knows ___.' Drop the ones that fail.",
          "Draw relationships. For each pair that must interact, decide: owns, holds, references, or merely uses.",
          "Find the variation points. Which requirement will change first? That is where a seam goes.",
          "Name the patterns, if any apply. Only now, and only if a shape you already have matches one.",
          "State the trade-offs. For each significant decision: what you chose, over what, and why.",
        ),
        insight(
          "Step seven is the one people skip and the one that most distinguishes a strong design discussion. \"I used a Strategy\" describes what you did. \"I put pricing behind an interface because it is the requirement most likely to change, at the cost of one extra indirection\" describes why — and invites the disagreement that improves the design.",
          "The step that separates people"
        ),
        h2("Clarifying, concretely"),
        table(
          ["Ask", "Because the answer changes"],
          [
            ["Who uses this, and how many of them?", "Whether concurrency is in scope at all"],
            ["What must never be wrong?", "Where invariants and validation live"],
            ["What will change first?", "Where the seams go"],
            ["What is explicitly out of scope?", "How much you are allowed to not build"],
            ["Is there existing code this must fit?", "Whether you are free to choose the shape"],
          ],
          "Five questions that reliably change the answer."
        ),
        warn(
          "Assuming scope rather than asking is the most expensive habit in design work. Building reservations into a parking garage that never asked for them is not thoroughness — it is a larger design that is harder to review and solves a problem nobody has.",
          "Assumed scope"
        ),
        h2("Justifying a design"),
        rp(
          "A finished design has, for each significant decision, a sentence of the form: ",
          { em: "I chose A over B because C" },
          ". If you cannot produce that sentence, either the decision was arbitrary — in which case take the simpler option — or you have not yet understood why you made it."
        ),
        p(
          "This is also the honest standard for reviewing someone else's design, including the AI reviewer in this track. \"This is wrong\" is not useful. \"This couples the processor to a specific provider, so a second provider means editing the processor — was that deliberate?\" is."
        ),
      ],
    },
    {
      slug: "designing-for-reality",
      title: "Designing for Reality",
      summary:
        "Testability, concurrency, error handling and boundaries — the considerations that only appear once the design has to run.",
      difficulty: "HARD",
      readingMinutes: 12,
      objectives: [
        "Recognise the design choices that make a class hard to test",
        "Decide where thread safety belongs rather than sprinkling locks",
        "Keep persistence and transport concerns out of domain types",
      ],
      keyTakeaways: [
        "Hard to test is a design signal, not a testing problem.",
        "Immutability removes most thread-safety questions before they are asked.",
        "A domain type that knows about your database is coupled to it forever.",
      ],
      content: [
        h2("Testability is a design property"),
        p(
          "When a class is hard to test, the usual cause is not the test framework. It is that the class constructs its own collaborators, reads the clock directly, or reaches global state — so there is no way to place it in a known situation."
        ),
        table(
          ["Hard to test because", "The design fix"],
          [
            ["It calls `Instant.now()`", "Inject a Clock"],
            ["It constructs its own gateway", "Inject the interface"],
            ["It reads a static singleton", "Pass the dependency in"],
            ["It does five things", "It is five classes"],
            ["Its result is only a side effect", "Return something meaningful"],
          ],
          "Each row is a coupling problem wearing a testing costume."
        ),
        insight(
          "This is why 'I will add tests later' so often fails. Tests are not something applied to a finished design; the ability to write them is a property the design either has or lacks, and retrofitting it means changing the design.",
          "Why tests cannot be bolted on"
        ),
        h2("Concurrency, decided in one place"),
        p(
          "The instinct when concurrency appears is to add locks where the errors happen. That produces a system where every method is synchronised, throughput collapses, and deadlock becomes possible in places nobody can enumerate."
        ),
        ul(
          "Make value types immutable. An object that cannot change needs no lock and can be shared freely.",
          "Confine mutable state to one owner, and make everything else go through it.",
          "Where shared mutation is genuinely required, put it behind one type whose entire job is to be thread-safe, and document that.",
          "Prefer a concurrent collection to a lock you wrote yourself.",
        ),
        concept(
          "The design question",
          "Not 'where do I need a lock', but 'which single type owns this mutable state'. Once one type owns it, thread safety is that type's problem and nowhere else's."
        ),
        h2("Error handling as part of the contract"),
        p(
          "How a method fails is part of its interface, not an implementation detail. A method that returns null on failure, throws on a different failure, and logs-and-continues on a third has three contracts and callers will get at least one wrong."
        ),
        p(
          "Decide, per operation: is failure expected and part of normal flow, or exceptional? Expected failures — a space not being available, a code already taken — are better as return values the caller must handle. Genuinely exceptional ones — a corrupt configuration — are better as exceptions. Mixing the two arbitrarily is what makes error handling unreadable."
        ),
        h2("Boundaries"),
        rp(
          "The last thing worth protecting is the edge of your domain. A domain type carrying ",
          { code: "@Column" },
          " annotations, or shaped by what a JSON API happens to return, is coupled to that technology for as long as it exists. The database schema will change for database reasons and the API will change for API reasons, and both will reach into your domain logic."
        ),
        p(
          "The alternative is a translation step at each boundary: a persistence type, a transport type, and a domain type that knows about neither. The cost is mapping code, which is real and tedious. The benefit is that your rules survive a schema migration. For a small system the coupling is affordable; for one expected to live for years, the mapping usually pays for itself."
        ),
        note(
          "There is no universally right answer here, which is exactly why it belongs in the trade-offs step. What matters is that you can say which one you chose and what you expected it to buy."
        ),
      ],
    },
  ],
};
