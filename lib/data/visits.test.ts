import { afterEach, describe, expect, it, vi } from "vitest";
import { visitsRepo } from "~/lib/data/visits";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function mockFetch(body: unknown) {
  const m = vi
    .fn()
    .mockResolvedValue({ ok: true, status: 200, json: async () => body });
  vi.stubGlobal("fetch", m);
  return m;
}

describe("visitsRepo.list", () => {
  it("builds /api/visits with clinicId + range", async () => {
    const f = mockFetch({ visits: [] });
    await visitsRepo.list({ clinicId: "clinic_1", range: "today" });
    const url = f.mock.calls[0][0] as string;
    expect(url).toContain("/api/visits?");
    expect(url).toContain("clinicId=clinic_1");
    expect(url).toContain("range=today");
  });
});

describe("visitsRepo.create", () => {
  it("POSTs the visit to /api/visits", async () => {
    const f = mockFetch({ id: "v1" });
    await visitsRepo.create({
      patientId: "p1",
      clinicId: "clinic_1",
      reason: "Fever",
    });
    expect(f.mock.calls[0][0]).toBe("/api/visits");
    const opts = f.mock.calls[0][1] as RequestInit;
    expect(opts.method).toBe("POST");
    expect(JSON.parse(opts.body as string)).toMatchObject({ patientId: "p1" });
  });
});

describe("visitsRepo.addNote", () => {
  it("PATCHes /api/visits/{id} with { notes }", async () => {
    const f = mockFetch({ id: "v1", notes: "hi" });
    await visitsRepo.addNote("v1", "hi");
    expect(f.mock.calls[0][0]).toBe("/api/visits/v1");
    const opts = f.mock.calls[0][1] as RequestInit;
    expect(opts.method).toBe("PATCH");
    expect(JSON.parse(opts.body as string)).toEqual({ notes: "hi" });
  });
});
