import "server-only";

import { hash, verify } from "@node-rs/argon2";

import { ARGON2_OPTIONS } from "./argon2";

// Shared with the seed and the provisioning CLI; see ./argon2.ts.
const OPTIONS = ARGON2_OPTIONS;

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, OPTIONS);
}

/**
 * Verifies a password. Returns false rather than throwing on a malformed or
 * absent hash, so a corrupt row cannot turn into a 500 on the login path.
 */
export async function verifyPassword(
  storedHash: string | null | undefined,
  plain: string
): Promise<boolean> {
  if (!storedHash) return false;
  try {
    return await verify(storedHash, plain, OPTIONS);
  } catch {
    return false;
  }
}
