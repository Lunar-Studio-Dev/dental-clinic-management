// Shared patient validation — used by the Register/Edit form (RHF resolver) AND the
// API route handlers, so client and server enforce the same rules.
import { z } from "zod";
import { BloodGroup, Gender } from "~/lib/types";

const isoDate = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: "Invalid date" });

const optionalText = z.string().trim().nullable().optional();

export const patientCreateSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    gender: z.enum(Gender),
    contactNumber: z.string().trim().min(5, "Contact number is required"),
    firstClinicId: z.string().min(1, "Clinic is required"),
    dateOfBirth: isoDate.nullable().optional(),
    ageYears: z.number().int().positive().max(150).nullable().optional(),
    bloodGroup: z.enum(BloodGroup).default("UNKNOWN"),
    address: optionalText,
    medicalHistory: optionalText,
    allergies: optionalText,
  })
  .refine((p) => p.dateOfBirth != null || p.ageYears != null, {
    message: "Provide date of birth or age",
    path: ["dateOfBirth"],
  });

// firstClinicId intentionally omitted → clinic is immutable after registration.
export const patientUpdateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  gender: z.enum(Gender).optional(),
  contactNumber: z.string().trim().min(5).optional(),
  dateOfBirth: isoDate.nullable().optional(),
  ageYears: z.number().int().positive().max(150).nullable().optional(),
  bloodGroup: z.enum(BloodGroup).optional(),
  address: optionalText,
  medicalHistory: optionalText,
  allergies: optionalText,
});

export type PatientCreateInput = z.infer<typeof patientCreateSchema>;
export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>;

// Visit `type` (NEW/FOLLOW_UP) is intentionally NOT an input — the server derives it.
export const visitCreateSchema = z.object({
  patientId: z.string().min(1),
  clinicId: z.string().min(1, "Clinic is required"),
  reason: z.string().trim().min(1, "Reason is required"),
  notes: z.string().trim().nullable().optional(),
  visitedAt: isoDate.optional(),
});

export const visitNoteSchema = z.object({
  notes: z.string(), // "" allowed → clears the note
});

export type VisitCreateInput = z.infer<typeof visitCreateSchema>;
export type VisitNoteInput = z.infer<typeof visitNoteSchema>;

// Clinic CRUD (doctor-only).
export const clinicCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  address: z.string().trim().nullable().optional(),
});

export const clinicUpdateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  address: z.string().trim().nullable().optional(),
});

// Assign (or clear) a receptionist's clinic.
export const staffAssignSchema = z.object({
  clinicId: z.string().min(1).nullable(),
});

export type ClinicCreateInput = z.infer<typeof clinicCreateSchema>;
export type ClinicUpdateInput = z.infer<typeof clinicUpdateSchema>;
