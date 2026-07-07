// Clinics repository — the reference implementation of the repo seam pattern.
// The /api/clinics route it calls is added in Phase 1.
import { getJson } from "~/lib/data/http";
import type { ClinicDTO } from "~/lib/data/types";

export const clinicsRepo = {
  list: async (): Promise<ClinicDTO[]> => {
    const data = await getJson<{ clinics: ClinicDTO[] }>("/api/clinics");
    return data.clinics;
  },
};
