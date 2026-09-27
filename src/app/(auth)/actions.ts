"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { AuthError } from "next-auth";

import { signIn, signOut } from "@/lib/auth";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";
import { getClientIp } from "@/lib/request-context";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";
import { credentialsSchema, signUpSchema } from "@/lib/validation/auth";

/**
 * Auth server actions.
 *
 * Every action re-validates its input server-side; the client schema is a UX
 * convenience and is never trusted. Errors come back as a value rather than a
 * thrown exception so `useActionState` can render them inline.
 */

export type AuthFormState = {
  error?: string;
  /** Field-level messages, keyed by input name. */
  fieldErrors?: Record<string, string>;
};

/** Only allow same-origin, absolute-path redirects. Blocks open redirects. */
function safeNext(next: FormDataEntryValue | null): string {
  const value = typeof next === "string" ? next : "";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export async function signInAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const ip = await getClientIp();
  const limited = await rateLimit(`signin:${ip}`, RATE_LIMITS.AUTH_SIGNIN);
  if (!limited.success) {
    const minutes = Math.ceil((limited.resetAt - Date.now()) / 60_000);
    return {
      error: `Too many sign-in attempts. Try again in ${minutes} minute${
        minutes === 1 ? "" : "s"
      }.`,
    };
  }

  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const next = safeNext(formData.get("next"));

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: next,
    });
  } catch (error) {
    // `signIn` signals success by throwing a redirect. `unstable_rethrow`
    // is the supported way to let Next's internal control-flow errors
    // through a catch block instead of reaching into next/dist.
    unstable_rethrow(error);

    if (error instanceof AuthError) {
      // Deliberately not distinguishing "no such user" from "wrong password".
      return { error: "That email and password combination is not correct." };
    }
    throw error;
  }

  // Unreachable: a successful signIn redirects.
  return {};
}

export async function signUpAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const ip = await getClientIp();
  const limited = await rateLimit(`signup:${ip}`, RATE_LIMITS.AUTH_SIGNUP);
  if (!limited.success) {
    return { error: "Too many accounts created from here. Try again later." };
  }

  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const { name, email, password } = parsed.data;
  const normalisedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalisedEmail },
    select: { id: true },
  });

  if (existing) {
    // Registration inherently reveals whether an email is taken - there is no
    // way to create an account at that address either way. Say so plainly
    // rather than pretending, and point at recovery.
    return {
      fieldErrors: {
        email: "An account already exists for this email. Sign in instead.",
      },
    };
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.create({
    data: {
      name,
      email: normalisedEmail,
      passwordHash,
      // Created here rather than relying on the adapter's createUser event,
      // which only fires for OAuth sign-ups.
      profile: { create: {} },
    },
  });

  const next = safeNext(formData.get("next"));

  try {
    await signIn("credentials", {
      email: normalisedEmail,
      password,
      redirectTo: next,
    });
  } catch (error) {
    unstable_rethrow(error);
    // The account exists; only the automatic sign-in failed.
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  return {};
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}

export async function signInWithGoogleAction(formData: FormData): Promise<void> {
  const next = safeNext(formData.get("next"));
  await signIn("google", { redirectTo: next });
}

function fieldErrorsFrom(error: {
  issues: { path: PropertyKey[]; message: string }[];
}): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}
