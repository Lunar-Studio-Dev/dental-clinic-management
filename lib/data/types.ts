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

// List rows carry a visit count for the New/Returning status badge.
export interface PatientListItem extends PatientDTO {
  visitCount: number;
}

export interface PatientListResult {
  patients: PatientListItem[];
  nextCursor: string | null;
}

export interface PatientWithVisits {
  patient: PatientDTO;
  visits: VisitDTO[];
}

// Visit list rows carry the patient's name for display.
export interface VisitListItem extends VisitDTO {
  patientName: string;
}

// Dashboard KPI bundle (one call powers both dashboards).
export interface MetricsDTO {
  totalPatients: number;
  newPatientsToday: number;
  returningPatients: number;
  repeatVisitPct: number;
  visitsToday: number;
  visitsThisWeek: number;
  visitsThisMonth: number;
  patientsSeenToday: number;
  weeklyVisitTrend: { day: string; count: number }[];
  monthlyPatientCounts: { month: string; count: number }[];
  clinicWisePatients: { clinicId: string; name: string; count: number }[];
  newVsReturning: { new: number; returning: number };
  recentVisits: VisitListItem[];
}

// Input shapes come from the shared Zod schemas (single source of truth).
export type {
  PatientCreateInput,
  PatientUpdateInput,
  VisitCreateInput,
} from "~/lib/schemas";

export interface VisitListParams {
  clinicId: string;
  range?: "today" | "week" | "month";
}
