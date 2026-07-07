import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VisitListItem } from "~/components/visits/visit-list-item";
import type { VisitListItem as VisitListItemT } from "~/lib/data/types";

const visit: VisitListItemT = {
  id: "v1",
  patientId: "p1",
  clinicId: "clinic_1",
  type: "FOLLOW_UP",
  reason: "Routine follow-up",
  notes: null,
  visitedAt: "2026-07-01T09:20:00.000Z",
  patientName: "Ravi Kumar",
};

describe("VisitListItem", () => {
  it("shows patient, reason and type, and links to the profile", () => {
    render(<VisitListItem visit={visit} />);
    expect(screen.getByText("Ravi Kumar")).toBeInTheDocument();
    expect(screen.getByText("Routine follow-up")).toBeInTheDocument();
    expect(screen.getByText("Follow-up")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/patients/p1");
  });
});
