import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ClinicSwitcher } from "~/components/shell/clinic-switcher";

const clinics = [
  { id: "clinic_1", name: "Clinic 1", address: null },
  { id: "clinic_2", name: "Clinic 2", address: null },
];

describe("ClinicSwitcher", () => {
  it("shows the currently selected clinic's name", () => {
    render(
      <ClinicSwitcher clinics={clinics} value="clinic_2" onChange={vi.fn()} />,
    );
    expect(screen.getByText("Clinic 2")).toBeInTheDocument();
  });

  it("shows a placeholder when nothing is selected / clinics are loading", () => {
    render(<ClinicSwitcher clinics={[]} value={null} onChange={vi.fn()} />);
    expect(screen.getByText("Select clinic")).toBeInTheDocument();
  });
});
