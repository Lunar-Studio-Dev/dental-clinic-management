import { beforeEach, describe, expect, it, vi } from "vitest";

const doctorMock = vi.fn();
const clinicFindUnique = vi.fn();
const staffUpdate = vi.fn();

vi.mock("~/lib/require-doctor", () => ({ requireDoctor: () => doctorMock() }));
vi.mock("~/lib/prisma", () => ({
  prisma: {
    clinic: { findUnique: (...a: unknown[]) => clinicFindUnique(...a) },
    staff: { update: (...a: unknown[]) => staffUpdate(...a) },
  },
}));

import { POST } from "~/app/api/staff/[id]/assign/route";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const body = (v: unknown) =>
  new Request("http://x", { method: "POST", body: JSON.stringify(v) });

beforeEach(() => {
  doctorMock.mockReset();
  clinicFindUnique.mockReset();
  staffUpdate.mockReset();
  doctorMock.mockResolvedValue({ ok: true, userId: "doc_1" });
});

describe("POST /api/staff/[id]/assign", () => {
  it("403 for non-doctors", async () => {
    doctorMock.mockResolvedValue({ ok: false, status: 403, message: "no" });
    const res = await POST(body({ clinicId: "clinic_1" }), ctx("s1"));
    expect(res.status).toBe(403);
    expect(staffUpdate).not.toHaveBeenCalled();
  });

  it("400 when the target clinic does not exist", async () => {
    clinicFindUnique.mockResolvedValue(null);
    const res = await POST(body({ clinicId: "ghost" }), ctx("s1"));
    expect(res.status).toBe(400);
    expect(staffUpdate).not.toHaveBeenCalled();
  });

  it("assigns the receptionist to a clinic (single clinicId ⇒ one per receptionist)", async () => {
    clinicFindUnique.mockResolvedValue({ id: "clinic_2" });
    staffUpdate.mockResolvedValue({
      id: "s1",
      name: "Sam",
      clinicId: "clinic_2",
      role: "receptionist",
    });
    const res = await POST(body({ clinicId: "clinic_2" }), ctx("s1"));
    expect(res.status).toBe(200);
    expect(staffUpdate).toHaveBeenCalledWith({
      where: { id: "s1" },
      data: { clinicId: "clinic_2" },
      select: expect.anything(),
    });
  });

  it("clears the assignment when clinicId is null (no clinic lookup)", async () => {
    staffUpdate.mockResolvedValue({
      id: "s1",
      name: "Sam",
      clinicId: null,
      role: "receptionist",
    });
    const res = await POST(body({ clinicId: null }), ctx("s1"));
    expect(res.status).toBe(200);
    expect(clinicFindUnique).not.toHaveBeenCalled();
    expect(staffUpdate.mock.calls[0][0].data.clinicId).toBeNull();
  });
});
