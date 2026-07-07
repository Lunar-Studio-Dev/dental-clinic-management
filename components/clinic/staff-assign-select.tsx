"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "~/components/ui/select";
import type { StaffItem } from "~/lib/data/clinic-admin";
import type { ClinicDTO } from "~/lib/data/types";
import { useAssignStaff } from "~/lib/hooks/use-clinic-admin";

const UNASSIGNED = "__unassigned__";

export function StaffAssignSelect({
  staff,
  clinics,
}: {
  staff: StaffItem;
  clinics: ClinicDTO[];
}) {
  const assign = useAssignStaff();
  const currentName =
    clinics.find((c) => c.id === staff.clinicId)?.name ?? "Unassigned";

  return (
    <Select
      value={staff.clinicId ?? UNASSIGNED}
      onValueChange={(v) => {
        if (!v) return;
        assign.mutate({
          id: staff.id,
          clinicId: v === UNASSIGNED ? null : v,
        });
      }}
    >
      <SelectTrigger
        aria-label={`Assign ${staff.name} to a clinic`}
        className="min-w-40"
      >
        <span className="truncate">{currentName}</span>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
          {clinics.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
