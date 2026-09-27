import { clientEnv } from "@/lib/env";

/**
 * Single source of truth for brand strings and public URLs.
 *
 * The product name appears in metadata, emails, the AI system prompts and a
 * dozen components. Renaming should be a one-line change here, which is why
 * nothing else hard-codes "CodeForge".
 */
export const site = {
  name: "CodeForge",
  shortName: "CodeForge",
  tagline: "Master Algorithms. Build Better Systems.",
  description:
    "An interactive platform for learning DSA, system design, coding patterns, and software engineering interviews.",
  url: clientEnv.NEXT_PUBLIC_APP_URL,
  locale: "en_US",
  /** Used in AI system prompts so the tutor refers to the product correctly. */
  tutorPersona: "the CodeForge tutor",
} as const;

export type SiteConfig = typeof site;
