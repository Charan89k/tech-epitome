/**
 * Environment configuration, validated once at module load.
 *
 * Two exports, deliberately separate:
 *   - `env`       server-only. Importing it from a client component is a
 *                 build error, which is the point: secrets cannot leak by
 *                 accident.
 *   - `clientEnv` the small, explicitly public subset.
 *
 * Next.js inlines `process.env.NEXT_PUBLIC_*` at build time only for literal
 * member accesses, so those are written out longhand below rather than looked
 * up dynamically.
 */
import { z } from "zod";

const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required. See .env.example.")
    .refine(
      (v) => v.startsWith("postgres://") || v.startsWith("postgresql://"),
      "DATABASE_URL must be a PostgreSQL connection string."
    ),

  AUTH_SECRET: z
    .string()
    .min(
      32,
      "AUTH_SECRET must be at least 32 characters. Generate one with `npx auth secret`."
    ),

  AUTH_GOOGLE_ID: z.preprocess(emptyToUndefined, z.string().optional()),
  AUTH_GOOGLE_SECRET: z.preprocess(emptyToUndefined, z.string().optional()),

  AI_PROVIDER: z.enum(["ollama", "anthropic"]).default("ollama"),
  AI_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  AI_MODEL: z.string().default("claude-sonnet-5"),
  OLLAMA_BASE_URL: z.string().url().default("http://127.0.0.1:11434"),
  OLLAMA_MODEL: z.string().default("qwen2.5:14b"),

  CODE_EXECUTION_DRIVER: z.enum(["local", "docker", "remote"]).default("docker"),
  CODE_EXECUTION_API_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  CODE_EXECUTION_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),

  STRIPE_SECRET_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  STRIPE_WEBHOOK_SECRET: z.preprocess(emptyToUndefined, z.string().optional()),
  STRIPE_PRO_MONTHLY_PRICE_ID: z.preprocess(emptyToUndefined, z.string().optional()),
  STRIPE_PRO_YEARLY_PRICE_ID: z.preprocess(emptyToUndefined, z.string().optional()),

  SEED_ADMIN_EMAIL: z.string().email().default("admin@codeforge.local"),
  SEED_ADMIN_PASSWORD: z.string().min(8).default("forge-admin-dev"),
  SEED_DEMO_EMAIL: z.string().email().default("demo@codeforge.local"),
  SEED_DEMO_PASSWORD: z.string().min(8).default("forge-demo-dev"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

function format(error: z.ZodError): string {
  return error.issues
    .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
}

/** Public values. Safe in any runtime. */
export const clientEnv = (() => {
  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
  if (!parsed.success) {
    throw new Error(`Invalid public environment:\n${format(parsed.error)}`);
  }
  return parsed.data;
})();

type ServerEnv = z.infer<typeof serverSchema> & z.infer<typeof clientSchema>;

let cached: ServerEnv | null = null;

/**
 * Server-side configuration. Throws on first access if anything required is
 * missing, so a misconfigured deploy fails at boot rather than mid-request.
 *
 * Skipped during `next build` when the build is only collecting page data and
 * no real secrets are present, which is what SKIP_ENV_VALIDATION is for.
 */
export function getEnv(): ServerEnv {
  if (cached) return cached;

  if (process.env.SKIP_ENV_VALIDATION === "true") {
    cached = {
      ...(process.env as unknown as z.infer<typeof serverSchema>),
      ...clientEnv,
    };
    return cached;
  }

  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid server environment:\n${format(parsed.error)}\n\n` +
        `Copy .env.example to .env and fill in the missing values.`
    );
  }

  const data = { ...parsed.data, ...clientEnv };

  // Cross-field rules that a per-field schema cannot express.
  if (data.AI_PROVIDER === "anthropic" && !data.AI_API_KEY) {
    throw new Error(
      "AI_PROVIDER is 'anthropic' but AI_API_KEY is empty. Set the key, or " +
        "switch AI_PROVIDER to 'ollama' to use a local model."
    );
  }
  if (data.CODE_EXECUTION_DRIVER === "remote" && !data.CODE_EXECUTION_API_URL) {
    throw new Error(
      "CODE_EXECUTION_DRIVER is 'remote' but CODE_EXECUTION_API_URL is empty."
    );
  }

  cached = data;
  return cached;
}

/** True when Google OAuth is fully configured; the login UI hides the button otherwise. */
export function isGoogleAuthEnabled(): boolean {
  const e = getEnv();
  return Boolean(e.AUTH_GOOGLE_ID && e.AUTH_GOOGLE_SECRET);
}

/** True when billing can actually be transacted. Gates the upgrade flow. */
export function isBillingEnabled(): boolean {
  const e = getEnv();
  return Boolean(e.STRIPE_SECRET_KEY && e.STRIPE_WEBHOOK_SECRET);
}
