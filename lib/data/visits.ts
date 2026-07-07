// Visits repository — typed stub. Implemented in Phase 3 (visits).
import type { VisitDTO, VisitListParams } from "~/lib/data/types";

const NOT_YET = "visitsRepo: implemented in Phase 3";

export const visitsRepo = {
  list: (_params: VisitListParams): Promise<VisitDTO[]> => {
    throw new Error(NOT_YET);
  },
  create: (_input: Partial<VisitDTO>): Promise<VisitDTO> => {
    throw new Error(NOT_YET);
  },
  addNote: (_id: string, _notes: string): Promise<VisitDTO> => {
    throw new Error(NOT_YET);
  },
};
