import { Prisma } from "~/lib/generated/prisma/client";
import { prisma } from "~/lib/prisma";
import { requireDoctor } from "~/lib/require-doctor";
import { staffAssignSchema } from "~/lib/schemas";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/staff/[id]/assign → set a receptionist's clinic (doctor only).
// Setting Staff.clinicId (single) enforces one-clinic-per-receptionist; clinicId
// null clears the assignment.
export async function POST(req: Request, { params }: Ctx) {
  const gate = await requireDoctor();
  if (!gate.ok) return new Response(gate.message, { status: gate.status });

  const { id } = await params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const parsed = staffAssignSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Validate the target clinic exists (when assigning).
  if (parsed.data.clinicId) {
    const clinic = await prisma.clinic.findUnique({
      where: { id: parsed.data.clinicId },
      select: { id: true },
    });
    if (!clinic) return new Response("Clinic not found", { status: 400 });
  }

  try {
    const updated = await prisma.staff.update({
      where: { id },
      data: { clinicId: parsed.data.clinicId },
      select: { id: true, name: true, clinicId: true, role: true },
    });
    return Response.json(updated);
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return new Response("Staff not found", { status: 404 });
    }
    throw err;
  }
}
