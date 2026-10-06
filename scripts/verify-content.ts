/**
 * Verifies course content and design exercises before they are published.
 *
 *   npm run content:verify
 *
 * Refuses to pass unless, for every course (DSA, System Design, LLD):
 *   - section slugs are unique within the course, chapter slugs unique
 *     within the whole course (URLs and highlights key on them);
 *   - every chapter has a summary, 2+ objectives, 2+ key takeaways, a
 *     sensible reading time, and content that passes the same schema the
 *     renderer trusts (`assertContent`), opens with a heading, and carries
 *     every architecture diagram through `assertDiagram`;
 *   - every referenced quiz, pattern, problem and visualization exists;
 * and for every exercise:
 *   - system design: unique slug, requirements, API, data model, at least
 *     two trade-offs and scaling notes, and an architecture that passes
 *     `assertDiagram`;
 *   - LLD: unique slug, requirements, four escalating hints, entities, a
 *     class diagram that passes `assertClassDiagram` with no error-level
 *     diagnostics, Java reference code, and at least two trade-offs.
 *
 * Run with `--conditions=react-server` (the npm script does).
 */
import { DSA_COURSE } from "../src/data/curriculum";
import type { CourseSeed } from "../src/data/curriculum/types";
import { LLD_COURSE } from "../src/data/lld";
import { LLD_EXERCISES } from "../src/data/lld/exercises";
import { PATTERNS } from "../src/data/patterns";
import { PROBLEMS } from "../src/data/problems";
import { QUIZZES } from "../src/data/quizzes";
import { SYSTEM_DESIGN_COURSE } from "../src/data/system-design";
import { SYSTEM_DESIGN_EXERCISES } from "../src/data/system-design/exercises";
import { VISUALIZATION_KEYS } from "../src/components/visualization/registry";
import { classDiagramDiagnostics } from "../src/lib/class-diagram/layout";
import { assertClassDiagram } from "../src/lib/class-diagram/schema";
import { assertDiagram } from "../src/lib/diagram/schema";
import { assertContent } from "../src/lib/validation/content";

const errors: string[] = [];
const fail = (where: string, message: string) => errors.push(`${where}: ${message}`);

const patterns = new Set(PATTERNS.map((p) => p.slug));
const problems = new Set(PROBLEMS.map((p) => p.slug));
const quizzes = new Set(QUIZZES.map((q) => q.slug));
const visualizations = new Set(VISUALIZATION_KEYS);

function attempt(where: string, check: () => void) {
  try {
    check();
  } catch (error) {
    fail(where, error instanceof Error ? error.message.slice(0, 400) : String(error));
  }
}

let chapterCount = 0;
for (const course of [DSA_COURSE, SYSTEM_DESIGN_COURSE, LLD_COURSE] as CourseSeed[]) {
  const sectionSlugs = new Set<string>();
  const chapterSlugs = new Set<string>();
  for (const section of course.sections) {
    const at = `${course.slug}/${section.slug}`;
    if (sectionSlugs.has(section.slug)) fail(at, "duplicate section slug");
    sectionSlugs.add(section.slug);
    if (!section.summary?.trim()) fail(at, "section needs a summary");
    if (section.chapters.length === 0) fail(at, "section has no chapters");

    for (const chapter of section.chapters) {
      chapterCount++;
      const where = `${at}/${chapter.slug}`;
      if (chapterSlugs.has(chapter.slug))
        fail(where, "duplicate chapter slug in course");
      chapterSlugs.add(chapter.slug);
      if (!chapter.summary?.trim()) fail(where, "needs a summary");
      if (chapter.objectives.length < 2) fail(where, "needs 2+ objectives");
      if (chapter.keyTakeaways.length < 2) fail(where, "needs 2+ key takeaways");
      if (chapter.readingMinutes < 3 || chapter.readingMinutes > 40) {
        fail(where, `readingMinutes ${chapter.readingMinutes} out of range 3-40`);
      }
      attempt(where, () => assertContent(chapter.content));
      if (chapter.content[0]?.type !== "heading")
        fail(where, "content should open with a heading");
      if (chapter.content.length < 6)
        fail(where, `content is thin (${chapter.content.length} blocks)`);

      for (const [index, block] of chapter.content.entries()) {
        if (block.type === "architecture") {
          attempt(`${where} block ${index}`, () => assertDiagram(block.diagram));
        }
        if (block.type === "quiz" && !quizzes.has(block.quizSlug)) {
          fail(where, `unknown quiz ${block.quizSlug}`);
        }
        if (block.type === "problems") {
          for (const slug of block.slugs)
            if (!problems.has(slug)) fail(where, `unknown problem ${slug}`);
        }
        if (
          block.type === "visualization" &&
          !visualizations.has(block.visualizationKey)
        ) {
          fail(where, `unknown visualization ${block.visualizationKey}`);
        }
      }
      for (const slug of chapter.patterns ?? [])
        if (!patterns.has(slug)) fail(where, `unknown pattern ${slug}`);
      for (const slug of chapter.problems ?? [])
        if (!problems.has(slug)) fail(where, `unknown problem ${slug}`);
      if (chapter.quiz && !quizzes.has(chapter.quiz))
        fail(where, `unknown quiz ${chapter.quiz}`);
    }
  }
}

const sdSlugs = new Set<string>();
for (const e of SYSTEM_DESIGN_EXERCISES) {
  const where = `system-design exercise ${e.slug}`;
  if (sdSlugs.has(e.slug)) fail(where, "duplicate slug");
  sdSlugs.add(e.slug);
  if (e.functionalRequirements.length < 3)
    fail(where, "needs 3+ functional requirements");
  if (e.nonFunctionalRequirements.length < 2)
    fail(where, "needs 2+ non-functional requirements");
  if (Object.keys(e.scaleEstimate).length < 2) fail(where, "needs a scale estimate");
  if (e.apiDesign.length < 1) fail(where, "needs an API design");
  if (e.dataModel.length < 1) fail(where, "needs a data model");
  if (e.bottlenecks.length < 2) fail(where, "needs 2+ bottlenecks");
  if (e.tradeoffs.length < 2) fail(where, "needs 2+ trade-offs");
  if (e.scalingNotes.length < 2) fail(where, "needs 2+ scaling notes");
  attempt(where, () => assertDiagram(e.architecture));
}

const lldSlugs = new Set<string>();
for (const e of LLD_EXERCISES) {
  const where = `lld exercise ${e.slug}`;
  if (lldSlugs.has(e.slug)) fail(where, "duplicate slug");
  lldSlugs.add(e.slug);
  if (e.requirements.length < 3) fail(where, "needs 3+ requirements");
  if (e.hints.length !== 4)
    fail(
      where,
      `needs exactly 4 hints (conceptual → near-solution), has ${e.hints.length}`
    );
  if (e.entities.length < 3) fail(where, "needs 3+ entities");
  if (e.tradeoffs.length < 2) fail(where, "needs 2+ trade-offs");
  if (!e.code.JAVA?.trim()) fail(where, "needs JAVA reference code");
  attempt(where, () => {
    const diagram = assertClassDiagram(e.classDiagram);
    const bad = classDiagramDiagnostics(diagram).filter((d) => d.level === "error");
    if (bad.length) throw new Error(bad.map((d) => d.message).join("; "));
  });
}

if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n  ${errors.join("\n  ")}`);
  process.exit(1);
}
console.log(
  `OK — ${chapterCount} chapters, ${SYSTEM_DESIGN_EXERCISES.length} system-design and ${LLD_EXERCISES.length} LLD exercises verified.`
);
