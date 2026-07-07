import { describe, expect, it } from "vitest";
import {
  isActive,
  NAV_ITEMS,
  visibleNavItems,
} from "~/components/shell/nav-items";

describe("nav items", () => {
  it("exposes the shell routes in order", () => {
    expect(NAV_ITEMS.map((i) => i.href)).toEqual([
      "/dashboard",
      "/patients",
      "/visits",
      "/clinic",
    ]);
  });

  it("scopes the Clinic item to doctors", () => {
    const clinic = NAV_ITEMS.find((i) => i.href === "/clinic");
    expect(clinic?.roles).toEqual(["doctor"]);
  });
});

describe("visibleNavItems", () => {
  it("hides role-scoped items for a receptionist", () => {
    const hrefs = visibleNavItems("receptionist").map((i) => i.href);
    expect(hrefs).toEqual(["/dashboard", "/patients", "/visits"]);
    expect(hrefs).not.toContain("/clinic");
  });

  it("shows the Clinic item to a doctor", () => {
    const hrefs = visibleNavItems("doctor").map((i) => i.href);
    expect(hrefs).toContain("/clinic");
    expect(hrefs).toHaveLength(4);
  });

  it("hides role-scoped items when the role is unknown (null)", () => {
    expect(visibleNavItems(null).map((i) => i.href)).not.toContain("/clinic");
  });
});

describe("isActive", () => {
  it("matches an exact path", () => {
    expect(isActive("/patients", "/patients")).toBe(true);
  });
  it("matches a nested path (e.g. patient profile)", () => {
    expect(isActive("/patients/abc123", "/patients")).toBe(true);
  });
  it("does not match a different route", () => {
    expect(isActive("/dashboard", "/patients")).toBe(false);
  });
  it("does not treat a prefix collision as active", () => {
    expect(isActive("/patients-archive", "/patients")).toBe(false);
  });
});
