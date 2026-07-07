import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const findUniqueMock = vi.fn();
const updateMock = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({ auth: () => authMock() }));
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

beforeEach(() => {
  authMock.mockReset();
  findUniqueMock.mockReset();
  updateMock.mockReset();
  authMock.mockResolvedValue({ userId: "user_1" });
});

describe("GET /api/patients/[id]", () => {
  it("returns { patient, visits }", async () => {
    findUniqueMock.mockResolvedValue({ ...patientRow, visits: [visitRow] });
    const res = await GET(new Request("http://x"), ctx("p1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.patient.id).toBe("p1");
    expect(body.visits).toHaveLength(1);
    expect(body.visits[0].id).toBe("v1");
    expect(typeof body.visits[0].visitedAt).toBe("string");
  });

  it("404 when the patient is missing", async () => {
    findUniqueMock.mockResolvedValue(null);
    const res = await GET(new Request("http://x"), ctx("nope"));
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/patients/[id]", () => {
  it("400 on invalid body", async () => {
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

  it("updates and returns the patient", async () => {
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
    const body = await res.json();
    expect(body.contactNumber).toBe("9899999999");
  });
});
