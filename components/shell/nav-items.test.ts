import { describe, expect, it } from "vitest";
import { isActive, NAV_ITEMS } from "~/components/shell/nav-items";

describe("nav items", () => {
  it("exposes the three shell routes in order", () => {
    expect(NAV_ITEMS.map((i) => i.href)).toEqual([
      "/dashboard",
      "/patients",
      "/visits",
    ]);
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
