import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
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

    // `allowDangerousEmailAccountLinking` stays false here for the same
    // reason it is false for Google, and the reason matters more on GitHub:
    // a GitHub account's email is not necessarily one the person proved they
    // own to us. Linking on a matching address alone would let anyone who can
    // set that address on a GitHub profile walk into the existing Tech
    // Epitome account. Auth.js instead raises OAuthAccountNotLinked, which
    // the login page renders as a real message.
    ...(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
      ? [
          GitHub({
            clientId: process.env.AUTH_GITHUB_ID,
            clientSecret: process.env.AUTH_GITHUB_SECRET,
            allowDangerousEmailAccountLinking: false,
          }),
        ]
      : []),
  ],

  callbacks: {
    /**
     * Refuses an OAuth identity that arrives without an email address.
     *
     * `User.email` is non-null and unique, so a profile with no address
     * cannot become a Tech Epitome account. Auth.js already works hard to
     * avoid this — the GitHub provider asks for `user:email` and falls back
     * to the `/user/emails` API when the profile address is private — but a
     * GitHub account with no verified address at all still reaches us with
     * `email: null`. Without this guard that surfaces as a Prisma
     * null-constraint violation, which the user sees as a 500 on a page
     * that was working a second ago.
     *
     * Returning false sends them back to /login with an `AccessDenied`
     * error instead, which is a wrong-but-honest answer rather than a crash.
     * Credentials sign-in is untouched: it has already proved the address.
     */
    signIn({ user, account }) {
      const isOAuth = account?.type === "oauth" || account?.type === "oidc";
      if (isOAuth && !user?.email) return false;
      return true;
    },

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
