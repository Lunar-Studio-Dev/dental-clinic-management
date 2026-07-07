import { describe, expect, it } from "vitest";
import type { VisitListItem } from "~/lib/data/types";
import { computeMetrics, type MetricsInput } from "~/lib/metrics";

const NOW = new Date("2026-07-07T12:00:00.000Z"); // Tuesday

function visit(
  id: string,
  patientId: string,
  visitedAt: string,
  type = "FOLLOW_UP",
): VisitListItem {
  return {
    id,
    patientId,
    clinicId: "clinic_1",
    type,
    reason: "R",
    notes: null,
    visitedAt,
    patientName: patientId,
  };
}

const input: MetricsInput = {
  patients: [
    { id: "p1", createdAt: "2026-07-07T09:00:00.000Z", visitCount: 3 }, // today, returning
    { id: "p2", createdAt: "2026-01-01T00:00:00.000Z", visitCount: 1 }, // old, new
    { id: "p3", createdAt: "2026-06-15T00:00:00.000Z", visitCount: 2 }, // returning
  ],
  visits: [
    visit("v1", "p1", "2026-07-07T09:00:00.000Z", "NEW"),
    visit("v2", "p2", "2026-07-07T10:00:00.000Z"),
    visit("v3", "p1", "2026-07-04T09:00:00.000Z"),
    visit("v4", "p3", "2026-05-10T09:00:00.000Z"),
  ],
  clinics: [
    { id: "clinic_1", name: "Clinic 1", patientCount: 50 },
    { id: "clinic_2", name: "Clinic 2", patientCount: 42 },
  ],
};

describe("computeMetrics", () => {
  const m = computeMetrics(input, NOW);

  it("counts patients, new-today and returning", () => {
    expect(m.totalPatients).toBe(3);
    expect(m.newPatientsToday).toBe(1); // p1
    expect(m.returningPatients).toBe(2); // p1, p3
  });

  it("computes repeat visit % (rounded)", () => {
    expect(m.repeatVisitPct).toBe(67); // round(2/3*100)
  });

  it("counts today's visits and distinct patients seen today", () => {
    expect(m.visitsToday).toBe(2); // v1, v2
    expect(m.patientsSeenToday).toBe(2); // p1, p2
  });

  it("counts this month's visits", () => {
    expect(m.visitsThisMonth).toBe(3); // v1, v2, v3 are all July; v4 is May
  });

  it("produces a 7-point weekly trend and a 6-point monthly series", () => {
    expect(m.weeklyVisitTrend).toHaveLength(7);
    expect(m.monthlyPatientCounts).toHaveLength(6);
    // today's bucket should include v1 + v2
    expect(m.weeklyVisitTrend.at(-1)?.count).toBe(2);
  });

  it("maps clinic-wise patient counts and new-vs-returning", () => {
    expect(m.clinicWisePatients).toEqual([
      { clinicId: "clinic_1", name: "Clinic 1", count: 50 },
      { clinicId: "clinic_2", name: "Clinic 2", count: 42 },
    ]);
    expect(m.newVsReturning).toEqual({ new: 1, returning: 2 });
  });

  it("returns recent visits newest-first", () => {
    expect(m.recentVisits[0].id).toBe("v2"); // 10:00 today
    expect(m.recentVisits.length).toBeLessThanOrEqual(8);
  });

  it("handles an empty clinic without dividing by zero", () => {
    const empty = computeMetrics(
      { patients: [], visits: [], clinics: [] },
      NOW,
    );
    expect(empty.totalPatients).toBe(0);
    expect(empty.repeatVisitPct).toBe(0);
    expect(empty.weeklyVisitTrend).toHaveLength(7);
  });
});
