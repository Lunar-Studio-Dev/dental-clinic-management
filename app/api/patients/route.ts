import { auth } from "@clerk/nextjs/server";
import type { Prisma } from "~/lib/generated/prisma/client";
import { prisma } from "~/lib/prisma";
import { patientCreateSchema } from "~/lib/schemas";
import { toPatientDTO } from "~/lib/serialize";

const PAGE_SIZE = 20;

// GET /api/patients?clinicId&q&cursor → { patients, nextCursor }
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const url = new URL(req.url);
  const clinicId = url.searchParams.get("clinicId");
  if (!clinicId) return new Response("clinicId is required", { status: 400 });

  const q = url.searchParams.get("q")?.trim();
  const cursor = url.searchParams.get("cursor") ?? undefined;

  const where: Prisma.PatientWhereInput = {
    firstClinicId: clinicId,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { contactNumber: { contains: q } },
          ],
        }
      : {}),
  };

  const rows = await prisma.patient.findMany({
    where,
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take: PAGE_SIZE + 1,
    include: { _count: { select: { visits: true } } },
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > PAGE_SIZE;
  const patients = (hasMore ? rows.slice(0, PAGE_SIZE) : rows).map((row) => ({
    ...toPatientDTO(row),
    visitCount: row._count.visits,
  }));
  const nextCursor = hasMore ? patients[patients.length - 1].id : null;

  return Response.json({ patients, nextCursor });
}

// POST /api/patients → 201 PatientDTO
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const parsed = patientCreateSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  const created = await prisma.patient.create({
    data: {
      name: d.name,
      gender: d.gender,
      contactNumber: d.contactNumber,
      firstClinicId: d.firstClinicId,
      dateOfBirth: d.dateOfBirth ? new Date(d.dateOfBirth) : null,
      ageYears: d.ageYears ?? null,
      bloodGroup: d.bloodGroup,
      address: d.address ?? null,
      medicalHistory: d.medicalHistory ?? null,
      allergies: d.allergies ?? null,
    },
  });

  return Response.json(toPatientDTO(created), { status: 201 });
}
