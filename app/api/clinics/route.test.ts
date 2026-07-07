import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const findManyMock = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({ auth: () => authMock() }));
vi.mock("~/lib/prisma", () => ({
  prisma: {
    clinic: { findMany: (...args: unknown[]) => findManyMock(...args) },
  },
}));

import { GET } from "~/app/api/clinics/route";

beforeEach(() => {
  authMock.mockReset();
  findManyMock.mockReset();
});

describe("GET /api/clinics", () => {
  it("returns { clinics } for an authenticated user", async () => {
    authMock.mockResolvedValue({ userId: "user_1" });
    const clinics = [
      { id: "clinic_1", name: "Clinic 1", address: "12 MG Road" },
      { id: "clinic_2", name: "Clinic 2", address: null },
    ];
    findManyMock.mockResolvedValue(clinics);

    const res = await GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ clinics });
    // sorted by name, only DTO fields selected
    expect(findManyMock).toHaveBeenCalledWith({
      orderBy: { name: "asc" },
      select: { id: true, name: true, address: true },
    });
  });

  it("responds 401 when unauthenticated", async () => {
    authMock.mockResolvedValue({ userId: null });
    const res = await GET();
    expect(res.status).toBe(401);
    expect(findManyMock).not.toHaveBeenCalled();
  });
});
