// PURE KPI computation over already-fetched arrays. No Prisma import → trivially
// unit-testable and never drags the DB client anywhere. Prisma wiring lives in
// lib/metrics-queries.ts (getDashboardMetrics).
import {
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from "date-fns";
import type { MetricsDTO, VisitListItem } from "~/lib/data/types";

export interface MetricsInput {
  patients: { id: string; createdAt: string; visitCount: number }[];
  visits: VisitListItem[]; // all visits for the clinic
  clinics: { id: string; name: string; patientCount: number }[];
}

const RECENT_LIMIT = 8;

export function computeMetrics(data: MetricsInput, now: Date): MetricsDTO {
  const { patients, visits, clinics } = data;
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const at = (v: VisitListItem) => new Date(v.visitedAt);

  const totalPatients = patients.length;
  const returningPatients = patients.filter((p) => p.visitCount >= 2).length;
  const newPatientsToday = patients.filter(
    (p) => new Date(p.createdAt) >= todayStart,
  ).length;
  const repeatVisitPct = totalPatients
    ? Math.round((returningPatients / totalPatients) * 100)
    : 0;

  const visitsToday = visits.filter((v) => at(v) >= todayStart).length;
  const visitsThisWeek = visits.filter((v) => at(v) >= weekStart).length;
  const visitsThisMonth = visits.filter((v) => at(v) >= monthStart).length;
  const patientsSeenToday = new Set(
    visits.filter((v) => at(v) >= todayStart).map((v) => v.patientId),
  ).size;

  const weeklyVisitTrend: MetricsDTO["weeklyVisitTrend"] = [];
  for (let i = 6; i >= 0; i--) {
    const day = subDays(now, i);
    weeklyVisitTrend.push({
      day: format(day, "EEE"),
      count: visits.filter((v) => isSameDay(at(v), day)).length,
    });
  }

  const monthlyPatientCounts: MetricsDTO["monthlyPatientCounts"] = [];
  for (let i = 5; i >= 0; i--) {
    const month = subMonths(now, i);
    const seen = new Set(
      visits.filter((v) => isSameMonth(at(v), month)).map((v) => v.patientId),
    );
    monthlyPatientCounts.push({
      month: format(month, "MMM"),
      count: seen.size,
    });
  }

  const clinicWisePatients = clinics.map((c) => ({
    clinicId: c.id,
    name: c.name,
    count: c.patientCount,
  }));

  const recentVisits = [...visits]
    .sort((a, b) => at(b).getTime() - at(a).getTime())
    .slice(0, RECENT_LIMIT);

  return {
    totalPatients,
    newPatientsToday,
    returningPatients,
    repeatVisitPct,
    visitsToday,
    visitsThisWeek,
    visitsThisMonth,
    patientsSeenToday,
    weeklyVisitTrend,
    monthlyPatientCounts,
    clinicWisePatients,
    newVsReturning: {
      new: totalPatients - returningPatients,
      returning: returningPatients,
    },
    recentVisits,
  };
}
