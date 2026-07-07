"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { patientsRepo } from "~/lib/data/patients";

// Clinic-scoped, searchable, cursor-paginated patient list.
export function usePatients(clinicId: string | null, q: string) {
  return useInfiniteQuery({
    queryKey: ["patients", clinicId, q],
    enabled: !!clinicId,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      patientsRepo.list({
        clinicId: clinicId as string,
        q: q || undefined,
        cursor: pageParam,
      }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}
