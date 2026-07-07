import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const findManyMock = vi.fn();
const countMock = vi.fn();
const createMock = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({ auth: () => authMock() }));
vi.mock("~/lib/prisma", () => ({
  prisma: {
    visit: {
      findMany: (...a: unknown[]) => findManyMock(...a),
      count: (...a: unknown[]) => countMock(...a),
      create: (...a: unknown[]) => createMock(...a),
    },
  },
}));

import { GET, POST } from "~/app/api/visits/route";

function visitRow(id: string, name = "Asha") {
  return {
    id,
    patientId: "p1",
    clinicId: "clinic_1",
    type: "FOLLOW_UP",
    reason: "Fever",
    notes: null,
    visitedAt: new Date("2026-07-01T09:00:00Z"),
    patient: { name },
  };
}

beforeEach(() => {
  authMock.mockReset();
  findManyMock.mockReset();
  countMock.mockReset();
  createMock.mockReset();
  authMock.mockResolvedValue({ userId: "user_1" });
});

describe("GET /api/visits", () => {
  it("401 when unauthenticated", async () => {
    authMock.mockResolvedValue({ userId: null });
    const res = await GET(new Request("http://x/api/visits?clinicId=clinic_1"));
    expect(res.status).toBe(401);
  });

  it("400 when clinicId is missing", async () => {
    const res = await GET(new Request("http://x/api/visits"));
    expect(res.status).toBe(400);
  });

  it("range=today adds a visitedAt lower bound and maps patientName", async () => {
    findManyMock.mockResolvedValue([visitRow("v1", "Asha Mehta")]);
    const res = await GET(
      new Request("http://x/api/visits?clinicId=clinic_1&range=today"),
    );
    const body = await res.json();
    expect(body.visits[0]).toMatchObject({
      id: "v1",
      patientName: "Asha Mehta",
    });
    const where = findManyMock.mock.calls[0][0].where;
    expect(where.clinicId).toBe("clinic_1");
    expect(where.visitedAt?.gte).toBeInstanceOf(Date);
  });

  it("range=recent has no date bound", async () => {
    findManyMock.mockResolvedValue([]);
    await GET(
      new Request("http://x/api/visits?clinicId=clinic_1&range=recent"),
    );
    const where = findManyMock.mock.calls[0][0].where;
    expect(where.visitedAt).toBeUndefined();
  });
});

describe("POST /api/visits", () => {
  it("400 on invalid body", async () => {
    const res = await POST(
      new Request("http://x/api/visits", {
        method: "POST",
        body: JSON.stringify({ patientId: "p1" }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("derives type NEW when the patient has no prior visits", async () => {
    countMock.mockResolvedValue(0);
    createMock.mockResolvedValue(visitRow("v9"));
    const res = await POST(
      new Request("http://x/api/visits", {
        method: "POST",
        body: JSON.stringify({
          patientId: "p1",
          clinicId: "clinic_1",
          reason: "Fever",
        }),
      }),
    );
    expect(res.status).toBe(201);
    expect(createMock.mock.calls[0][0].data.type).toBe("NEW");
  });

  it("derives type FOLLOW_UP when the patient has prior visits", async () => {
    countMock.mockResolvedValue(3);
    createMock.mockResolvedValue(visitRow("v10"));
    await POST(
      new Request("http://x/api/visits", {
        method: "POST",
        body: JSON.stringify({
          patientId: "p1",
          clinicId: "clinic_1",
          reason: "Review",
        }),
      }),
    );
    expect(createMock.mock.calls[0][0].data.type).toBe("FOLLOW_UP");
  });
});
