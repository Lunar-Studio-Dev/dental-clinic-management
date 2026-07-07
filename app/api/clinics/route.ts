import { auth } from "@clerk/nextjs/server";
import { prisma } from "~/lib/prisma";

// GET /api/clinics → { clinics: ClinicDTO[] } (matches clinicsRepo.list()).
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const clinics = await prisma.clinic.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, address: true },
  });

  return Response.json({ clinics });
}
