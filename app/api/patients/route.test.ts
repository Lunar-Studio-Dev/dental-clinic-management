import { beforeEach, describe, expect, it, vi } from "vitest";

const scopeMock = vi.fn();
const findManyMock = vi.fn();
const createMock = vi.fn();

vi.mock("~/lib/clinic-scope", () => ({
  resolveClinicScope: (...a: unknown[]) => scopeMock(...a),
}));
vi.mock("~/lib/prisma", () => ({
  prisma: {
    patient: {
      findMany: (...a: unknown[]) => findManyMock(...a),
      create: (...a: unknown[]) => createMock(...a),
    },
  },
}));

import { GET, POST } from "~/app/api/patients/route";

function row(id: string, name: string) {
  return {
    id,
    name,
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
    _count: { visits: 3 },
  };
}

const okScope = { ok: true, clinicId: "clinic_1", role: "receptionist" };

beforeEach(() => {
  scopeMock.mockReset();
  findManyMock.mockReset();
  createMock.mockReset();
  scopeMock.mockResolvedValue(okScope);
});

describe("GET /api/patients", () => {
  it("propagates a scope failure (e.g. 401/403)", async () => {
    scopeMock.mockResolvedValue({ ok: false, status: 403, message: "no" });
    const res = await GET(
      new Request("http://x/api/patients?clinicId=clinic_2"),
    );
    expect(res.status).toBe(403);
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("scopes to the resolved clinic and returns serialized patients", async () => {
    findManyMock.mockResolvedValue([row("p1", "Asha")]);
    const res = await GET(
      new Request("http://x/api/patients?clinicId=clinic_1"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.patients[0]).toMatchObject({ id: "p1", visitCount: 3 });
    expect(body.nextCursor).toBeNull();
    expect(findManyMock.mock.calls[0][0].where.firstClinicId).toBe("clinic_1");
    // scope is called with the requested clinicId from the query
    expect(scopeMock).toHaveBeenCalledWith("clinic_1");
  });

  it("adds an OR name/phone filter when q is present", async () => {
    findManyMock.mockResolvedValue([]);
    await GET(new Request("http://x/api/patients?clinicId=clinic_1&q=asha"));
    const where = findManyMock.mock.calls[0][0].where;
    expect(JSON.stringify(where.OR)).toContain("asha");
  });

  it("returns a nextCursor when there are more than a page", async () => {
    findManyMock.mockResolvedValue(
      Array.from({ length: 21 }, (_, i) => row(`p${i}`, `N${i}`)),
    );
    const res = await GET(
      new Request("http://x/api/patients?clinicId=clinic_1"),
    );
    const body = await res.json();
    expect(body.patients).toHaveLength(20);
    expect(body.nextCursor).toBe("p19");
  });
});

describe("POST /api/patients", () => {
  it("400 on invalid body (before scope)", async () => {
    const res = await POST(
      new Request("http://x/api/patients", {
        method: "POST",
        body: JSON.stringify({ name: "" }),
      }),
    );
    expect(res.status).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("propagates a scope failure (403 cross-clinic)", async () => {
    scopeMock.mockResolvedValue({ ok: false, status: 403, message: "no" });
    const res = await POST(
      new Request("http://x/api/patients", {
        method: "POST",
        body: JSON.stringify({
          name: "X",
          gender: "MALE",
          contactNumber: "9812345678",
          firstClinicId: "clinic_2",
          ageYears: 25,
        }),
      }),
    );
    expect(res.status).toBe(403);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("creates with the clinic stamped from scope (not the body)", async () => {
    scopeMock.mockResolvedValue({
      ok: true,
      clinicId: "clinic_1",
      role: "receptionist",
    });
    createMock.mockResolvedValue(row("new1", "New Patient"));
    const res = await POST(
      new Request("http://x/api/patients", {
        method: "POST",
        body: JSON.stringify({
          name: "New Patient",
          gender: "MALE",
          contactNumber: "9812345678",
          firstClinicId: "clinic_9", // forged; must be overridden
          ageYears: 25,
        }),
      }),
    );
    expect(res.status).toBe(201);
    expect(createMock.mock.calls[0][0].data.firstClinicId).toBe("clinic_1");
  });
});
