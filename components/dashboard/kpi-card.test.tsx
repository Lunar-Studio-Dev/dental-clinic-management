import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KpiCard } from "~/components/dashboard/kpi-card";

describe("KpiCard", () => {
  it("renders the label and value", () => {
    render(<KpiCard label="Total patients" value={48} />);
    expect(screen.getByText("Total patients")).toBeInTheDocument();
    expect(screen.getByText("48")).toBeInTheDocument();
  });

  it("renders an optional sub line", () => {
    render(<KpiCard label="Returning" value="61%" sub="of all patients" />);
    expect(screen.getByText("of all patients")).toBeInTheDocument();
  });
});
