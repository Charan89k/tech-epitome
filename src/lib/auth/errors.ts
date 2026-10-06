/**
 * Messages for the `?error=` codes Auth.js appends when it sends someone
 * back to /login or /signup after an OAuth attempt fails.
 *
 * The query parameter is attacker-controlled — anyone can link to
 * `/login?error=<anything>` — so it is never echoed. A known code maps to a
 * message written here; anything else maps to the generic one. That keeps a
 * crafted link from putting words on our sign-in page.
 *
 * Codes come from Auth.js' `SignInPageErrorParam` and `ErrorPageParam`.
 */

const MESSAGES: Record<string, string> = {
  // An email/password account already uses this address. Linking on a
  // matching email alone is disabled on purpose (see auth/config.ts), so the
  // honest answer is to say how to get in.
  OAuthAccountNotLinked:
    "An account with this email already exists. Sign in with your email and password instead.",

  // The signIn callback refused the identity — for us, a provider profile
  // with no email address.
  AccessDenied:
    "That account did not share an email address with us, so we cannot sign you in with it. Use email and password, or another provider.",

  OAuthSignin: "Could not start sign-in with that provider. Please try again.",
  OAuthCallbackError: "Sign-in with that provider did not complete. Please try again.",
  OAuthCreateAccount:
    "We could not create your account from that provider. Please try again, or sign up with email.",
  Callback: "Sign-in did not complete. Please try again.",

  // Missing or invalid provider credentials on the server. Not the
  // learner's fault and not something they can fix.
  Configuration:
    "Sign-in with that provider is unavailable right now. Use email and password instead.",

  SessionRequired: "Please sign in to continue.",
};

const GENERIC = "Sign-in did not complete. Please try again.";

/** A safe, human message for an Auth.js error code, or null when there is none. */
export function authErrorMessage(code: string | string[] | undefined): string | null {
  const value = Array.isArray(code) ? code[0] : code;
  if (!value) return null;
  return Object.hasOwn(MESSAGES, value) ? MESSAGES[value]! : GENERIC;
}
