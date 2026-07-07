import { auth } from "@clerk/nextjs/server";
import { Prisma } from "~/lib/generated/prisma/client";
import { prisma } from "~/lib/prisma";
import { patientUpdateSchema } from "~/lib/schemas";
import { toPatientDTO, toVisitDTO } from "~/lib/serialize";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/patients/[id] → { patient, visits } (visits newest first)
export async function GET(_req: Request, { params }: Ctx) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const found = await prisma.patient.findUnique({
    where: { id },
    include: { visits: { orderBy: { visitedAt: "desc" } } },
  });
  if (!found) return new Response("Not found", { status: 404 });

  const { visits, ...patient } = found;
  return Response.json({
    patient: toPatientDTO(patient),
    visits: visits.map(toVisitDTO),
  });
}

// PATCH /api/patients/[id] → updated PatientDTO (firstClinicId is immutable)
export async function PATCH(req: Request, { params }: Ctx) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const parsed = patientUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  const data: Prisma.PatientUpdateInput = {};
  if (d.name !== undefined) data.name = d.name;
  if (d.gender !== undefined) data.gender = d.gender;
  if (d.contactNumber !== undefined) data.contactNumber = d.contactNumber;
  if (d.ageYears !== undefined) data.ageYears = d.ageYears;
  if (d.bloodGroup !== undefined) data.bloodGroup = d.bloodGroup;
  if (d.address !== undefined) data.address = d.address;
  if (d.medicalHistory !== undefined) data.medicalHistory = d.medicalHistory;
  if (d.allergies !== undefined) data.allergies = d.allergies;
  if (d.dateOfBirth !== undefined) {
    data.dateOfBirth = d.dateOfBirth ? new Date(d.dateOfBirth) : null;
  }

  try {
    const updated = await prisma.patient.update({ where: { id }, data });
    return Response.json(toPatientDTO(updated));
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
