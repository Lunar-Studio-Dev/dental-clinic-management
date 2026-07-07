import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const getRoleMock = vi.fn();
const updateMock = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({ auth: () => authMock() }));
vi.mock("~/lib/auth", () => ({ getRole: () => getRoleMock() }));
vi.mock("~/lib/prisma", () => ({
  prisma: { visit: { update: (...a: unknown[]) => updateMock(...a) } },
}));

import { PATCH } from "~/app/api/visits/[id]/route";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const body = (notes: unknown) =>
  new Request("http://x", { method: "PATCH", body: JSON.stringify({ notes }) });

const visitRow = {
  id: "v1",
  patientId: "p1",
  clinicId: "clinic_1",
  type: "NEW",
  reason: "Fever",
  notes: "updated",
  visitedAt: new Date("2026-07-01T09:00:00Z"),
};

beforeEach(() => {
  authMock.mockReset();
  getRoleMock.mockReset();
  updateMock.mockReset();
  authMock.mockResolvedValue({ userId: "user_1" });
  getRoleMock.mockResolvedValue("doctor");
});

describe("PATCH /api/visits/[id]", () => {
  it("401 when unauthenticated", async () => {
    authMock.mockResolvedValue({ userId: null });
    const res = await PATCH(body("x"), ctx("v1"));
    expect(res.status).toBe(401);
  });

  it("403 when the role is not doctor", async () => {
    getRoleMock.mockResolvedValue("receptionist");
    const res = await PATCH(body("x"), ctx("v1"));
    expect(res.status).toBe(403);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("400 on invalid body", async () => {
    const res = await PATCH(
      new Request("http://x", { method: "PATCH", body: JSON.stringify({}) }),
      ctx("v1"),
    );
    expect(res.status).toBe(400);
  });

  it("updates the note when doctor", async () => {
    updateMock.mockResolvedValue(visitRow);
    const res = await PATCH(body("Prescribed rest"), ctx("v1"));
    expect(res.status).toBe(200);
    expect(updateMock.mock.calls[0][0].data.notes).toBe("Prescribed rest");
    const json = await res.json();
    expect(json.id).toBe("v1");
  });
});
