import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Edge-safe half of the Auth.js configuration.
 *
 * `proxy.ts` runs in the edge runtime, where Prisma and the argon2 native
 * addon cannot load. This module therefore contains only what the proxy needs
 * to read a session cookie and decide on a redirect - no adapter, no
 * credentials provider, no database. The full configuration in `./index.ts`
 * spreads this and adds the Node-only pieces.
 */
export const authConfig = {
  // Credentials sign-in cannot use database sessions, so the whole app uses
  // JWT sessions for consistency between providers.
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },

  pages: {
    signIn: "/login",
    newUser: "/dashboard",
    error: "/login",
  },

  providers: [
    // Registered unconditionally so the edge and node configs stay identical;
    // the login UI only renders the button when credentials are present.
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: false,
          }),
        ]
      : []),
  ],

  callbacks: {
    /**
     * Copies the stable identity claims onto the token. Anything that can
     * change mid-session (role, progress) is deliberately NOT cached here -
     * it is read from the database per request, because a stale JWT claim is
     * how an authorization bypass happens. A demoted admin must lose the
     * admin surface on their next request, not on their next sign-in.
     */
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role ?? "USER";
      }
      if (trigger === "update" && session?.name) {
        token.name = session.name as string;
      }
      return token;
    },

    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "USER" | "ADMIN") ?? "USER";
      }
      return session;
    },
  },

  trustHost: true,
} satisfies NextAuthConfig;
