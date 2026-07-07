"use client";

import { useQuery } from "@tanstack/react-query";
import { clinicsRepo } from "~/lib/data/clinics";

export function useClinics() {
  return useQuery({
    queryKey: ["clinics"],
    queryFn: () => clinicsRepo.list(),
    staleTime: 5 * 60_000, // clinics rarely change
  });
}
