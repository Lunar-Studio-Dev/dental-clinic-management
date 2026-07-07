import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const staffFindUnique = vi.fn();
const staffUpdate = vi.fn();
const clinicFindFirst = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({ auth: () => authMock() }));
vi.mock("~/lib/prisma", () => ({
  prisma: {
    staff: {
      findUnique: (...a: unknown[]) => staffFindUnique(...a),
      update: (...a: unknown[]) => staffUpdate(...a),
    },
    clinic: { findFirst: (...a: unknown[]) => clinicFindFirst(...a) },
  },
}));

import { GET } from "~/app/api/me/clinic/route";

beforeEach(() => {
  authMock.mockReset();
  staffFindUnique.mockReset();
  staffUpdate.mockReset();
  clinicFindFirst.mockReset();
  authMock.mockResolvedValue({ userId: "user_1" });
});

describe("GET /api/me/clinic", () => {
  it("401 when unauthenticated", async () => {
    authMock.mockResolvedValue({ userId: null });
    expect((await GET()).status).toBe(401);
  });

  it("doctor → canSwitch true, no fixed clinic", async () => {
    staffFindUnique.mockResolvedValue({
      id: "user_1",
      role: "doctor",
      clinic: null,
    });
    const body = await (await GET()).json();
    expect(body).toMatchObject({
      role: "doctor",
      canSwitch: true,
      clinicId: null,
    });
  });

  it("receptionist assigned → canSwitch false + clinic name", async () => {
    staffFindUnique.mockResolvedValue({
      id: "user_1",
      role: "receptionist",
      clinicId: "clinic_1",
      clinic: { id: "clinic_1", name: "Clinic 1" },
    });
    const body = await (await GET()).json();
    expect(body).toMatchObject({
      role: "receptionist",
      canSwitch: false,
      clinicId: "clinic_1",
      clinicName: "Clinic 1",
    });
  });

  it("receptionist unassigned → auto-assigns the default clinic", async () => {
    staffFindUnique.mockResolvedValue({
      id: "user_1",
      role: "receptionist",
      clinicId: null,
      clinic: null,
    });
    clinicFindFirst.mockResolvedValue({ id: "clinic_1", name: "Clinic 1" });
    staffUpdate.mockResolvedValue({});
    const body = await (await GET()).json();
    expect(staffUpdate).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: { clinicId: "clinic_1" },
    });
    expect(body).toMatchObject({
      clinicId: "clinic_1",
      clinicName: "Clinic 1",
    });
  });
});
