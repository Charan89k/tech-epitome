import { clientEnv } from "@/lib/env";

/**
 * Single source of truth for brand strings and public URLs.
 *
 * The product name appears in metadata, emails, the AI system prompts and a
 * dozen components. Renaming should be a one-line change here, which is why
 * nothing else hard-codes "Tech Epitome".
 */
export const site = {
  name: "Tech Epitome",
  shortName: "Tech Epitome",
  tagline: "Master Technology. Build with Confidence.",
  description:
    "An interactive platform for learning DSA, system design, coding patterns, and software engineering interviews.",
  url: clientEnv.NEXT_PUBLIC_APP_URL,
  locale: "en_US",
  /** Used in AI system prompts so the tutor refers to the product correctly. */
  tutorPersona: "the Tech Epitome tutor",
} as const;

export type SiteConfig = typeof site;
