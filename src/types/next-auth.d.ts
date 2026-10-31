import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "USER" | "ADMIN";
      /** User.sessionVersion when the token was minted. */
      sessionVersion: number;
    } & DefaultSession["user"];
  }

  interface User {
    role?: "USER" | "ADMIN";
    status?: "ACTIVE" | "SUSPENDED";
    sessionVersion?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "USER" | "ADMIN";
    /** Absent on tokens minted before sessionVersion existed; reads as 0. */
    sv?: number;
  }
}

export {};
