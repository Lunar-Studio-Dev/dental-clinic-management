import { afterEach, describe, expect, it, vi } from "vitest";
import { clinicsRepo } from "~/lib/data/clinics";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("clinicsRepo.list", () => {
  it("GETs /api/clinics and returns the clinics array", async () => {
    const clinics = [
      { id: "clinic_1", name: "Clinic 1", address: "12 MG Road" },
      { id: "clinic_2", name: "Clinic 2", address: null },
    ];
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ clinics }) });
    vi.stubGlobal("fetch", fetchMock);

    const result = await clinicsRepo.list();

    expect(fetchMock).toHaveBeenCalledWith("/api/clinics");
    expect(result).toEqual(clinics);
  });

  it("throws when the response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );
    await expect(clinicsRepo.list()).rejects.toThrow();
  });
});
