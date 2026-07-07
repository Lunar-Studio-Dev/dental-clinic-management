import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoleBadge } from "~/components/shell/role-badge";

describe("RoleBadge", () => {
  it("shows 'Reception' for a receptionist", () => {
    render(<RoleBadge role="receptionist" />);
    expect(screen.getByText("Reception")).toBeInTheDocument();
  });

  it("shows 'Doctor' for a doctor", () => {
    render(<RoleBadge role="doctor" />);
    expect(screen.getByText("Doctor")).toBeInTheDocument();
  });

  it("renders nothing when the role is unset", () => {
    const { container } = render(<RoleBadge role={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
