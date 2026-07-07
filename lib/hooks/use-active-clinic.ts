"use client";

import { useCurrentClinicId } from "~/lib/hooks/use-current-clinic";
import { useMyClinic } from "~/lib/hooks/use-my-clinic";
import { useRole } from "~/lib/hooks/use-role";

// The clinic every data view should use:
// - receptionist → their assigned clinic (null while it loads → views skip querying,
//   so no cross-clinic 403 flash); they cannot switch.
// - doctor (or unknown role) → the switcher selection from the Zustand store.
export function useActiveClinicId(
  clinics: ReadonlyArray<{ id: string }>,
): string | null {
  const role = useRole();
  const my = useMyClinic();
  const storeClinicId = useCurrentClinicId(clinics);

  if (role === "receptionist") {
    return my.data?.clinicId ?? null;
  }
  return storeClinicId;
}
