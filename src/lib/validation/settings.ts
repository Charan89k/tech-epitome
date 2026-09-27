import { z } from "zod";

import { Language } from "@/generated/prisma/enums";

export const profileSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter your name.")
    .max(80, "That name is too long."),
  targetRole: z
    .string()
    .trim()
    .max(80, "Keep this under 80 characters.")
    .optional()
    .or(z.literal("")),
  preferredLanguage: z.nativeEnum(Language),
  reducedMotion: z.boolean(),
  emailDigest: z.boolean(),
});

export type ProfileSettingsInput = z.infer<typeof profileSettingsSchema>;
