import "server-only";

import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";
import { getEmailProvider } from "@/lib/email";
import { passwordResetEmail } from "@/lib/email/templates";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";

import { hashToken, newToken, normaliseEmail } from "./institutions";

/**
 * Account recovery.
 *
 * Tokens live hashed in `verification_tokens`, like email verification. A
 * link works once, expires in an hour, and using it ends every session. A
 * request says nothing about whether the address has an account.
 */
const TTL_MS = 60 * 60_000;
const PREFIX = "password-reset:";

async function issueToken(userId: string): Promise<string> {
  const { token, hash } = newToken();
  const identifier = `${PREFIX}${userId}`;
  await prisma.$transaction([
    // Only the newest link works.
    prisma.verificationToken.deleteMany({ where: { identifier } }),
    prisma.verificationToken.create({
      data: { identifier, token: hash, expires: new Date(Date.now() + TTL_MS) },
    }),
  ]);
  return token;
}

/** Always resolves the same way, so a caller cannot probe for accounts. */
export async function requestPasswordReset(
  rawEmail: string,
  ip: string
): Promise<void> {
  const email = normaliseEmail(rawEmail);
  const [byIp, byEmail] = await Promise.all([
    rateLimit(`password-reset:${ip}`, RATE_LIMITS.PASSWORD_RESET),
    rateLimit(`password-reset-email:${email}`, RATE_LIMITS.PASSWORD_RESET),
  ]);
  if (!byIp.success || !byEmail.success) return;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, status: true },
  });
  if (!user || user.status !== "ACTIVE") return;

  const token = await issueToken(user.id);
  await getEmailProvider()
    .send(passwordResetEmail({ email }, { token }))
    .catch((error: unknown) => {
      console.error(
        "[password-reset] send failed",
        error instanceof Error ? error.name : "unknown"
      );
    });
}

/**
 * Sets a new password from a link. False when the link is unknown, expired or
 * already used. Deleting the row first is the claim: of two concurrent uses,
 * only one sees a count of 1.
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<boolean> {
  const hash = hashToken(token);
  const row = await prisma.verificationToken.findUnique({ where: { token: hash } });
  if (!row || !row.identifier.startsWith(PREFIX)) return false;
  const userId = row.identifier.slice(PREFIX.length);
  const passwordHash = await hashPassword(newPassword);

  return prisma.$transaction(async (tx) => {
    const claimed = await tx.verificationToken.deleteMany({
      where: { token: hash, expires: { gt: new Date() } },
    });
    if (claimed.count !== 1) return false;

    const user = await tx.user.update({
      where: { id: userId },
      data: { passwordHash, sessionVersion: { increment: 1 } },
      select: { email: true },
    });
    await tx.auditLog.create({
      data: {
        actorId: userId,
        actorEmail: user.email,
        action: "account.password_reset",
        entity: "user",
        entityId: userId,
        summary: `${user.email} set a new password from a reset link`,
      },
    });
    return true;
  });
}

/**
 * A platform admin recovers an account when no email can reach it. Audited,
 * and the link is shown once to that admin; it is never stored in the clear.
 */
export async function issueResetLinkAsAdmin(
  admin: { id: string; email: string; role: string },
  userId: string
): Promise<string | null> {
  if (admin.role !== "ADMIN")
    throw new Error("Only a platform admin can issue a reset link.");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, status: true },
  });
  if (!user || user.status !== "ACTIVE") return null;

  const token = await issueToken(user.id);
  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      actorEmail: admin.email,
      action: "account.reset_link_issued",
      entity: "user",
      entityId: user.id,
      summary: `Reset link issued for ${user.email}`,
    },
  });
  return token;
}
