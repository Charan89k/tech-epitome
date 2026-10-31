import { describe, expect, it } from "vitest";

import { loginPathFor } from "@/lib/auth/login-path";
import { decidePortal } from "./portal";

const member = (
  role: "STUDENT" | "FACULTY" | "INSTITUTION_ADMIN",
  slug = "college"
) => ({
  role,
  institution: { slug },
});

describe("decidePortal", () => {
  it("sends a student through the student door to their college", () => {
    expect(decidePortal("student", [member("STUDENT")], false)).toEqual({
      kind: "go",
      path: "/campus/college",
    });
  });

  it("refuses a student at the teacher door, whatever the URL says", () => {
    expect(decidePortal("teacher", [member("STUDENT")], false)).toEqual({
      kind: "refuse",
      hasOtherMembership: true,
    });
  });

  it("refuses faculty at the student door", () => {
    expect(decidePortal("student", [member("FACULTY")], false).kind).toBe("refuse");
  });

  it("lets faculty and institution admins through the teacher door", () => {
    expect(decidePortal("teacher", [member("FACULTY")], false).kind).toBe("go");
    expect(decidePortal("teacher", [member("INSTITUTION_ADMIN")], false).kind).toBe(
      "go"
    );
  });

  it("refuses an account with no membership at both doors", () => {
    expect(decidePortal("student", [], false)).toEqual({
      kind: "refuse",
      hasOtherMembership: false,
    });
    expect(decidePortal("teacher", [], false).kind).toBe("refuse");
  });

  it("lists colleges when several match", () => {
    expect(
      decidePortal("student", [member("STUDENT", "a"), member("STUDENT", "b")], false)
    ).toEqual({ kind: "go", path: "/campus" });
  });

  it("lets a platform operator in without a membership", () => {
    expect(decidePortal("teacher", [], true)).toEqual({ kind: "go", path: "/campus" });
  });
});

describe("loginPathFor", () => {
  it("gives each product its own entry point", () => {
    expect(loginPathFor("/admin/users")).toBe("/admin/login");
    expect(loginPathFor("/campus/college")).toBe("/campus/login");
    expect(loginPathFor("/interviews")).toBe("/campus/login");
    expect(loginPathFor("/dashboard")).toBe("/login");
  });

  it("does not match a longer path that shares a prefix", () => {
    expect(loginPathFor("/administrator")).toBe("/login");
    expect(loginPathFor("/campuses")).toBe("/login");
  });
});
