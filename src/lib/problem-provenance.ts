import { z } from "zod";

/**
 * What an imported problem must declare. Statements, editorials and tests from
 * these sites are proprietary, so a file naming one is refused however it is
 * labelled. This catches honest mistakes; it does not replace reading a licence.
 */
const REFUSED_SOURCES =
  /leetcode|codechef|allcsnotes|hackerrank|geeksforgeeks|codeforces/i;

export const provenanceSchema = z
  .object({
    sourceType: z.literal("LICENSED"),
    sourceName: z.string().trim().min(2).max(120),
    sourceUrl: z.string().url().max(500),
    license: z.string().trim().min(2).max(120),
    attribution: z.string().trim().min(5).max(2000),
  })
  .refine((p) => !REFUSED_SOURCES.test(`${p.sourceName} ${p.sourceUrl}`), {
    message: "That source's content is proprietary and cannot be imported.",
  });

export type Provenance = z.infer<typeof provenanceSchema>;
