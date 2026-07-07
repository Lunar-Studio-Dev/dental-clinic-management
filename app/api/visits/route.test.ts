import { beforeEach, describe, expect, it, vi } from "vitest";

const scopeMock = vi.fn();
const findManyMock = vi.fn();
const countMock = vi.fn();
const createMock = vi.fn();

vi.mock("~/lib/clinic-scope", () => ({
  resolveClinicScope: (...a: unknown[]) => scopeMock(...a),
}));
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

const okScope = { ok: true, clinicId: "clinic_1", role: "receptionist" };

beforeEach(() => {
  scopeMock.mockReset();
  findManyMock.mockReset();
  countMock.mockReset();
  createMock.mockReset();
  scopeMock.mockResolvedValue(okScope);
});

describe("GET /api/visits", () => {
  it("propagates a scope failure", async () => {
    scopeMock.mockResolvedValue({ ok: false, status: 403, message: "no" });
    const res = await GET(new Request("http://x/api/visits?clinicId=clinic_2"));
    expect(res.status).toBe(403);
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("range=today scopes to the resolved clinic + a date bound", async () => {
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
    expect(findManyMock.mock.calls[0][0].where.visitedAt).toBeUndefined();
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

  it("propagates a scope failure (403 cross-clinic)", async () => {
    scopeMock.mockResolvedValue({ ok: false, status: 403, message: "no" });
    const res = await POST(
      new Request("http://x/api/visits", {
        method: "POST",
        body: JSON.stringify({
          patientId: "p1",
          clinicId: "clinic_2",
          reason: "Fever",
        }),
      }),
    );
    expect(res.status).toBe(403);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("derives NEW/FOLLOW_UP and stamps the scoped clinic", async () => {
    countMock.mockResolvedValue(0);
    createMock.mockResolvedValue(visitRow("v9"));
    await POST(
      new Request("http://x/api/visits", {
        method: "POST",
        body: JSON.stringify({
          patientId: "p1",
          clinicId: "clinic_9",
          reason: "Fever",
        }),
      }),
    );
    expect(createMock.mock.calls[0][0].data.type).toBe("NEW");
    expect(createMock.mock.calls[0][0].data.clinicId).toBe("clinic_1"); // from scope

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
    expect(createMock.mock.calls[1][0].data.type).toBe("FOLLOW_UP");
  });
});
