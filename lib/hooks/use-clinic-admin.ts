"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { clinicAdminRepo } from "~/lib/data/clinic-admin";
import type { ClinicCreateInput, ClinicUpdateInput } from "~/lib/schemas";

export function useClinicOverview() {
  return useQuery({
    queryKey: ["clinic-overview"],
    queryFn: () => clinicAdminRepo.overview(),
  });
}

export function useReceptionists() {
  return useQuery({
    queryKey: ["staff", "receptionist"],
    queryFn: () => clinicAdminRepo.listReceptionists(),
  });
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["clinic-overview"] });
  qc.invalidateQueries({ queryKey: ["clinics"] });
}

export function useCreateClinic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ClinicCreateInput) =>
      clinicAdminRepo.createClinic(input),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success("Clinic created");
    },
    onError: () => toast.error("Could not create clinic"),
  });
}

export function useUpdateClinic(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ClinicUpdateInput) =>
      clinicAdminRepo.updateClinic(id, input),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success("Clinic updated");
    },
    onError: () => toast.error("Could not update clinic"),
  });
}

export function useAssignStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, clinicId }: { id: string; clinicId: string | null }) =>
      clinicAdminRepo.assign(id, clinicId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      qc.invalidateQueries({ queryKey: ["clinic-overview"] });
      toast.success("Assignment updated");
    },
    onError: () => toast.error("Could not update assignment"),
  });
}
