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

import { resolveClinicScope } from "~/lib/clinic-scope";

beforeEach(() => {
  authMock.mockReset();
  staffFindUnique.mockReset();
  staffUpdate.mockReset();
  clinicFindFirst.mockReset();
  authMock.mockResolvedValue({ userId: "user_1" });
});

describe("resolveClinicScope", () => {
  it("401 when unauthenticated", async () => {
    authMock.mockResolvedValue({ userId: null });
    const r = await resolveClinicScope("clinic_1");
    expect(r).toMatchObject({ ok: false, status: 401 });
  });

  it("403 when there is no staff record", async () => {
    staffFindUnique.mockResolvedValue(null);
    const r = await resolveClinicScope("clinic_1");
    expect(r).toMatchObject({ ok: false, status: 403 });
  });

  it("doctor: honors the requested clinic", async () => {
    staffFindUnique.mockResolvedValue({
      id: "user_1",
      role: "doctor",
      clinicId: null,
    });
    const r = await resolveClinicScope("clinic_2");
    expect(r).toEqual({ ok: true, clinicId: "clinic_2", role: "doctor" });
  });

  it("doctor: 400 when no clinic requested", async () => {
    staffFindUnique.mockResolvedValue({
      id: "user_1",
      role: "doctor",
      clinicId: null,
    });
    const r = await resolveClinicScope(null);
    expect(r).toMatchObject({ ok: false, status: 400 });
  });

  it("receptionist: forces their assigned clinic when none requested", async () => {
    staffFindUnique.mockResolvedValue({
      id: "user_1",
      role: "receptionist",
      clinicId: "clinic_1",
    });
    const r = await resolveClinicScope(null);
    expect(r).toEqual({ ok: true, clinicId: "clinic_1", role: "receptionist" });
  });

  it("receptionist: allows a request for their own clinic", async () => {
    staffFindUnique.mockResolvedValue({
      id: "user_1",
      role: "receptionist",
      clinicId: "clinic_1",
    });
    const r = await resolveClinicScope("clinic_1");
    expect(r).toMatchObject({ ok: true, clinicId: "clinic_1" });
  });

  it("receptionist: 403 when requesting another clinic", async () => {
    staffFindUnique.mockResolvedValue({
      id: "user_1",
      role: "receptionist",
      clinicId: "clinic_1",
    });
    const r = await resolveClinicScope("clinic_2");
    expect(r).toMatchObject({ ok: false, status: 403 });
  });

  it("receptionist unassigned: auto-assigns the earliest clinic and persists it", async () => {
    staffFindUnique.mockResolvedValue({
      id: "user_1",
      role: "receptionist",
      clinicId: null,
    });
    clinicFindFirst.mockResolvedValue({ id: "clinic_1" });
    staffUpdate.mockResolvedValue({});
    const r = await resolveClinicScope(null);
    expect(clinicFindFirst).toHaveBeenCalledWith({
      orderBy: { createdAt: "asc" },
    });
    expect(staffUpdate).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: { clinicId: "clinic_1" },
    });
    expect(r).toMatchObject({ ok: true, clinicId: "clinic_1" });
  });
});
