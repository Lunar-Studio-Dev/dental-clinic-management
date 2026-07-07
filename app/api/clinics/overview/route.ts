import { startOfToday } from "date-fns";
import { prisma } from "~/lib/prisma";
import { requireDoctor } from "~/lib/require-doctor";

// GET /api/clinics/overview → clinics with stats + assigned staff (doctor only).
export async function GET() {
  const gate = await requireDoctor();
  if (!gate.ok) return new Response(gate.message, { status: gate.status });

  const clinics = await prisma.clinic.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      address: true,
      _count: { select: { patients: true, visits: true } },
      staff: { select: { name: true, role: true } },
    },
  });

  const todayGroups = await prisma.visit.groupBy({
    by: ["clinicId"],
    where: { visitedAt: { gte: startOfToday() } },
    _count: { _all: true },
  });
  const todayByClinic = new Map(
    todayGroups.map((g) => [g.clinicId, g._count._all]),
  );

  const overview = clinics.map((c) => ({
    id: c.id,
    name: c.name,
    address: c.address,
    patientCount: c._count.patients,
    visitCount: c._count.visits,
    todayVisits: todayByClinic.get(c.id) ?? 0,
    staff: c.staff,
  }));

  return Response.json({ clinics: overview });
}
