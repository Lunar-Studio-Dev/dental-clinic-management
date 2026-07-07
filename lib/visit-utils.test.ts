import { describe, expect, it } from "vitest";
import { formatVisitTime, visitTypeLabel } from "~/lib/visit-utils";

describe("visitTypeLabel", () => {
  it("maps enum values to friendly labels", () => {
    expect(visitTypeLabel("NEW")).toBe("New");
    expect(visitTypeLabel("FOLLOW_UP")).toBe("Follow-up");
  });
});

describe("formatVisitTime", () => {
  it("returns an HH:mm time string", () => {
    // Timezone-agnostic: just assert the shape (avoids CI TZ flakiness).
    expect(formatVisitTime("2026-07-01T09:05:00.000Z")).toMatch(
      /^\d{2}:\d{2}$/,
    );
  });
});
