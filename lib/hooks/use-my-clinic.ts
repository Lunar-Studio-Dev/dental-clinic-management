"use client";

import { useQuery } from "@tanstack/react-query";
import { meRepo } from "~/lib/data/me";

export function useMyClinic() {
  return useQuery({
    queryKey: ["me", "clinic"],
    queryFn: () => meRepo.clinic(),
    staleTime: 60_000,
  });
}
