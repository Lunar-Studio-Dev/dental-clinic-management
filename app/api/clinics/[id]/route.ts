import { Prisma } from "~/lib/generated/prisma/client";
import { prisma } from "~/lib/prisma";
import { requireDoctor } from "~/lib/require-doctor";
import { clinicUpdateSchema } from "~/lib/schemas";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/clinics/[id] → edit clinic name/address (doctor only).
export async function PATCH(req: Request, { params }: Ctx) {
  const gate = await requireDoctor();
  if (!gate.ok) return new Response(gate.message, { status: gate.status });

  const { id } = await params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const parsed = clinicUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data: Prisma.ClinicUpdateInput = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.address !== undefined) data.address = parsed.data.address;

  try {
    const updated = await prisma.clinic.update({
      where: { id },
      data,
      select: { id: true, name: true, address: true },
    });
    return Response.json(updated);
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return new Response("Not found", { status: 404 });
    }
    throw err;
  }
}
