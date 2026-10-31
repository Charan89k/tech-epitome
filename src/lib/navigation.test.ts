import { describe, expect, it } from "vitest";

import { navForViewer } from "./navigation";

/**
 * The header menus, mobile sheet, rail and command palette all list
 * navigation from `navForViewer`. Hiding a link is not access control (admin
 * pages call `requireAdmin`), but a learner should never be shown one.
 */
const hrefs = (viewer: Parameters<typeof navForViewer>[0]) =>
  navForViewer(viewer).flatMap((group) => group.items.map((item) => item.href));

describe("navForViewer", () => {
  it("hides admin links from signed-out visitors", () => {
    expect(hrefs(null)).not.toContain("/admin");
  });

  it("hides admin links from learners", () => {
    expect(hrefs({ role: "USER" })).not.toContain("/admin");
  });

  it("shows admin links to admins", () => {
    expect(hrefs({ role: "ADMIN" })).toContain("/admin");
  });

  it("drops a group that has nothing left to show", () => {
    expect(navForViewer({ role: "USER" }).map((group) => group.label)).not.toContain(
      "Staff"
    );
  });

  it("keeps the learner destinations for everyone", () => {
    for (const viewer of [null, { role: "USER" as const }]) {
      expect(hrefs(viewer)).toEqual(
        expect.arrayContaining(["/learn/dsa", "/patterns", "/problems", "/campus"])
      );
    }
  });

  it("puts courses, patterns and problems in one Learn section", () => {
    const learn = navForViewer({ role: "USER" }).find((g) => g.label === "Learn");
    expect(learn?.items.map((item) => item.href)).toEqual(
      expect.arrayContaining(["/learn", "/patterns", "/problems"])
    );
  });

  it("keeps Campus-only links out of an individual learner's navigation", () => {
    for (const viewer of [
      null,
      { role: "USER" as const },
      { role: "USER" as const, campusMember: false },
    ]) {
      const links = hrefs(viewer);
      for (const href of ["/interviews", "/prepare", "/roadmaps"]) {
        expect(links).not.toContain(href);
      }
    }
  });

  it("shows the Campus offering to college members and admins, under Campus", () => {
    for (const viewer of [
      { role: "USER" as const, campusMember: true },
      { role: "ADMIN" as const },
    ]) {
      const campus = navForViewer(viewer).find((g) => g.label === "Campus");
      expect(campus?.items.map((item) => item.href)).toEqual(
        expect.arrayContaining(["/campus", "/interviews", "/prepare", "/roadmaps"])
      );
    }
    const learn = navForViewer({ role: "USER", campusMember: true }).find(
      (g) => g.label === "Learn"
    );
    expect(learn?.items.map((item) => item.href)).not.toContain("/interviews");
  });
});
