// Seeds Neon from the typed dataset in ~/utils/constant.ts. Idempotent: wipes and
// re-inserts, so re-running refreshes visit dates relative to "now".
// Run: pnpm db:seed
import "~/scripts/load-env";

import { prisma } from "~/lib/prisma";
import { CLINICS, PATIENTS, VISITS } from "~/utils/constant";

// Convert a seed visit's (daysAgo, minuteOfDay) into an absolute timestamp
// relative to the moment of seeding.
function toVisitedAt(daysAgo: number, minuteOfDay: number, base: Date): Date {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  d.setMinutes(minuteOfDay);
  return d;
}

async function main() {
  const now = new Date();

  // FK-safe wipe: visits → patients → clinics.
  await prisma.visit.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.clinic.deleteMany();

  await prisma.clinic.createMany({
    data: CLINICS.map((c) => ({
      id: c.id,
      name: c.name,
      address: c.address ?? null,
    })),
  });

  await prisma.patient.createMany({
    data: PATIENTS.map((p) => ({
      id: p.id,
      name: p.name,
      dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth) : null,
      ageYears: p.ageYears ?? null,
      gender: p.gender,
      contactNumber: p.contactNumber,
      address: p.address ?? null,
      medicalHistory: p.medicalHistory ?? null,
      allergies: p.allergies ?? null,
      bloodGroup: p.bloodGroup,
      firstClinicId: p.firstClinicId,
    })),
  });

  await prisma.visit.createMany({
    data: VISITS.map((v) => ({
      id: v.id,
      patientId: v.patientId,
      clinicId: v.clinicId,
      type: v.type,
      reason: v.reason ?? null,
      notes: v.notes ?? null,
      visitedAt: toVisitedAt(v.daysAgo, v.minuteOfDay, now),
    })),
  });

  const [clinics, patients, visits] = await Promise.all([
    prisma.clinic.count(),
    prisma.patient.count(),
    prisma.visit.count(),
  ]);
  console.log(
    `Seeded Neon → clinics: ${clinics}, patients: ${patients}, visits: ${visits}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
