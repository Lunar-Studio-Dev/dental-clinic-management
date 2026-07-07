import type { Prisma } from "~/lib/generated/prisma/client";
import { prisma } from "~/lib/prisma";
import { requireDoctor } from "~/lib/require-doctor";

// GET /api/staff?role=receptionist → staff list (doctor only) for the assignment UI.
export async function GET(req: Request) {
  const gate = await requireDoctor();
  if (!gate.ok) return new Response(gate.message, { status: gate.status });

  const role = new URL(req.url).searchParams.get("role");
  const where: Prisma.StaffWhereInput | undefined =
    role === "receptionist" || role === "doctor" ? { role } : undefined;

  const staff = await prisma.staff.findMany({
    where,
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true, clinicId: true },
  });
  return Response.json({ staff });
}
