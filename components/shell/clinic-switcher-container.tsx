"use client";

import { Building2 } from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";
import { useClinics } from "~/lib/hooks/use-clinics";
import { useCurrentClinicId } from "~/lib/hooks/use-current-clinic";
import { useMyClinic } from "~/lib/hooks/use-my-clinic";
import { useUIStore } from "~/stores/ui-store";
import { ClinicSwitcher } from "./clinic-switcher";

// Doctors get the switcher; receptionists get a read-only clinic label (they're
// locked to their assigned clinic and cannot change it).
export function ClinicSwitcherContainer() {
  const { data, isLoading } = useClinics();
  const clinics = data ?? [];
  const my = useMyClinic();
  const value = useCurrentClinicId(clinics);
  const setClinic = useUIStore((s) => s.setClinic);

  if (my.isLoading || (isLoading && clinics.length === 0)) {
    return <Skeleton className="h-8 w-40" />;
  }

  // Receptionist (or anyone who can't switch): read-only clinic name.
  if (my.data && !my.data.canSwitch) {
    return (
      <div className="flex items-center gap-2 text-sm font-medium">
        <Building2 className="text-muted-foreground size-4 shrink-0" />
        <span className="truncate">{my.data.clinicName ?? "—"}</span>
      </div>
    );
  }

  return (
    <ClinicSwitcher clinics={clinics} value={value} onChange={setClinic} />
  );
}
