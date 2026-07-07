// Prisma row → DTO (Date → ISO string) for API responses.
import type { PatientDTO, VisitDTO, VisitListItem } from "~/lib/data/types";
import type { Patient, Visit } from "~/lib/types";

export function toPatientDTO(p: Patient): PatientDTO {
  return {
    id: p.id,
    name: p.name,
    dateOfBirth: p.dateOfBirth ? p.dateOfBirth.toISOString() : null,
    ageYears: p.ageYears,
    gender: p.gender,
    contactNumber: p.contactNumber,
    address: p.address,
    medicalHistory: p.medicalHistory,
    allergies: p.allergies,
    bloodGroup: p.bloodGroup,
    firstClinicId: p.firstClinicId,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export function toVisitDTO(v: Visit): VisitDTO {
  return {
    id: v.id,
    patientId: v.patientId,
    clinicId: v.clinicId,
    type: v.type,
    reason: v.reason,
    notes: v.notes,
    visitedAt: v.visitedAt.toISOString(),
  };
}

export function toVisitListItem(
  v: Visit & { patient: { name: string } },
): VisitListItem {
  return { ...toVisitDTO(v), patientName: v.patient.name };
}
