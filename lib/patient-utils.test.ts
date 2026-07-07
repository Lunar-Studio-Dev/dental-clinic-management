import { describe, expect, it } from "vitest";
import { isReturning, patientAge } from "~/lib/patient-utils";

const NOW = new Date("2026-07-07T00:00:00.000Z");

describe("patientAge", () => {
  it("computes age from dateOfBirth", () => {
    expect(
      patientAge(
        { dateOfBirth: "1990-05-01T00:00:00.000Z", ageYears: null },
        NOW,
      ),
    ).toBe(36);
  });

  it("does not count a birthday later this year", () => {
    expect(
      patientAge(
        { dateOfBirth: "1990-12-31T00:00:00.000Z", ageYears: null },
        NOW,
      ),
    ).toBe(35);
  });

  it("falls back to ageYears when no dateOfBirth", () => {
    expect(patientAge({ dateOfBirth: null, ageYears: 40 }, NOW)).toBe(40);
  });

  it("returns null when neither is present", () => {
    expect(patientAge({ dateOfBirth: null, ageYears: null }, NOW)).toBeNull();
  });
});

describe("isReturning", () => {
  it("is true with 2+ visits", () => {
    expect(isReturning(2)).toBe(true);
    expect(isReturning(5)).toBe(true);
  });
  it("is false with fewer than 2", () => {
    expect(isReturning(1)).toBe(false);
    expect(isReturning(0)).toBe(false);
  });
});
