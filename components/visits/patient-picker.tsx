"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { useDebouncedValue } from "~/lib/hooks/use-debounced-value";
import { usePatients } from "~/lib/hooks/use-patients";

export interface PickedPatient {
  id: string;
  name: string;
}

// Inline patient search/select (current clinic), used inside the New Visit dialog.
export function PatientPicker({
  clinicId,
  value,
  onSelect,
}: {
  clinicId: string | null;
  value: PickedPatient | null;
  onSelect: (patient: PickedPatient | null) => void;
}) {
  const [q, setQ] = useState("");
  const debounced = useDebouncedValue(q, 250);
  const query = usePatients(clinicId, debounced);
  const patients = query.data?.pages.flatMap((p) => p.patients) ?? [];

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-lg border px-3 py-2">
        <span className="font-medium">{value.name}</span>
        <Button variant="ghost" size="sm" onClick={() => onSelect(null)}>
          Change
        </Button>
      </div>
    );
  }

  return (
    <Command shouldFilter={false} className="rounded-lg border">
      <CommandInput
        value={q}
        onValueChange={setQ}
        placeholder="Search patient by name or phone…"
      />
      <CommandList>
        <CommandEmpty>
          {debounced ? "No patients found." : "Type to search."}
        </CommandEmpty>
        {patients.length > 0 && (
          <CommandGroup>
            {patients.slice(0, 6).map((p) => (
              <CommandItem
                key={p.id}
                value={p.id}
                onSelect={() => onSelect({ id: p.id, name: p.name })}
              >
                <span className="font-medium">{p.name}</span>
                <span className="text-muted-foreground ml-2">
                  {p.contactNumber}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );
}
