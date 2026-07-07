import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const doctorMock = vi.fn();
const findManyMock = vi.fn();
const createMock = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({ auth: () => authMock() }));
vi.mock("~/lib/require-doctor", () => ({ requireDoctor: () => doctorMock() }));
vi.mock("~/lib/prisma", () => ({
  prisma: {
    clinic: {
      findMany: (...a: unknown[]) => findManyMock(...a),
      create: (...a: unknown[]) => createMock(...a),
    },
  },
}));

import { GET, POST } from "~/app/api/clinics/route";

beforeEach(() => {
  authMock.mockReset();
  doctorMock.mockReset();
  findManyMock.mockReset();
  createMock.mockReset();
  authMock.mockResolvedValue({ userId: "user_1" });
  doctorMock.mockResolvedValue({ ok: true, userId: "doc_1" });
});

describe("GET /api/clinics", () => {
  it("401 when unauthenticated", async () => {
    authMock.mockResolvedValue({ userId: null });
    expect((await GET()).status).toBe(401);
  });

  it("returns clinics for an authed user", async () => {
    findManyMock.mockResolvedValue([
      { id: "clinic_1", name: "Clinic 1", address: null },
    ]);
    const body = await (await GET()).json();
    expect(body.clinics[0].id).toBe("clinic_1");
  });
});

describe("POST /api/clinics", () => {
  it("403 for non-doctors", async () => {
    doctorMock.mockResolvedValue({ ok: false, status: 403, message: "no" });
    const res = await POST(
      new Request("http://x", {
        method: "POST",
        body: JSON.stringify({ name: "C3" }),
      }),
    );
    expect(res.status).toBe(403);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("400 on invalid body", async () => {
    const res = await POST(
      new Request("http://x", {
        method: "POST",
        body: JSON.stringify({ name: "" }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("creates a clinic for a doctor", async () => {
    createMock.mockResolvedValue({
      id: "clinic_3",
      name: "Clinic 3",
      address: "X",
    });
    const res = await POST(
      new Request("http://x", {
        method: "POST",
        body: JSON.stringify({ name: "Clinic 3", address: "X" }),
      }),
    );
    expect(res.status).toBe(201);
    expect((await res.json()).id).toBe("clinic_3");
  });
});
