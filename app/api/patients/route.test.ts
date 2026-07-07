import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const findManyMock = vi.fn();
const createMock = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({ auth: () => authMock() }));
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

beforeEach(() => {
  authMock.mockReset();
  findManyMock.mockReset();
  createMock.mockReset();
  authMock.mockResolvedValue({ userId: "user_1" });
});

describe("GET /api/patients", () => {
  it("401 when unauthenticated", async () => {
    authMock.mockResolvedValue({ userId: null });
    const res = await GET(
      new Request("http://x/api/patients?clinicId=clinic_1"),
    );
    expect(res.status).toBe(401);
  });

  it("400 when clinicId is missing", async () => {
    const res = await GET(new Request("http://x/api/patients"));
    expect(res.status).toBe(400);
  });

  it("scopes to firstClinicId and returns serialized patients", async () => {
    findManyMock.mockResolvedValue([row("p1", "Asha")]);
    const res = await GET(
      new Request("http://x/api/patients?clinicId=clinic_1"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.patients[0]).toMatchObject({
      id: "p1",
      firstClinicId: "clinic_1",
    });
    expect(typeof body.patients[0].createdAt).toBe("string");
    expect(body.patients[0].visitCount).toBe(3);
    expect(body.nextCursor).toBeNull();
    const where = findManyMock.mock.calls[0][0].where;
    expect(where.firstClinicId).toBe("clinic_1");
    expect(where.OR).toBeUndefined();
  });

  it("adds an OR name/phone filter when q is present", async () => {
    findManyMock.mockResolvedValue([]);
    await GET(new Request("http://x/api/patients?clinicId=clinic_1&q=asha"));
    const where = findManyMock.mock.calls[0][0].where;
    expect(Array.isArray(where.OR)).toBe(true);
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
  it("400 on invalid body", async () => {
    const res = await POST(
      new Request("http://x/api/patients", {
        method: "POST",
        body: JSON.stringify({ name: "" }),
      }),
    );
    expect(res.status).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("creates a patient and returns 201", async () => {
    createMock.mockResolvedValue(row("new1", "New Patient"));
    const res = await POST(
      new Request("http://x/api/patients", {
        method: "POST",
        body: JSON.stringify({
          name: "New Patient",
          gender: "MALE",
          contactNumber: "9812345678",
          firstClinicId: "clinic_1",
          ageYears: 25,
        }),
      }),
    );
    expect(res.status).toBe(201);
    expect(createMock).toHaveBeenCalledOnce();
    const body = await res.json();
    expect(body.id).toBe("new1");
  });
});
