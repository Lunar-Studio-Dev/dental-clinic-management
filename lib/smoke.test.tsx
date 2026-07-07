import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

// Harness smoke test — proves Vitest + RTL + jsdom + the ~ alias all work.
// Removed once real component tests exist (Phase 1+).
function Hello({ name }: { name: string }) {
  return <p>Hello {name}</p>;
}

describe("test harness", () => {
  it("renders a component and queries the DOM", () => {
    render(<Hello name="ClinicOS" />);
    expect(screen.getByText("Hello ClinicOS")).toBeInTheDocument();
  });
});
