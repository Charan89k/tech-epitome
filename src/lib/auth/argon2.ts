/**
 * Argon2id parameters. OWASP's 2024 baseline: 19 MiB memory, 2 iterations,
 * 1 degree of parallelism. Tuned for a server that must also serve requests,
 * not for a dedicated hashing box.
 *
 * Kept free of `server-only` so the seed and the account-provisioning CLI,
 * which run under plain Node, hash with exactly the application's settings.
 */
export const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;
