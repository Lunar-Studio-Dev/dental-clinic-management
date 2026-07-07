import { beforeEach, describe, expect, it, vi } from "vitest";

const scopeMock = vi.fn();
const getMetricsMock = vi.fn();

vi.mock("~/lib/clinic-scope", () => ({
  resolveClinicScope: (...a: unknown[]) => scopeMock(...a),
}));
vi.mock("~/lib/metrics-queries", () => ({
  getDashboardMetrics: (...a: unknown[]) => getMetricsMock(...a),
}));

import { GET } from "~/app/api/metrics/route";

beforeEach(() => {
  scopeMock.mockReset();
  getMetricsMock.mockReset();
  scopeMock.mockResolvedValue({
    ok: true,
    clinicId: "clinic_1",
    role: "receptionist",
  });
});

describe("GET /api/metrics", () => {
  it("propagates a scope failure", async () => {
    scopeMock.mockResolvedValue({ ok: false, status: 403, message: "no" });
    const res = await GET(
      new Request("http://x/api/metrics?clinicId=clinic_2"),
    );
    expect(res.status).toBe(403);
    expect(getMetricsMock).not.toHaveBeenCalled();
  });

  it("computes metrics for the resolved clinic", async () => {
    getMetricsMock.mockResolvedValue({ totalPatients: 48 });
    const res = await GET(
      new Request("http://x/api/metrics?clinicId=clinic_1"),
    );
    expect(res.status).toBe(200);
    expect(getMetricsMock).toHaveBeenCalledWith("clinic_1");
    expect((await res.json()).totalPatients).toBe(48);
  });
});
