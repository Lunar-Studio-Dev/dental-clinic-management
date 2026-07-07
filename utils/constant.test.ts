import { describe, expect, it } from "vitest";
import {
  CLINIC_1_ID,
  CLINIC_2_ID,
  CLINICS,
  PATIENTS,
  SEED_USERS,
  VISITS,
} from "~/utils/constant";
import {
  SeedClinicSchema,
  SeedPatientSchema,
  SeedUserSchema,
  SeedVisitSchema,
} from "~/utils/constant.schema";

describe("seed constants — shape", () => {
  it("every clinic matches the schema", () => {
    for (const c of CLINICS)
      expect(() => SeedClinicSchema.parse(c)).not.toThrow();
  });
  it("every patient matches the schema", () => {
    for (const p of PATIENTS)
      expect(() => SeedPatientSchema.parse(p)).not.toThrow();
  });
  it("every visit matches the schema", () => {
    for (const v of VISITS)
      expect(() => SeedVisitSchema.parse(v)).not.toThrow();
  });
  it("every seed user matches the schema", () => {
    for (const u of SEED_USERS)
      expect(() => SeedUserSchema.parse(u)).not.toThrow();
  });
});

describe("seed constants — volume & invariants", () => {
  it("has exactly 2 clinics with the exported ids", () => {
    expect(CLINICS).toHaveLength(2);
    const ids = CLINICS.map((c) => c.id);
    expect(ids).toContain(CLINIC_1_ID);
    expect(ids).toContain(CLINIC_2_ID);
  });

  it("has exactly 100 patients", () => {
    expect(PATIENTS).toHaveLength(100);
  });

  it("has exactly 500 visits", () => {
    expect(VISITS).toHaveLength(500);
  });

  it("has 3 users: two receptionists (one to demo assignment) and one doctor", () => {
    expect(SEED_USERS).toHaveLength(3);
    expect(SEED_USERS.filter((u) => u.role === "receptionist")).toHaveLength(2);
    expect(SEED_USERS.filter((u) => u.role === "doctor")).toHaveLength(1);
  });

  it("all patient ids are unique", () => {
    expect(new Set(PATIENTS.map((p) => p.id)).size).toBe(PATIENTS.length);
  });

  it("all visit ids are unique", () => {
    expect(new Set(VISITS.map((v) => v.id)).size).toBe(VISITS.length);
  });
});

describe("seed constants — referential integrity", () => {
  const clinicIds = new Set(CLINICS.map((c) => c.id));
  const patientIds = new Set(PATIENTS.map((p) => p.id));

  it("every patient.firstClinicId points to a real clinic", () => {
    for (const p of PATIENTS) expect(clinicIds.has(p.firstClinicId)).toBe(true);
  });

  it("every visit references a real patient and clinic", () => {
    for (const v of VISITS) {
      expect(patientIds.has(v.patientId)).toBe(true);
      expect(clinicIds.has(v.clinicId)).toBe(true);
    }
  });
});

describe("seed constants — KPI-friendly distribution", () => {
  it("has at least one visit today (daysAgo === 0)", () => {
    expect(VISITS.some((v) => v.daysAgo === 0)).toBe(true);
  });

  it("has at least one visit within the last 7 days", () => {
    expect(VISITS.some((v) => v.daysAgo > 0 && v.daysAgo <= 6)).toBe(true);
  });

  it("has at least one returning patient (>= 2 visits)", () => {
    const counts = new Map<string, number>();
    for (const v of VISITS)
      counts.set(v.patientId, (counts.get(v.patientId) ?? 0) + 1);
    expect([...counts.values()].some((n) => n >= 2)).toBe(true);
  });

  it("has at least one new-only patient (exactly 1 visit, typed NEW)", () => {
    const byPatient = new Map<string, typeof VISITS>();
    for (const v of VISITS) {
      const arr = byPatient.get(v.patientId) ?? [];
      arr.push(v);
      byPatient.set(v.patientId, arr);
    }
    const newOnly = [...byPatient.values()].some(
      (vs) => vs.length === 1 && vs[0].type === "NEW",
    );
    expect(newOnly).toBe(true);
  });

  it("each patient's earliest visit (max daysAgo) is typed NEW", () => {
    const byPatient = new Map<string, typeof VISITS>();
    for (const v of VISITS) {
      const arr = byPatient.get(v.patientId) ?? [];
      arr.push(v);
      byPatient.set(v.patientId, arr);
    }
    for (const vs of byPatient.values()) {
      const earliest = vs.reduce((a, b) => (b.daysAgo > a.daysAgo ? b : a));
      expect(earliest.type).toBe("NEW");
    }
  });
});
