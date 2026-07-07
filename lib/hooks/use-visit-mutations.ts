"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { VisitCreateInput } from "~/lib/data/types";
import { visitsRepo } from "~/lib/data/visits";

export function useCreateVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: VisitCreateInput) => visitsRepo.create(input),
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: ["visits"] });
      qc.invalidateQueries({ queryKey: ["patient", input.patientId] });
      qc.invalidateQueries({ queryKey: ["patients"] }); // status may flip
      toast.success("Visit recorded");
    },
    onError: () => toast.error("Could not record visit"),
  });
}

export function useAddVisitNote(patientId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      visitsRepo.addNote(id, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visits"] });
      if (patientId) qc.invalidateQueries({ queryKey: ["patient", patientId] });
      toast.success("Note saved");
    },
    onError: () => toast.error("Could not save note"),
  });
}
