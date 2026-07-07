"use client";

import { CalendarPlus } from "lucide-react";
import { useState } from "react";
import { ErrorState } from "~/components/error-state";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { NewVisitDialog } from "~/components/visits/new-visit-dialog";
import { useClinics } from "~/lib/hooks/use-clinics";
import { useCurrentClinicId } from "~/lib/hooks/use-current-clinic";
import { useMetrics } from "~/lib/hooks/use-metrics";
import { ClinicDonut } from "./clinic-donut";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { KpiCard } from "./kpi-card";
import { MonthlyPatientsChart } from "./monthly-patients-chart";
import { RecentVisits } from "./recent-visits";

export function DoctorDashboard() {
  const { data: clinics } = useClinics();
  const clinicId = useCurrentClinicId(clinics ?? []);
  const { data: m, isLoading, isError, refetch } = useMetrics(clinicId);
  const [visitOpen, setVisitOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Doctor Dashboard</h1>
        <Button size="lg" onClick={() => setVisitOpen(true)}>
          <CalendarPlus data-icon="inline-start" />
          New Visit
        </Button>
      </div>

      {isError ? (
        <ErrorState title="Couldn't load dashboard" onRetry={() => refetch()} />
      ) : isLoading || !m ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <KpiCard label="Seen today" value={m.patientsSeenToday} />
            <KpiCard label="Repeat visits" value={`${m.repeatVisitPct}%`} />
            <KpiCard label="Total patients" value={m.totalPatients} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Monthly patients (6 mo)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MonthlyPatientsChart data={m.monthlyPatientCounts} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Clinic-wise patients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ClinicDonut data={m.clinicWisePatients} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent patient visits</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentVisits visits={m.recentVisits} />
            </CardContent>
          </Card>
        </>
      )}

      <NewVisitDialog
        open={visitOpen}
        onOpenChange={setVisitOpen}
        clinicId={clinicId}
      />
    </div>
  );
}
