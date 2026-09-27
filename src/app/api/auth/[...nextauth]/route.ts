import { handlers } from "@/lib/auth";

/**
 * Auth.js callback endpoints (OAuth redirects, CSRF token, session).
 * Credentials sign-in goes through the server action in
 * src/app/(auth)/actions.ts, not through here.
 */
export const { GET, POST } = handlers;
