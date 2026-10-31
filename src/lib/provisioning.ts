import { hash } from "@node-rs/argon2";

import type { PrismaClient } from "../generated/prisma/client";
import { ARGON2_OPTIONS } from "./auth/argon2";
import { emailSchema, passwordSchema } from "./validation/auth";

/**
 * Test-account provisioning, shared by `prisma/provision-accounts.ts` and
 * its tests. Uses the application's own roles (platform ADMIN and USER;
 * there is no separate super-admin role) and the application's Argon2
 * settings, so a provisioned account signs in exactly like any other.
 *
 * Passwords are never logged or returned. Re-running is safe: an existing
 * account gets the requested role and the new password, and its sessions
 * are ended (sessionVersion) so an old cookie cannot outlive the change.
 */

export type ProvisionRole = "ADMIN" | "USER";

export type AccountSpec = {
  key: "admin" | "student";
  email: string;
  name: string;
  role: ProvisionRole;
  /** Environment variable that may hold the initial password. */
  passwordEnv: string;
};

export const ACCOUNTS: readonly AccountSpec[] = [
  {
    key: "admin",
    email: process.env.PROVISION_ADMIN_EMAIL ?? "admin@techepitome.test",
    name: "Platform Admin",
    role: "ADMIN",
    passwordEnv: "PROVISION_ADMIN_PASSWORD",
  },
  {
    key: "student",
    email: process.env.PROVISION_STUDENT_EMAIL ?? "student@techepitome.test",
    name: "Test Student",
    role: "USER",
    passwordEnv: "PROVISION_STUDENT_PASSWORD",
  },
];

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export class UnsafeTargetError extends Error {}

/**
 * Refuses anything that could be production unless it is named on purpose.
 *
 * A local database (localhost, 127.0.0.1, ::1) outside NODE_ENV=production
 * is allowed. Anything else, including the `db` host inside the production
 * compose network, needs `--allow-production` AND
 * PROVISION_CONFIRM_DATABASE set to that database's name, so a stray
 * DATABASE_URL in a shell cannot silently create admin accounts.
 */
export function assertSafeTarget(
  databaseUrl: string | undefined,
  opts: { allowProduction: boolean; confirmDatabase?: string; nodeEnv?: string }
): { host: string; database: string; production: boolean } {
  if (!databaseUrl) throw new UnsafeTargetError("DATABASE_URL is not set.");
  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    throw new UnsafeTargetError("DATABASE_URL is not a valid URL.");
  }
  const host = url.hostname;
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  const production = opts.nodeEnv === "production" || !LOCAL_HOSTS.has(host);
  if (!production) return { host, database, production };

  if (!opts.allowProduction) {
    throw new UnsafeTargetError(
      `Refusing to provision on "${host}/${database}": ` +
        (opts.nodeEnv === "production"
          ? "NODE_ENV is production. "
          : "it is not a local database. ") +
        "Pass --allow-production and set PROVISION_CONFIRM_DATABASE to the database name, " +
        "and only with the owner's approval."
    );
  }
  if (!database || opts.confirmDatabase !== database) {
    throw new UnsafeTargetError(
      `PROVISION_CONFIRM_DATABASE must equal the target database name ("${database}").`
    );
  }
  return { host, database, production };
}

export type ProvisionResult = {
  email: string;
  role: ProvisionRole;
  status: "created" | "updated";
  sessionsEnded: boolean;
};

export async function provisionAccount(
  prisma: PrismaClient,
  spec: Pick<AccountSpec, "email" | "name" | "role">,
  password: string
): Promise<ProvisionResult> {
  const email = emailSchema.parse(spec.email).toLowerCase();
  const checked = passwordSchema.safeParse(password);
  if (!checked.success) {
    // The message is the rule ("at least 10 characters"), never the value.
    throw new Error(
      `${email}: ${checked.error.issues[0]?.message ?? "invalid password"}`
    );
  }
  const passwordHash = await hash(password, ARGON2_OPTIONS);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({
      where: { email },
      select: { id: true },
    });
    const user = existing
      ? await tx.user.update({
          where: { id: existing.id },
          // A new password or role ends every existing session.
          data: { role: spec.role, passwordHash, sessionVersion: { increment: 1 } },
          select: { id: true },
        })
      : await tx.user.create({
          data: {
            email,
            name: spec.name,
            role: spec.role,
            passwordHash,
            // Provisioned by the operator, so the address is trusted.
            emailVerified: new Date(),
            profile: { create: {} },
          },
          select: { id: true },
        });

    await tx.auditLog.create({
      data: {
        actorId: user.id,
        actorEmail: "provisioning-cli",
        action: existing ? "account.reprovisioned" : "account.provisioned",
        entity: "user",
        entityId: user.id,
        summary: `${email} provisioned as ${spec.role} by the provisioning command`,
      },
    });

    return {
      email,
      role: spec.role,
      status: existing ? "updated" : "created",
      sessionsEnded: Boolean(existing),
    };
  });
}
