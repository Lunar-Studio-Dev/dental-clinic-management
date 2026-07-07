"use client";

import { Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "~/components/ui/select";
import type { ClinicDTO } from "~/lib/data/types";

interface ClinicSwitcherProps {
  clinics: ClinicDTO[];
  value: string | null;
  onChange: (clinicId: string) => void;
}

// Presentational clinic switcher. The trigger renders the selected clinic's name
// directly (robust + testable) rather than relying on Select auto-labeling.
export function ClinicSwitcher({
  clinics,
  value,
  onChange,
}: ClinicSwitcherProps) {
  const selected = clinics.find((c) => c.id === value) ?? null;

  return (
    <Select
      value={value}
      onValueChange={(v) => {
        if (v) onChange(v);
      }}
    >
      <SelectTrigger aria-label="Switch clinic" className="min-w-40">
        <Building2 data-icon="inline-start" />
        <span className="truncate">
          {selected ? selected.name : "Select clinic"}
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
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
