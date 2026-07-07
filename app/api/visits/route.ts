import { startOfToday } from "date-fns";
import { resolveClinicScope } from "~/lib/clinic-scope";
import type { Prisma } from "~/lib/generated/prisma/client";
import { prisma } from "~/lib/prisma";
import { visitCreateSchema } from "~/lib/schemas";
import { toVisitDTO, toVisitListItem } from "~/lib/serialize";

const RECENT_LIMIT = 20;

// GET /api/visits?clinicId&range=today|recent → { visits: VisitListItem[] }
export async function GET(req: Request) {
  const url = new URL(req.url);
  const scope = await resolveClinicScope(url.searchParams.get("clinicId"));
  if (!scope.ok) return new Response(scope.message, { status: scope.status });

  const range = url.searchParams.get("range") ?? "recent";
  const where: Prisma.VisitWhereInput = { clinicId: scope.clinicId };
  if (range === "today") where.visitedAt = { gte: startOfToday() };

  const rows = await prisma.visit.findMany({
    where,
    orderBy: { visitedAt: "desc" },
    take: range === "today" ? 200 : RECENT_LIMIT,
    include: { patient: { select: { name: true } } },
  });

  return Response.json({ visits: rows.map(toVisitListItem) });
}

// POST /api/visits → 201 VisitDTO (clinic forced to scope; type server-derived)
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const parsed = visitCreateSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  const scope = await resolveClinicScope(d.clinicId);
  if (!scope.ok) return new Response(scope.message, { status: scope.status });

  const priorCount = await prisma.visit.count({
    where: { patientId: d.patientId },
  });
  const type = priorCount === 0 ? "NEW" : "FOLLOW_UP";

  const created = await prisma.visit.create({
    data: {
      patientId: d.patientId,
      clinicId: scope.clinicId, // stamped from scope, not trusted from body
      type,
      reason: d.reason,
      notes: d.notes ?? null,
      visitedAt: d.visitedAt ? new Date(d.visitedAt) : new Date(),
    },
  });

  return Response.json(toVisitDTO(created), { status: 201 });
}
