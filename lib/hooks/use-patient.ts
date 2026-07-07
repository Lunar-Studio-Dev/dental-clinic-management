"use client";

import { useQuery } from "@tanstack/react-query";
import { patientsRepo } from "~/lib/data/patients";

export function usePatient(id: string) {
  return useQuery({
    queryKey: ["patient", id],
    queryFn: () => patientsRepo.get(id),
  });
}
