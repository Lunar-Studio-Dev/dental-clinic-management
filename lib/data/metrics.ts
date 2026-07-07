// Metrics repository — typed stub. Implemented in Phase 4 (dashboards & KPIs).
export interface DashboardMetrics {
  totalPatients: number;
  newToday: number;
  returningPct: number;
  visitsToday: number;
  visitsThisWeek: number;
  visitsThisMonth: number;
}

const NOT_YET = "metricsRepo: implemented in Phase 4";

export const metricsRepo = {
  dashboard: (_clinicId: string): Promise<DashboardMetrics> => {
    throw new Error(NOT_YET);
  },
};
