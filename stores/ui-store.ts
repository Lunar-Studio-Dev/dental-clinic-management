// Client UI state (NOT server data). Holds the selected clinic + active role view,
// persisted to localStorage so a receptionist/doctor's context survives page reloads.
// Records (patients/visits) live in Neon and are fetched via the data-access seam.
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "~/utils/constant.schema";

interface UIState {
  currentClinicId: string | null;
  roleView: Role | null;
  setClinic: (id: string | null) => void;
  setRoleView: (role: Role | null) => void;
  reset: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      currentClinicId: null,
      roleView: null,
      setClinic: (id) => set({ currentClinicId: id }),
      setRoleView: (role) => set({ roleView: role }),
      reset: () => set({ currentClinicId: null, roleView: null }),
    }),
    {
      name: "clinic-ui",
      partialize: (s) => ({
        currentClinicId: s.currentClinicId,
        roleView: s.roleView,
      }),
    },
  ),
);
