import { describe, expect, it } from "vitest";

import { credentialsSchema, emailSchema, passwordSchema, signUpSchema } from "./auth";

describe("emailSchema", () => {
  it("trims surrounding whitespace", () => {
    expect(emailSchema.parse("  ada@example.com  ")).toBe("ada@example.com");
  });

  it("rejects malformed addresses", () => {
    for (const bad of ["", "ada", "ada@", "@example.com", "ada @example.com"]) {
      expect(emailSchema.safeParse(bad).success, bad).toBe(false);
    }
  });

  it("rejects an address beyond the RFC length limit", () => {
    const tooLong = `${"a".repeat(250)}@example.com`;
    expect(emailSchema.safeParse(tooLong).success).toBe(false);
  });
});

describe("passwordSchema", () => {
  it("requires at least ten characters", () => {
    expect(passwordSchema.safeParse("short").success).toBe(false);
    expect(passwordSchema.safeParse("0123456789").success).toBe(true);
  });

  it("accepts a long passphrase with no symbols or digits", () => {
    // Deliberate: NIST 800-63B advises against forced composition rules,
    // which push users toward predictable substitutions.
    expect(passwordSchema.safeParse("correct horse battery staple").success).toBe(
      true
    );
  });

  it("rejects an absurdly long password", () => {
    // Unbounded input into an argon2 hash is a cheap denial-of-service.
    expect(passwordSchema.safeParse("a".repeat(500)).success).toBe(false);
  });
});

describe("credentialsSchema", () => {
  it("does not apply the signup length rule at sign-in", () => {
    // An existing account may predate the current policy; refusing to even
    // attempt the check would lock them out rather than fail the password.
    const result = credentialsSchema.safeParse({
      email: "ada@example.com",
      password: "old",
    });
    expect(result.success).toBe(true);
  });

  it("still requires a non-empty password", () => {
    expect(
      credentialsSchema.safeParse({ email: "ada@example.com", password: "" })
        .success
    ).toBe(false);
  });
});

describe("signUpSchema", () => {
  it("accepts a valid registration", () => {
    const result = signUpSchema.safeParse({
      name: "  Ada Lovelace ",
      email: "ADA@Example.com",
      password: "analytical-engine",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Ada Lovelace");
    }
  });

  it("requires a name", () => {
    expect(
      signUpSchema.safeParse({
        name: "   ",
        email: "ada@example.com",
        password: "analytical-engine",
      }).success
    ).toBe(false);
  });
});
