// Server-only: fetch the arrays computeMetrics needs, then delegate to the pure fn.
import type { MetricsDTO } from "~/lib/data/types";
import { computeMetrics, type MetricsInput } from "~/lib/metrics";
import { prisma } from "~/lib/prisma";
import { toVisitListItem } from "~/lib/serialize";

export async function getDashboardMetrics(
  clinicId: string,
): Promise<MetricsDTO> {
  const [patientRows, visitRows, clinicRows] = await Promise.all([
    prisma.patient.findMany({
      where: { firstClinicId: clinicId },
      select: {
        id: true,
        createdAt: true,
        _count: { select: { visits: true } },
      },
    }),
    prisma.visit.findMany({
      where: { clinicId },
      orderBy: { visitedAt: "desc" },
      include: { patient: { select: { name: true } } },
    }),
    prisma.clinic.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, _count: { select: { patients: true } } },
    }),
  ]);

  const input: MetricsInput = {
    patients: patientRows.map((p) => ({
      id: p.id,
      createdAt: p.createdAt.toISOString(),
      visitCount: p._count.visits,
    })),
    visits: visitRows.map(toVisitListItem),
    clinics: clinicRows.map((c) => ({
      id: c.id,
      name: c.name,
      patientCount: c._count.patients,
    })),
  };

  return computeMetrics(input, new Date());
}
