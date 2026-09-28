import "server-only";

import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "@/lib/auth/config";
import { verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";
import { credentialsSchema } from "@/lib/validation/auth";

/**
 * Full Auth.js setup. Node runtime only - it pulls in Prisma and the argon2
 * native addon. `proxy.ts` must import `@/lib/auth/config` instead.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  // The adapter still persists users and OAuth account links even though
  // sessions themselves are JWTs.
  adapter: PrismaAdapter(prisma),

  providers: [
    ...authConfig.providers,

    Credentials({
      id: "credentials",
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            role: true,
            passwordHash: true,
          },
        });

        // Hash a throwaway value when the account does not exist so that a
        // missing user and a wrong password take the same amount of time.
        // Without this, response timing enumerates registered emails.
        const ok = await verifyPassword(
          user?.passwordHash ??
            "$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHR2YWx1ZQ$0000000000000000000000000000000000000000000",
          password
        );

        if (!user || !ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],

  events: {
    /**
     * Every user needs a Profile row; it holds the denormalised counters the
     * dashboard reads. Creating it here means no other code path has to
     * handle a null profile.
     */
    async createUser({ user }) {
      if (!user.id) return;
      await prisma.profile.upsert({
        where: { userId: user.id },
        create: { userId: user.id },
        update: {},
      });
    },

    /**
     * Drops the provider tokens the adapter just wrote.
     *
     * The adapter persists whatever the provider returned — access token,
     * refresh token, id token — because that is what an app calling the
     * provider's API on the user's behalf would need. Tech Epitome uses
     * Google and GitHub for identity only: it never reads a repository,
     * never touches a calendar, never calls either API after the callback
     * completes. Sessions are JWTs, so nothing downstream reads these
     * columns either.
     *
     * Keeping them would mean holding live third-party credentials for
     * every learner in exchange for no capability at all, which only ever
     * reads as a liability in a breach. The row itself stays: the
     * `(provider, providerAccountId)` pair is what identifies a returning
     * OAuth user, and that is the part we actually need.
     *
     * The columns stay in the schema because they are part of the adapter's
     * contract — this empties them rather than migrating them away.
     */
    async linkAccount({ account }) {
      await prisma.account.updateMany({
        where: {
          provider: account.provider,
          providerAccountId: account.providerAccountId,
        },
        data: {
          access_token: null,
          refresh_token: null,
          id_token: null,
          expires_at: null,
          session_state: null,
          scope: null,
        },
      });
    },
  },
});
