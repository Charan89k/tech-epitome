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
        expect.arrayContaining(["/learn/dsa", "/problems", "/prepare"])
      );
    }
  });
});
