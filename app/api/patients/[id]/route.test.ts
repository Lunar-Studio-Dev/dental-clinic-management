import { beforeEach, describe, expect, it, vi } from "vitest";

const scopeMock = vi.fn();
const findUniqueMock = vi.fn();
const updateMock = vi.fn();

vi.mock("~/lib/clinic-scope", () => ({
  resolveClinicScope: (...a: unknown[]) => scopeMock(...a),
}));
vi.mock("~/lib/prisma", () => ({
  prisma: {
    patient: {
      findUnique: (...a: unknown[]) => findUniqueMock(...a),
      update: (...a: unknown[]) => updateMock(...a),
    },
  },
}));

import { GET, PATCH } from "~/app/api/patients/[id]/route";

const patientRow = {
  id: "p1",
  name: "Asha",
  dateOfBirth: null,
  ageYears: 30,
  gender: "FEMALE",
  contactNumber: "9810000000",
  address: null,
  medicalHistory: null,
  allergies: null,
  bloodGroup: "UNKNOWN",
  firstClinicId: "clinic_1",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};
const visitRow = {
  id: "v1",
  patientId: "p1",
  clinicId: "clinic_1",
  type: "NEW",
  reason: "Fever",
  notes: null,
  visitedAt: new Date("2026-07-01T09:00:00Z"),
};

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const okScope = { ok: true, clinicId: "clinic_1", role: "receptionist" };

beforeEach(() => {
  scopeMock.mockReset();
  findUniqueMock.mockReset();
  updateMock.mockReset();
  scopeMock.mockResolvedValue(okScope);
});

describe("GET /api/patients/[id]", () => {
  it("returns { patient, visits } within scope", async () => {
    findUniqueMock.mockResolvedValue({ ...patientRow, visits: [visitRow] });
    const res = await GET(new Request("http://x"), ctx("p1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.patient.id).toBe("p1");
    expect(body.visits).toHaveLength(1);
    expect(scopeMock).toHaveBeenCalledWith("clinic_1"); // the patient's clinic
  });

  it("404 when the patient is missing (before scope)", async () => {
    findUniqueMock.mockResolvedValue(null);
    const res = await GET(new Request("http://x"), ctx("nope"));
    expect(res.status).toBe(404);
    expect(scopeMock).not.toHaveBeenCalled();
  });

  it("403 when the patient is outside the caller's clinic", async () => {
    findUniqueMock.mockResolvedValue({ ...patientRow, visits: [] });
    scopeMock.mockResolvedValue({ ok: false, status: 403, message: "no" });
    const res = await GET(new Request("http://x"), ctx("p1"));
    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/patients/[id]", () => {
  it("404 when the patient is missing", async () => {
    findUniqueMock.mockResolvedValue(null);
    const res = await PATCH(
      new Request("http://x", {
        method: "PATCH",
        body: JSON.stringify({ name: "Z" }),
      }),
      ctx("nope"),
    );
    expect(res.status).toBe(404);
  });

  it("400 on invalid body", async () => {
    findUniqueMock.mockResolvedValue({ firstClinicId: "clinic_1" });
    const res = await PATCH(
      new Request("http://x", {
        method: "PATCH",
        body: JSON.stringify({ contactNumber: "1" }),
      }),
      ctx("p1"),
    );
    expect(res.status).toBe(400);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("updates and returns the patient within scope", async () => {
    findUniqueMock.mockResolvedValue({ firstClinicId: "clinic_1" });
    updateMock.mockResolvedValue({
      ...patientRow,
      contactNumber: "9899999999",
    });
    const res = await PATCH(
      new Request("http://x", {
        method: "PATCH",
        body: JSON.stringify({ contactNumber: "9899999999" }),
      }),
      ctx("p1"),
    );
    expect(res.status).toBe(200);
    expect(updateMock).toHaveBeenCalledOnce();
  });

  it("403 when the patient is outside the caller's clinic", async () => {
    findUniqueMock.mockResolvedValue({ firstClinicId: "clinic_2" });
    scopeMock.mockResolvedValue({ ok: false, status: 403, message: "no" });
    const res = await PATCH(
      new Request("http://x", {
        method: "PATCH",
        body: JSON.stringify({ name: "Z" }),
      }),
      ctx("p1"),
    );
    expect(res.status).toBe(403);
    expect(updateMock).not.toHaveBeenCalled();
  });
});
