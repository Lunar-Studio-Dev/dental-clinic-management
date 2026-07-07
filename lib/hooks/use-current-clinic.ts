"use client";

import { useEffect } from "react";
import { useUIStore } from "~/stores/ui-store";

// Pure: which clinic id should be active given the persisted one + available clinics.
// Keeps the current id if still valid, else falls back to the first clinic (or null).
export function resolveClinicId(
  currentId: string | null,
  clinics: ReadonlyArray<{ id: string }>,
): string | null {
  if (currentId && clinics.some((c) => c.id === currentId)) return currentId;
  return clinics[0]?.id ?? null;
}

// Hook: resolves the active clinic id and persists a default/repair into the store.
export function useCurrentClinicId(
  clinics: ReadonlyArray<{ id: string }>,
): string | null {
  const currentClinicId = useUIStore((s) => s.currentClinicId);
  const setClinic = useUIStore((s) => s.setClinic);
  const resolved = resolveClinicId(currentClinicId, clinics);

  useEffect(() => {
    if (resolved && resolved !== currentClinicId) setClinic(resolved);
  }, [resolved, currentClinicId, setClinic]);

  return resolved;
}
