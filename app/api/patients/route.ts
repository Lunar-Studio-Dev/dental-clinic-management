import { resolveClinicScope } from "~/lib/clinic-scope";
import type { Prisma } from "~/lib/generated/prisma/client";
import { prisma } from "~/lib/prisma";
import { patientCreateSchema } from "~/lib/schemas";
import { toPatientDTO } from "~/lib/serialize";

const PAGE_SIZE = 20;

// GET /api/patients?clinicId&q&cursor → { patients, nextCursor }
export async function GET(req: Request) {
  const url = new URL(req.url);
  const scope = await resolveClinicScope(url.searchParams.get("clinicId"));
  if (!scope.ok) return new Response(scope.message, { status: scope.status });

  const q = url.searchParams.get("q")?.trim();
  const cursor = url.searchParams.get("cursor") ?? undefined;

  const where: Prisma.PatientWhereInput = {
    firstClinicId: scope.clinicId,
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

// POST /api/patients → 201 PatientDTO (clinic forced to the caller's scope)
export async function POST(req: Request) {
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

  // Authorize + resolve the clinic; a receptionist can only create in their clinic.
  const scope = await resolveClinicScope(d.firstClinicId);
  if (!scope.ok) return new Response(scope.message, { status: scope.status });

  const created = await prisma.patient.create({
    data: {
      name: d.name,
      gender: d.gender,
      contactNumber: d.contactNumber,
      firstClinicId: scope.clinicId, // stamped from scope, not trusted from body
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
