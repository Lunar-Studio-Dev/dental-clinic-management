import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ErrorState } from "~/components/error-state";

describe("ErrorState", () => {
  it("renders the title and description", () => {
    render(<ErrorState title="Boom" description="It broke" />);
    expect(screen.getByText("Boom")).toBeInTheDocument();
    expect(screen.getByText("It broke")).toBeInTheDocument();
  });

  it("shows a Retry button only when onRetry is provided, and calls it", async () => {
    const onRetry = vi.fn();
    const { rerender } = render(<ErrorState />);
    expect(
      screen.queryByRole("button", { name: /retry/i }),
    ).not.toBeInTheDocument();

    rerender(<ErrorState onRetry={onRetry} />);
    await userEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
