import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VisitTimeline } from "~/components/patients/visit-timeline";
import type { VisitDTO } from "~/lib/data/types";

const visits: VisitDTO[] = [
  {
    id: "v1",
    patientId: "p1",
    clinicId: "clinic_1",
    type: "NEW",
    reason: "Fever and body ache",
    notes: "Prescribed rest",
    visitedAt: "2026-07-01T09:00:00.000Z",
  },
  {
    id: "v2",
    patientId: "p1",
    clinicId: "clinic_1",
    type: "FOLLOW_UP",
    reason: "Routine follow-up",
    notes: null,
    visitedAt: "2026-06-01T09:00:00.000Z",
  },
];

describe("VisitTimeline", () => {
  it("renders a row per visit with type + reason", () => {
    render(<VisitTimeline visits={visits} />);
    expect(screen.getByText("Fever and body ache")).toBeInTheDocument();
    expect(screen.getByText("Routine follow-up")).toBeInTheDocument();
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByText("Follow-up")).toBeInTheDocument();
    expect(screen.getByText("Prescribed rest")).toBeInTheDocument();
  });

  it("shows an empty state when there are no visits", () => {
    render(<VisitTimeline visits={[]} />);
    expect(screen.getByText("No visits yet")).toBeInTheDocument();
  });

  it("renders a note action per visit only when onAddNote is provided", () => {
    const { rerender } = render(<VisitTimeline visits={visits} />);
    expect(screen.queryByText("Add note")).not.toBeInTheDocument();

    rerender(<VisitTimeline visits={visits} onAddNote={() => {}} />);
    // v1 has notes → "Edit note"; v2 has none → "Add note"
    expect(screen.getByText("Edit note")).toBeInTheDocument();
    expect(screen.getByText("Add note")).toBeInTheDocument();
  });
});
