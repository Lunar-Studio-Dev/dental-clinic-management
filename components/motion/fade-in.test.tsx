import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FadeIn } from "~/components/motion/fade-in";

describe("FadeIn", () => {
  it("renders its children (matchMedia mocked → not reduced)", () => {
    render(
      <FadeIn>
        <p>content</p>
      </FadeIn>,
    );
    expect(screen.getByText("content")).toBeInTheDocument();
  });
});
