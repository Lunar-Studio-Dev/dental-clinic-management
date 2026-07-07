import { describe, expect, it } from "vitest";
import {
  patientCreateSchema,
  patientUpdateSchema,
  visitCreateSchema,
  visitNoteSchema,
} from "~/lib/schemas";

const valid = {
  name: "Asha Mehta",
  gender: "FEMALE",
  contactNumber: "9810000001",
  firstClinicId: "clinic_1",
  ageYears: 34,
};

describe("patientCreateSchema", () => {
  it("accepts a valid patient with age", () => {
    expect(patientCreateSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts a valid patient with dateOfBirth instead of age", () => {
    const r = patientCreateSchema.safeParse({
      ...valid,
      ageYears: undefined,
      dateOfBirth: "1990-05-01T00:00:00.000Z",
    });
    expect(r.success).toBe(true);
  });

  it("rejects when both dateOfBirth and ageYears are missing", () => {
    expect(
      patientCreateSchema.safeParse({ ...valid, ageYears: undefined }).success,
    ).toBe(false);
  });

  it("rejects a missing name", () => {
    expect(patientCreateSchema.safeParse({ ...valid, name: "" }).success).toBe(
      false,
    );
  });

  it("rejects a missing clinic", () => {
    expect(
      patientCreateSchema.safeParse({ ...valid, firstClinicId: undefined })
        .success,
    ).toBe(false);
  });

  it("defaults bloodGroup to UNKNOWN when omitted", () => {
    const r = patientCreateSchema.parse(valid);
    expect(r.bloodGroup).toBe("UNKNOWN");
  });
});

describe("patientUpdateSchema", () => {
  it("allows a partial update", () => {
    expect(
      patientUpdateSchema.safeParse({ contactNumber: "9811111111" }).success,
    ).toBe(true);
  });

  it("strips firstClinicId (clinic is immutable)", () => {
    const r = patientUpdateSchema.parse({
      name: "X",
      firstClinicId: "clinic_2",
    });
    expect(r).not.toHaveProperty("firstClinicId");
  });
});

describe("visitCreateSchema", () => {
  const validVisit = {
    patientId: "p1",
    clinicId: "clinic_1",
    reason: "Fever",
  };

  it("accepts a valid visit (no type — server derives it)", () => {
    expect(visitCreateSchema.safeParse(validVisit).success).toBe(true);
  });

  it("requires patientId, clinicId and reason", () => {
    expect(
      visitCreateSchema.safeParse({ ...validVisit, patientId: "" }).success,
    ).toBe(false);
    expect(
      visitCreateSchema.safeParse({ ...validVisit, clinicId: "" }).success,
    ).toBe(false);
    expect(
      visitCreateSchema.safeParse({ ...validVisit, reason: "" }).success,
    ).toBe(false);
  });
});

describe("visitNoteSchema", () => {
  it("accepts a note", () => {
    expect(
      visitNoteSchema.safeParse({ notes: "Prescribed rest" }).success,
    ).toBe(true);
  });
  it("accepts an empty string (clears the note)", () => {
    expect(visitNoteSchema.safeParse({ notes: "" }).success).toBe(true);
  });
});
