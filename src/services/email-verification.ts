import "server-only";

import type { CurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getEmailProvider } from "@/lib/email";
import { emailVerificationEmail } from "@/lib/email/templates";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";

import { hashToken, newToken, normaliseEmail } from "./institutions";

/**
 * Proof that a learner controls their account address, which domain
 * enrolment requires: without it anyone could sign up as
 * someone@college.edu and join that college.
 *
 * Tokens live in Auth.js's `verification_tokens` table, hashed. The
 * identifier binds a token to the account AND the address, so a token
 * issued before an email change cannot verify the new address.
 */
const TTL_MS = 24 * 60 * 60_000;

function identifier(userId: string, email: string): string {
  return `email-verify:${userId}:${normaliseEmail(email)}`;
}

export type VerificationRequest =
  { status: "sent" } | { status: "already_verified" } | { status: "rate_limited" };

export async function requestEmailVerification(
  user: Pick<CurrentUser, "id">
): Promise<VerificationRequest> {
  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { email: true, emailVerified: true },
  });
  if (!account) return { status: "rate_limited" };
  if (account.emailVerified) return { status: "already_verified" };

  const limited = await rateLimit(
    `email-verify:${user.id}`,
    RATE_LIMITS.EMAIL_VERIFICATION
  );
  if (!limited.success) return { status: "rate_limited" };

  const { token, hash } = newToken();
  const id = identifier(user.id, account.email);
  await prisma.$transaction([
    // Only the newest link works.
    prisma.verificationToken.deleteMany({ where: { identifier: id } }),
    prisma.verificationToken.create({
      data: { identifier: id, token: hash, expires: new Date(Date.now() + TTL_MS) },
    }),
  ]);
  await getEmailProvider().send(
    emailVerificationEmail({ email: account.email }, { token })
  );
  return { status: "sent" };
}

/** Confirms for the signed-in user only; someone else's link does nothing. */
export async function confirmEmailVerification(
  user: Pick<CurrentUser, "id">,
  token: string
): Promise<boolean> {
  const hash = hashToken(token);
  return prisma.$transaction(async (tx) => {
    const account = await tx.user.findUnique({
      where: { id: user.id },
      select: { email: true },
    });
    if (!account) return false;
    const row = await tx.verificationToken.findUnique({ where: { token: hash } });
    if (!row || row.identifier !== identifier(user.id, account.email)) return false;
    await tx.verificationToken.delete({ where: { token: hash } });
    if (row.expires <= new Date()) return false;
    await tx.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });
    return true;
  });
}
