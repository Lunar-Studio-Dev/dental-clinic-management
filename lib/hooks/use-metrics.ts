"use client";

import { useQuery } from "@tanstack/react-query";
import { metricsRepo } from "~/lib/data/metrics";

export function useMetrics(clinicId: string | null) {
  return useQuery({
    queryKey: ["metrics", clinicId],
    enabled: !!clinicId,
    queryFn: () => metricsRepo.dashboard(clinicId as string),
  });
}
