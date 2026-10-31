"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getClientIp } from "@/lib/request-context";
import { emailSchema, passwordSchema } from "@/lib/validation/auth";
import { requestPasswordReset, resetPassword } from "@/services/password-reset";

export type RecoveryState = { error?: string; sent?: boolean };

const tokenSchema = z
  .string()
  .min(16)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/);

export async function requestResetAction(
  _prev: RecoveryState,
  form: FormData
): Promise<RecoveryState> {
  const email = emailSchema.safeParse(form.get("email"));
  if (!email.success) return { error: "Enter a valid email address." };
  await requestPasswordReset(email.data, await getClientIp());
  // The same answer whether or not the account exists.
  return { sent: true };
}

export async function resetPasswordAction(
  token: string,
  _prev: RecoveryState,
  form: FormData
): Promise<RecoveryState> {
  const parsedToken = tokenSchema.safeParse(token);
  if (!parsedToken.success) return { error: "This link is not valid." };
  const password = passwordSchema.safeParse(form.get("password"));
  if (!password.success) {
    return { error: password.error.issues[0]?.message ?? "Choose a longer password." };
  }
  if (form.get("password") !== form.get("confirm")) {
    return { error: "The two passwords do not match." };
  }
  const ok = await resetPassword(parsedToken.data, password.data);
  if (!ok)
    return { error: "This link has expired or was already used. Ask for a new one." };
  redirect("/login?reset=1");
}
