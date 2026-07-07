"use client";

import { useQuery } from "@tanstack/react-query";
import { type VisitRange, visitsRepo } from "~/lib/data/visits";

export function useVisits(clinicId: string | null, range: VisitRange) {
  return useQuery({
    queryKey: ["visits", clinicId, range],
    enabled: !!clinicId,
    queryFn: () => visitsRepo.list({ clinicId: clinicId as string, range }),
  });
}
