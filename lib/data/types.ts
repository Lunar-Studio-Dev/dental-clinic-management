// Data-transfer shapes returned by /api/* (JSON — dates are ISO strings).
// Components/hooks depend on these DTOs, never on Prisma directly, so the repo
// internals can swap freely without changing callers.
import type { BloodGroup, Gender, VisitType } from "~/lib/types";

export interface ClinicDTO {
  id: string;
  name: string;
  address: string | null;
}

export interface PatientDTO {
  id: string;
  name: string;
  dateOfBirth: string | null;
  ageYears: number | null;
  gender: Gender;
  contactNumber: string;
  address: string | null;
  medicalHistory: string | null;
  allergies: string | null;
  bloodGroup: BloodGroup;
  firstClinicId: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisitDTO {
  id: string;
  patientId: string;
  clinicId: string;
  type: VisitType;
  reason: string | null;
  notes: string | null;
  visitedAt: string;
}

export interface PatientListParams {
  clinicId: string;
  q?: string;
  cursor?: string;
}

export interface VisitListParams {
  clinicId: string;
  range?: "today" | "week" | "month";
}
