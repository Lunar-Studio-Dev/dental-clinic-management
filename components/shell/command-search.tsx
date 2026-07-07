"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { useActiveClinicId } from "~/lib/hooks/use-active-clinic";
import { useClinics } from "~/lib/hooks/use-clinics";
import { useDebouncedValue } from "~/lib/hooks/use-debounced-value";
import { usePatients } from "~/lib/hooks/use-patients";

// Global (current-clinic) patient search. cmdk filtering is disabled because the
// server already filters by name/phone — otherwise phone matches would be hidden.
export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  const { data: clinics } = useClinics();
  const clinicId = useActiveClinicId(clinics ?? []);
  const debouncedQ = useDebouncedValue(q, 250);
  const query = usePatients(clinicId, debouncedQ);
  const patients = query.data?.pages.flatMap((p) => p.patients) ?? [];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const goto = (id: string) => {
    router.push(`/patients/${id}`);
    setOpen(false);
    setQ("");
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-muted-foreground w-full justify-start gap-2 sm:w-64"
      >
        <Search data-icon="inline-start" />
        <span className="flex-1 text-left">Search patients…</span>
        <kbd className="bg-muted rounded px-1.5 text-xs">⌘K</kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search patients"
        description="Search patients by name or phone in the current clinic"
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={q}
            onValueChange={setQ}
            placeholder="Search by name or phone…"
          />
          <CommandList>
            <CommandEmpty>
              {debouncedQ ? "No patients found." : "Type to search patients."}
            </CommandEmpty>
            {patients.length > 0 && (
              <CommandGroup heading="Patients">
                {patients.slice(0, 8).map((p) => (
                  <CommandItem
                    key={p.id}
                    value={p.id}
                    onSelect={() => goto(p.id)}
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
      </CommandDialog>
    </>
  );
}
