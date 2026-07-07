"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { patientsRepo } from "~/lib/data/patients";
import type { PatientCreateInput, PatientUpdateInput } from "~/lib/data/types";

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PatientCreateInput) => patientsRepo.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Patient registered");
    },
    onError: () => toast.error("Could not register patient"),
  });
}

export function useUpdatePatient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PatientUpdateInput) => patientsRepo.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["patient", id] });
      toast.success("Patient updated");
    },
    onError: () => toast.error("Could not update patient"),
  });
}
