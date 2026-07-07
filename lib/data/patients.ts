// Patients repository — typed stub. Implemented in Phase 2 (patient management).
import type { PatientDTO, PatientListParams } from "~/lib/data/types";

const NOT_YET = "patientsRepo: implemented in Phase 2";

export const patientsRepo = {
  list: (_params: PatientListParams): Promise<PatientDTO[]> => {
    throw new Error(NOT_YET);
  },
  get: (_id: string): Promise<PatientDTO> => {
    throw new Error(NOT_YET);
  },
  create: (_input: Partial<PatientDTO>): Promise<PatientDTO> => {
    throw new Error(NOT_YET);
  },
  update: (_id: string, _input: Partial<PatientDTO>): Promise<PatientDTO> => {
    throw new Error(NOT_YET);
  },
};
