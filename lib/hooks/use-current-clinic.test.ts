import { describe, expect, it } from "vitest";
import { resolveClinicId } from "~/lib/hooks/use-current-clinic";

const clinics = [{ id: "clinic_1" }, { id: "clinic_2" }];

describe("resolveClinicId", () => {
  it("keeps the current id when it is valid", () => {
    expect(resolveClinicId("clinic_2", clinics)).toBe("clinic_2");
  });

  it("defaults to the first clinic when none is selected", () => {
    expect(resolveClinicId(null, clinics)).toBe("clinic_1");
  });

  it("re-defaults when the persisted id is no longer in the list", () => {
    expect(resolveClinicId("clinic_deleted", clinics)).toBe("clinic_1");
  });

  it("returns null when there are no clinics", () => {
    expect(resolveClinicId("clinic_1", [])).toBeNull();
    expect(resolveClinicId(null, [])).toBeNull();
  });
});
