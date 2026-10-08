import { handlers } from "@/lib/auth";

/**
 * Auth.js callback endpoints (OAuth redirects, CSRF token, session).
 * The sign-in form uses the server action in src/app/(auth)/actions.ts,
 * but POST /api/auth/callback/credentials is still served here, which is
 * why the credentials rate limit lives in `authorize` (src/lib/auth).
 */
export const { GET, POST } = handlers;
