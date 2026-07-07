// Patients repository — hits /api/patients (added in Phase 2). Components/hooks
// depend on this, never on fetch/Prisma directly.
import { getJson, patchJson, postJson } from "~/lib/data/http";
import type {
  PatientCreateInput,
  PatientDTO,
  PatientListParams,
  PatientListResult,
  PatientUpdateInput,
  PatientWithVisits,
} from "~/lib/data/types";

export const patientsRepo = {
  list: (params: PatientListParams): Promise<PatientListResult> => {
    const sp = new URLSearchParams({ clinicId: params.clinicId });
    if (params.q) sp.set("q", params.q);
    if (params.cursor) sp.set("cursor", params.cursor);
    return getJson<PatientListResult>(`/api/patients?${sp.toString()}`);
  },
  get: (id: string): Promise<PatientWithVisits> =>
    getJson<PatientWithVisits>(`/api/patients/${id}`),
  create: (input: PatientCreateInput): Promise<PatientDTO> =>
    postJson<PatientDTO>("/api/patients", input),
  update: (id: string, input: PatientUpdateInput): Promise<PatientDTO> =>
    patchJson<PatientDTO>(`/api/patients/${id}`, input),
};
