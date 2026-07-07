// Visits repository — hits /api/visits (added in Phase 3).
import { getJson, patchJson, postJson } from "~/lib/data/http";
import type {
  VisitCreateInput,
  VisitDTO,
  VisitListItem,
} from "~/lib/data/types";

export type VisitRange = "today" | "recent";

export const visitsRepo = {
  list: (params: {
    clinicId: string;
    range: VisitRange;
  }): Promise<{ visits: VisitListItem[] }> => {
    const sp = new URLSearchParams({
      clinicId: params.clinicId,
      range: params.range,
    });
    return getJson<{ visits: VisitListItem[] }>(`/api/visits?${sp.toString()}`);
  },
  create: (input: VisitCreateInput): Promise<VisitDTO> =>
    postJson<VisitDTO>("/api/visits", input),
  addNote: (id: string, notes: string): Promise<VisitDTO> =>
    patchJson<VisitDTO>(`/api/visits/${id}`, { notes }),
};
