import { describe, expect, it } from "vitest";

import { authErrorMessage } from "./errors";

describe("authErrorMessage", () => {
  it("returns nothing when there is no error", () => {
    expect(authErrorMessage(undefined)).toBeNull();
    expect(authErrorMessage("")).toBeNull();
  });

  it("explains an unlinked account without inviting a takeover", () => {
    expect(authErrorMessage("OAuthAccountNotLinked")).toMatch(/already exists/);
  });

  it("explains a provider profile with no email", () => {
    expect(authErrorMessage("AccessDenied")).toMatch(/email address/);
  });

  it("never echoes an unknown or crafted code", () => {
    const crafted = "Your account is locked, call +1 555 0100";
    const message = authErrorMessage(crafted);
    expect(message).not.toContain("555");
    expect(message).toBe("Sign-in did not complete. Please try again.");
  });

  it("does not treat inherited object keys as known codes", () => {
    expect(authErrorMessage("toString")).toBe(
      "Sign-in did not complete. Please try again."
    );
    expect(authErrorMessage("__proto__")).toBe(
      "Sign-in did not complete. Please try again."
    );
  });

  it("uses the first value of a repeated parameter", () => {
    expect(authErrorMessage(["Configuration", "OAuthAccountNotLinked"])).toMatch(
      /unavailable/
    );
  });
});
