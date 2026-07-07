import { auth } from "@clerk/nextjs/server";
import { getRole } from "~/lib/auth";
import { Prisma } from "~/lib/generated/prisma/client";
import { prisma } from "~/lib/prisma";
import { visitNoteSchema } from "~/lib/schemas";
import { toVisitDTO } from "~/lib/serialize";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/visits/[id] → update the clinical note. DOCTOR ONLY.
export async function PATCH(req: Request, { params }: Ctx) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const role = await getRole();
  if (role !== "doctor") return new Response("Forbidden", { status: 403 });

  const { id } = await params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const parsed = visitNoteSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const updated = await prisma.visit.update({
      where: { id },
      data: { notes: parsed.data.notes },
    });
    return Response.json(toVisitDTO(updated));
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
