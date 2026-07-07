import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PatientRow } from "~/components/patients/patient-row";
import type { PatientListItem } from "~/lib/data/types";

const patient: PatientListItem = {
  id: "p1",
  name: "Asha Mehta",
  dateOfBirth: null,
  ageYears: 34,
  gender: "FEMALE",
  contactNumber: "9810000001",
  address: null,
  medicalHistory: null,
  allergies: null,
  bloodGroup: "O_POS",
  firstClinicId: "clinic_1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  visitCount: 3,
};

describe("PatientRow", () => {
  it("shows the name, phone and status, and links to the profile", () => {
    render(
      <PatientRow patient={patient} now={new Date("2026-07-07T00:00:00Z")} />,
    );
    expect(screen.getByText("Asha Mehta")).toBeInTheDocument();
    expect(screen.getByText("9810000001")).toBeInTheDocument();
    expect(screen.getByText("Returning")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/patients/p1");
  });
});
