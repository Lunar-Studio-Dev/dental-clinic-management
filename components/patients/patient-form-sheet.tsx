"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import type { PatientCreateInput, PatientDTO } from "~/lib/data/types";
import { useClinics } from "~/lib/hooks/use-clinics";
import {
  useCreatePatient,
  useUpdatePatient,
} from "~/lib/hooks/use-patient-mutations";
import { PatientForm } from "./patient-form";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  patient?: PatientDTO;
  defaultClinicId?: string | null;
};

function toFormValues(p: PatientDTO): Partial<PatientCreateInput> {
  return {
    name: p.name,
    gender: p.gender,
    contactNumber: p.contactNumber,
    firstClinicId: p.firstClinicId,
    dateOfBirth: p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : null,
    ageYears: p.ageYears,
    bloodGroup: p.bloodGroup,
    address: p.address,
    medicalHistory: p.medicalHistory,
    allergies: p.allergies,
  };
}

export function PatientFormSheet({
  open,
  onOpenChange,
  mode,
  patient,
  defaultClinicId,
}: Props) {
  const { data: clinics } = useClinics();
  const createMut = useCreatePatient();
  const updateMut = useUpdatePatient(patient?.id ?? "");

  const defaultValues: Partial<PatientCreateInput> =
    mode === "edit" && patient
      ? toFormValues(patient)
      : { firstClinicId: defaultClinicId ?? "", bloodGroup: "UNKNOWN" };

  const isPending =
    mode === "create" ? createMut.isPending : updateMut.isPending;

  const handleSubmit = (values: PatientCreateInput) => {
    const done = { onSuccess: () => onOpenChange(false) };
    if (mode === "create") createMut.mutate(values, done);
    else updateMut.mutate(values, done);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle>
            {mode === "create" ? "Register patient" : "Edit patient"}
          </SheetTitle>
          <SheetDescription>
            {mode === "create"
              ? "Add a new patient to this clinic."
              : "Update this patient's details."}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          {open && (
            <PatientForm
              key={mode === "edit" ? patient?.id : "create"}
              mode={mode}
              clinics={clinics ?? []}
              defaultValues={defaultValues}
              onSubmit={handleSubmit}
              isPending={isPending}
              onCancel={() => onOpenChange(false)}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
