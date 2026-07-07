// Metrics repository — hits /api/metrics (added in Phase 4).
import { getJson } from "~/lib/data/http";
import type { MetricsDTO } from "~/lib/data/types";

export const metricsRepo = {
  dashboard: (clinicId: string): Promise<MetricsDTO> =>
    getJson<MetricsDTO>(
      `/api/metrics?clinicId=${encodeURIComponent(clinicId)}`,
    ),
};
