import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PatientStatusBadge } from "~/components/patients/patient-status-badge";

describe("PatientStatusBadge", () => {
  it("shows 'Returning' for 2+ visits", () => {
    render(<PatientStatusBadge visitCount={3} />);
    expect(screen.getByText("Returning")).toBeInTheDocument();
  });

  it("shows 'New' for fewer than 2 visits", () => {
    render(<PatientStatusBadge visitCount={1} />);
    expect(screen.getByText("New")).toBeInTheDocument();
  });
});
