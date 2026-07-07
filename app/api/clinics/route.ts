import { auth } from "@clerk/nextjs/server";
import { prisma } from "~/lib/prisma";
import { requireDoctor } from "~/lib/require-doctor";
import { clinicCreateSchema } from "~/lib/schemas";

const CLINIC_SELECT = { id: true, name: true, address: true } as const;

// GET /api/clinics → { clinics: ClinicDTO[] } (all authed roles read).
export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const clinics = await prisma.clinic.findMany({
    orderBy: { name: "asc" },
    select: CLINIC_SELECT,
  });
  return Response.json({ clinics });
}

// POST /api/clinics → create a clinic (doctor only).
export async function POST(req: Request) {
  const gate = await requireDoctor();
  if (!gate.ok) return new Response(gate.message, { status: gate.status });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const parsed = clinicCreateSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const created = await prisma.clinic.create({
    data: { name: parsed.data.name, address: parsed.data.address ?? null },
    select: CLINIC_SELECT,
  });
  return Response.json(created, { status: 201 });
}
