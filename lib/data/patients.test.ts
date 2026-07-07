import { afterEach, describe, expect, it, vi } from "vitest";
import { patientsRepo } from "~/lib/data/patients";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function mockFetch(body: unknown, ok = true, status = 200) {
  const m = vi.fn().mockResolvedValue({ ok, status, json: async () => body });
  vi.stubGlobal("fetch", m);
  return m;
}

describe("patientsRepo.list", () => {
  it("builds the query string and returns the result", async () => {
    const result = { patients: [], nextCursor: null };
    const f = mockFetch(result);
    const r = await patientsRepo.list({
      clinicId: "clinic_1",
      q: "asha",
      cursor: "p5",
    });
    expect(r).toEqual(result);
    const url = f.mock.calls[0][0] as string;
    expect(url).toContain("/api/patients?");
    expect(url).toContain("clinicId=clinic_1");
    expect(url).toContain("q=asha");
    expect(url).toContain("cursor=p5");
  });

  it("omits q and cursor when not provided", async () => {
    const f = mockFetch({ patients: [], nextCursor: null });
    await patientsRepo.list({ clinicId: "clinic_1" });
    const url = f.mock.calls[0][0] as string;
    expect(url).toContain("clinicId=clinic_1");
    expect(url).not.toContain("q=");
    expect(url).not.toContain("cursor=");
  });
});

describe("patientsRepo.get", () => {
  it("GETs /api/patients/{id}", async () => {
    const f = mockFetch({ patient: { id: "p1" }, visits: [] });
    const r = await patientsRepo.get("p1");
    expect(f.mock.calls[0][0]).toBe("/api/patients/p1");
    expect(r.patient.id).toBe("p1");
  });
});

describe("patientsRepo.create", () => {
  it("POSTs the body to /api/patients", async () => {
    const f = mockFetch({ id: "new1" });
    const input = {
      name: "X",
      gender: "MALE" as const,
      contactNumber: "9812345678",
      firstClinicId: "clinic_1",
      ageYears: 25,
      bloodGroup: "UNKNOWN" as const,
    };
    const r = await patientsRepo.create(input);
    expect(f.mock.calls[0][0]).toBe("/api/patients");
    const opts = f.mock.calls[0][1] as RequestInit;
    expect(opts.method).toBe("POST");
    expect(JSON.parse(opts.body as string)).toMatchObject({ name: "X" });
    expect((r as { id: string }).id).toBe("new1");
  });
});

describe("patientsRepo.update", () => {
  it("PATCHes /api/patients/{id}", async () => {
    const f = mockFetch({ id: "p1", contactNumber: "9899999999" });
    await patientsRepo.update("p1", { contactNumber: "9899999999" });
    expect(f.mock.calls[0][0]).toBe("/api/patients/p1");
    expect((f.mock.calls[0][1] as RequestInit).method).toBe("PATCH");
  });
});
