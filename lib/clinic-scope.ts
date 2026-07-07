import { auth } from "@clerk/nextjs/server";
import { prisma } from "~/lib/prisma";
import type { Role } from "~/utils/constant.schema";

export type ClinicScope =
  | { ok: true; clinicId: string; role: Role }
  | { ok: false; status: 401 | 403 | 400; message: string };

// Server-side clinic authorization. Doctors may target any clinic (must pass one);
// receptionists are forced to their assigned clinic (403 on mismatch), auto-assigned
// the earliest clinic on first access if unassigned. Every clinic-scoped route calls
// this — the server never trusts the client's clinicId.
export async function resolveClinicScope(
  requestedClinicId: string | null,
): Promise<ClinicScope> {
  const { userId } = await auth();
  if (!userId) return { ok: false, status: 401, message: "Unauthorized" };

  const staff = await prisma.staff.findUnique({ where: { id: userId } });
  if (!staff) {
    return { ok: false, status: 403, message: "No staff record for this user" };
  }

  if (staff.role === "doctor") {
    if (!requestedClinicId) {
      return { ok: false, status: 400, message: "clinicId is required" };
    }
    return { ok: true, clinicId: requestedClinicId, role: "doctor" };
  }

  // receptionist — locked to their assigned clinic
  let assigned = staff.clinicId;
  if (!assigned) {
    const clinic = await prisma.clinic.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (!clinic) {
      return {
        ok: false,
        status: 400,
        message: "No clinic available to assign",
      };
    }
    await prisma.staff.update({
      where: { id: staff.id },
      data: { clinicId: clinic.id },
    });
    assigned = clinic.id;
  }

  if (requestedClinicId && requestedClinicId !== assigned) {
    return {
      ok: false,
      status: 403,
      message: "Forbidden: outside your assigned clinic",
    };
  }

  return { ok: true, clinicId: assigned, role: "receptionist" };
}
