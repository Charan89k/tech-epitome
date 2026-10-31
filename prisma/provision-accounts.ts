import { PrismaPg } from "@prisma/adapter-pg";
import { createInterface } from "node:readline";
import { Writable } from "node:stream";

import { loadEnv } from "./load-env";

import { PrismaClient } from "../src/generated/prisma/client";
import { databaseConnection } from "../src/lib/db/ssl";
import {
  ACCOUNTS,
  assertSafeTarget,
  provisionAccount,
  UnsafeTargetError,
  type AccountSpec,
} from "../src/lib/provisioning";

/**
 * Provisions the two test accounts: admin@cloude5.tech (platform ADMIN) and
 * student@cloude5.tech (USER). Idempotent; see src/lib/provisioning.ts.
 *
 *   npm run accounts:provision                  # both, prompts for passwords
 *   npm run accounts:provision -- --only student
 *
 * Passwords come from PROVISION_ADMIN_PASSWORD / PROVISION_STUDENT_PASSWORD
 * or, when unset and a terminal is attached, a prompt that does not echo.
 * Nothing prints a password. A non-local database is refused unless
 * `--allow-production` is passed and PROVISION_CONFIRM_DATABASE names it
 * (production use needs the owner's approval; see docs/DEPLOY.md).
 */

loadEnv();

const args = process.argv.slice(2);
const allowProduction = args.includes("--allow-production");
const onlyIndex = args.indexOf("--only");
const only = onlyIndex >= 0 ? args[onlyIndex + 1] : undefined;
if (only && !ACCOUNTS.some((a) => a.key === only)) {
  console.error(`--only must be one of: ${ACCOUNTS.map((a) => a.key).join(", ")}`);
  process.exit(2);
}

async function promptHidden(question: string): Promise<string> {
  if (!process.stdin.isTTY) {
    throw new Error(
      `${question.trim()} No terminal to prompt on; set the environment variable.`
    );
  }
  // Echo the question, swallow the keystrokes.
  let muted = false;
  const output = new Writable({
    write(chunk, _encoding, done) {
      if (!muted) process.stdout.write(chunk);
      done();
    },
  });
  const rl = createInterface({ input: process.stdin, output, terminal: true });
  const answer = await new Promise<string>((resolve) => {
    rl.question(question, resolve);
    muted = true;
  });
  rl.close();
  process.stdout.write("\n");
  return answer;
}

async function passwordFor(spec: AccountSpec): Promise<string> {
  const fromEnv = process.env[spec.passwordEnv];
  if (fromEnv) return fromEnv;
  const first = await promptHidden(
    `Password for ${spec.email} (${spec.passwordEnv} unset): `
  );
  const again = await promptHidden("Repeat it: ");
  if (first !== again) throw new Error(`${spec.email}: the two entries did not match.`);
  return first;
}

async function main(): Promise<void> {
  const target = assertSafeTarget(process.env.DATABASE_URL, {
    allowProduction,
    confirmDatabase: process.env.PROVISION_CONFIRM_DATABASE,
    nodeEnv: process.env.NODE_ENV,
  });
  console.log(
    `Provisioning on ${target.host}/${target.database}${target.production ? " (PRODUCTION, confirmed)" : " (local)"}`
  );

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ ...databaseConnection(process.env.DATABASE_URL!), max: 2 }),
  });
  try {
    for (const spec of ACCOUNTS.filter((a) => !only || a.key === only)) {
      const result = await provisionAccount(prisma, spec, await passwordFor(spec));
      console.log(
        `  ${result.email.padEnd(24)} ${result.role.padEnd(5)} ${result.status}` +
          (result.sessionsEnded ? " (existing sessions ended)" : "")
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  // Error messages here never contain a password (see provisionAccount).
  const message = error instanceof Error ? error.message : String(error);
  console.error(
    error instanceof UnsafeTargetError ? `Refused: ${message}` : `Failed: ${message}`
  );
  process.exitCode = 1;
});
