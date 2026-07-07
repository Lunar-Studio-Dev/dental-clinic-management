import { getJson, patchJson, postJson } from "~/lib/data/http";
import type { ClinicDTO } from "~/lib/data/types";
import type { ClinicCreateInput, ClinicUpdateInput } from "~/lib/schemas";
import type { Role } from "~/utils/constant.schema";

export interface ClinicOverview {
  id: string;
  name: string;
  address: string | null;
  patientCount: number;
  visitCount: number;
  todayVisits: number;
  staff: { name: string; role: Role }[];
}

export interface StaffItem {
  id: string;
  name: string;
  email: string;
  role: Role;
  clinicId: string | null;
}

export const clinicAdminRepo = {
  overview: (): Promise<{ clinics: ClinicOverview[] }> =>
    getJson("/api/clinics/overview"),
  createClinic: (input: ClinicCreateInput): Promise<ClinicDTO> =>
    postJson<ClinicDTO>("/api/clinics", input),
  updateClinic: (id: string, input: ClinicUpdateInput): Promise<ClinicDTO> =>
    patchJson<ClinicDTO>(`/api/clinics/${id}`, input),
  listReceptionists: (): Promise<{ staff: StaffItem[] }> =>
    getJson("/api/staff?role=receptionist"),
  assign: (id: string, clinicId: string | null): Promise<StaffItem> =>
    postJson<StaffItem>(`/api/staff/${id}/assign`, { clinicId }),
};
