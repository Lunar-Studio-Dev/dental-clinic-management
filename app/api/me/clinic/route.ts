import { auth } from "@clerk/nextjs/server";
import { prisma } from "~/lib/prisma";

// GET /api/me/clinic → the caller's clinic context for the top bar.
// Doctors switch freely (canSwitch); receptionists are locked to one clinic
// (auto-assigned the default if none), shown read-only.
export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const staff = await prisma.staff.findUnique({
    where: { id: userId },
    include: { clinic: true },
  });

  if (!staff) {
    return Response.json({
      role: null,
      canSwitch: false,
      clinicId: null,
      clinicName: null,
    });
  }

  if (staff.role === "doctor") {
    return Response.json({
      role: "doctor",
      canSwitch: true,
      clinicId: null,
      clinicName: null,
    });
  }

  // receptionist — ensure an assignment (auto-default), read-only
  let clinic = staff.clinic;
  if (!clinic) {
    const def = await prisma.clinic.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (def) {
      await prisma.staff.update({
        where: { id: userId },
        data: { clinicId: def.id },
      });
      clinic = def;
    }
  }

  return Response.json({
    role: "receptionist",
    canSwitch: false,
    clinicId: clinic?.id ?? null,
    clinicName: clinic?.name ?? null,
  });
}
