import "server-only";

import { hash, verify } from "@node-rs/argon2";

/**
 * Argon2id parameters. OWASP's 2024 baseline: 19 MiB memory, 2 iterations,
 * 1 degree of parallelism. Tuned for a server that must also serve requests,
 * not for a dedicated hashing box.
 */
const OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

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
