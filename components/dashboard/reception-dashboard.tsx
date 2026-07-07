"use client";

import { ErrorState } from "~/components/error-state";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useClinics } from "~/lib/hooks/use-clinics";
import { useCurrentClinicId } from "~/lib/hooks/use-current-clinic";
import { useMetrics } from "~/lib/hooks/use-metrics";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { KpiCard } from "./kpi-card";
import { QuickActions } from "./quick-actions";
import { RecentVisits } from "./recent-visits";
import { WeeklyVisitsChart } from "./weekly-visits-chart";

export function ReceptionDashboard() {
  const { data: clinics } = useClinics();
  const clinicId = useCurrentClinicId(clinics ?? []);
  const { data: m, isLoading, isError, refetch } = useMetrics(clinicId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Reception Dashboard</h1>
        <QuickActions clinicId={clinicId} />
      </div>

      {isError ? (
        <ErrorState title="Couldn't load dashboard" onRetry={() => refetch()} />
      ) : isLoading || !m ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Total patients" value={m.totalPatients} />
            <KpiCard label="New today" value={m.newPatientsToday} />
            <KpiCard
              label="Returning"
              value={`${m.repeatVisitPct}%`}
              sub="of all patients"
            />
            <KpiCard label="Today's visits" value={m.visitsToday} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Visits this week</CardTitle>
              </CardHeader>
              <CardContent>
                <WeeklyVisitsChart data={m.weeklyVisitTrend} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent visits</CardTitle>
              </CardHeader>
              <CardContent>
                <RecentVisits visits={m.recentVisits} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
