import { beforeEach, describe, expect, it } from "vitest";
import { useUIStore } from "~/stores/ui-store";

beforeEach(() => {
  localStorage.clear();
  useUIStore.setState({ currentClinicId: null, roleView: null });
});

describe("ui store", () => {
  it("starts empty", () => {
    const s = useUIStore.getState();
    expect(s.currentClinicId).toBeNull();
    expect(s.roleView).toBeNull();
  });

  it("setClinic updates the current clinic", () => {
    useUIStore.getState().setClinic("clinic_1");
    expect(useUIStore.getState().currentClinicId).toBe("clinic_1");
  });

  it("setRoleView updates the active role view", () => {
    useUIStore.getState().setRoleView("doctor");
    expect(useUIStore.getState().roleView).toBe("doctor");
  });

  it("persists selection to localStorage under 'clinic-ui'", () => {
    useUIStore.getState().setClinic("clinic_2");
    useUIStore.getState().setRoleView("receptionist");
    const raw = localStorage.getItem("clinic-ui");
    expect(raw).toBeTruthy();
    expect(raw).toContain("clinic_2");
    expect(raw).toContain("receptionist");
  });

  it("reset clears state", () => {
    useUIStore.getState().setClinic("clinic_1");
    useUIStore.getState().setRoleView("doctor");
    useUIStore.getState().reset();
    expect(useUIStore.getState().currentClinicId).toBeNull();
    expect(useUIStore.getState().roleView).toBeNull();
  });
});
