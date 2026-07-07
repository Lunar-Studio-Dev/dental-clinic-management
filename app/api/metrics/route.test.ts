import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const getMetricsMock = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({ auth: () => authMock() }));
vi.mock("~/lib/metrics-queries", () => ({
  getDashboardMetrics: (...a: unknown[]) => getMetricsMock(...a),
}));

import { GET } from "~/app/api/metrics/route";

beforeEach(() => {
  authMock.mockReset();
  getMetricsMock.mockReset();
  authMock.mockResolvedValue({ userId: "user_1" });
});

describe("GET /api/metrics", () => {
  it("401 when unauthenticated", async () => {
    authMock.mockResolvedValue({ userId: null });
    const res = await GET(
      new Request("http://x/api/metrics?clinicId=clinic_1"),
    );
    expect(res.status).toBe(401);
  });

  it("400 when clinicId is missing", async () => {
    const res = await GET(new Request("http://x/api/metrics"));
    expect(res.status).toBe(400);
    expect(getMetricsMock).not.toHaveBeenCalled();
  });

  it("returns the metrics bundle for the clinic", async () => {
    getMetricsMock.mockResolvedValue({ totalPatients: 48, repeatVisitPct: 61 });
    const res = await GET(
      new Request("http://x/api/metrics?clinicId=clinic_1"),
    );
    expect(res.status).toBe(200);
    expect(getMetricsMock).toHaveBeenCalledWith("clinic_1");
    const body = await res.json();
    expect(body.totalPatients).toBe(48);
  });
});
