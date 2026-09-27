import { z } from "zod";

/**
 * Shared auth validation. Used by the credentials provider, the signup
 * server action and the client-side form, so the rules can never drift
 * between what the UI checks and what the server enforces.
 */

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Enter a valid email address.")
  .max(254, "That email is too long.");

/**
 * Length over composition rules. NIST 800-63B advises against forced
 * character-class requirements; they push users toward predictable
 * substitutions without adding real entropy.
 */
export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(200, "That password is too long.");

export const credentialsSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
});

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter your name.")
    .max(80, "That name is too long."),
  email: emailSchema,
  password: passwordSchema,
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type CredentialsInput = z.infer<typeof credentialsSchema>;
