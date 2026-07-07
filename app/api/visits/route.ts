import { auth } from "@clerk/nextjs/server";
import { startOfToday } from "date-fns";
import type { Prisma } from "~/lib/generated/prisma/client";
import { prisma } from "~/lib/prisma";
import { visitCreateSchema } from "~/lib/schemas";
import { toVisitDTO, toVisitListItem } from "~/lib/serialize";

const RECENT_LIMIT = 20;

// GET /api/visits?clinicId&range=today|recent → { visits: VisitListItem[] }
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const url = new URL(req.url);
  const clinicId = url.searchParams.get("clinicId");
  if (!clinicId) return new Response("clinicId is required", { status: 400 });

  const range = url.searchParams.get("range") ?? "recent";
  const where: Prisma.VisitWhereInput = { clinicId };
  if (range === "today") where.visitedAt = { gte: startOfToday() };

  const rows = await prisma.visit.findMany({
    where,
    orderBy: { visitedAt: "desc" },
    take: range === "today" ? 200 : RECENT_LIMIT,
    include: { patient: { select: { name: true } } },
  });

  return Response.json({ visits: rows.map(toVisitListItem) });
}

// POST /api/visits → 201 VisitDTO (type derived: first-ever visit = NEW, else FOLLOW_UP)
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

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

  const priorCount = await prisma.visit.count({
    where: { patientId: d.patientId },
  });
  const type = priorCount === 0 ? "NEW" : "FOLLOW_UP";

  const created = await prisma.visit.create({
    data: {
      patientId: d.patientId,
      clinicId: d.clinicId,
      type,
      reason: d.reason,
      notes: d.notes ?? null,
      visitedAt: d.visitedAt ? new Date(d.visitedAt) : new Date(),
    },
  });

  return Response.json(toVisitDTO(created), { status: 201 });
}
