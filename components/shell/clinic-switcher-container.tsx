"use client";

import { Skeleton } from "~/components/ui/skeleton";
import { useClinics } from "~/lib/hooks/use-clinics";
import { useCurrentClinicId } from "~/lib/hooks/use-current-clinic";
import { useUIStore } from "~/stores/ui-store";
import { ClinicSwitcher } from "./clinic-switcher";

// Wires the presentational ClinicSwitcher to the clinics query + Zustand store.
export function ClinicSwitcherContainer() {
  const { data, isLoading } = useClinics();
  const clinics = data ?? [];
  const value = useCurrentClinicId(clinics);
  const setClinic = useUIStore((s) => s.setClinic);

  if (isLoading && clinics.length === 0) {
    return <Skeleton className="h-8 w-40" />;
  }

  return (
    <ClinicSwitcher clinics={clinics} value={value} onChange={setClinic} />
  );
}
