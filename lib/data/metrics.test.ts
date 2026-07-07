import { afterEach, describe, expect, it, vi } from "vitest";
import { metricsRepo } from "~/lib/data/metrics";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("metricsRepo.dashboard", () => {
  it("GETs /api/metrics with the clinicId", async () => {
    const f = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ totalPatients: 5 }),
    });
    vi.stubGlobal("fetch", f);

    const r = await metricsRepo.dashboard("clinic_1");

    expect(f.mock.calls[0][0]).toBe("/api/metrics?clinicId=clinic_1");
    expect(r.totalPatients).toBe(5);
  });
});
