// Zod schemas for the seed dataset in `constant.ts`. Shared by the constants test
// and reusable by API validation later. Shapes mirror the Prisma columns (plus
// seed-only `daysAgo`/`minuteOfDay`, which the seed script converts to `visitedAt`).
import { z } from "zod";
import { BloodGroup, Gender, VisitType } from "~/lib/types";

export const ROLES = ["receptionist", "doctor"] as const;
export type Role = (typeof ROLES)[number];

// z.enum accepts the Prisma enum-like const objects and preserves the literal union,
// so the inferred Seed types match the Prisma enum types (Gender, BloodGroup, VisitType).
const zGender = z.enum(Gender);
const zBloodGroup = z.enum(BloodGroup);
const zVisitType = z.enum(VisitType);
const zRole = z.enum(ROLES);

const isoDate = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: "invalid ISO date" });

export const SeedClinicSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  address: z.string().nullable().optional(),
});

export const SeedPatientSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    dateOfBirth: isoDate.nullable().optional(),
    ageYears: z.number().int().positive().nullable().optional(),
    gender: zGender,
    contactNumber: z.string().min(5),
    address: z.string().nullable().optional(),
    medicalHistory: z.string().nullable().optional(),
    allergies: z.string().nullable().optional(),
    bloodGroup: zBloodGroup,
    firstClinicId: z.string().min(1),
  })
  .refine((p) => p.dateOfBirth != null || p.ageYears != null, {
    message: "patient needs dateOfBirth or ageYears",
  });

export const SeedVisitSchema = z.object({
  id: z.string().min(1),
  patientId: z.string().min(1),
  clinicId: z.string().min(1),
  type: zVisitType,
  reason: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  daysAgo: z.number().int().min(0),
  minuteOfDay: z.number().int().min(0).max(1439),
});

export const SeedUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: zRole,
});

export type SeedClinic = z.infer<typeof SeedClinicSchema>;
export type SeedPatient = z.infer<typeof SeedPatientSchema>;
export type SeedVisit = z.infer<typeof SeedVisitSchema>;
export type SeedUser = z.infer<typeof SeedUserSchema>;
