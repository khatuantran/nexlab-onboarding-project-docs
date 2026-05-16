import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { CircleDecor } from "@/components/patterns/CircleDecor";

describe("CircleDecor", () => {
  it("renders SVG with aria-hidden and 2 circles", () => {
    const { container } = render(<CircleDecor />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelectorAll("circle")).toHaveLength(2);
  });

  it("applies opacity prop via inline style", () => {
    const { container } = render(<CircleDecor opacity={0.4} />);
    const svg = container.querySelector("svg") as SVGSVGElement | null;
    expect(svg?.style.opacity).toBe("0.4");
  });

  it("uses currentColor so caller controls tint", () => {
    const { container } = render(<CircleDecor />);
    const circles = container.querySelectorAll("circle");
    circles.forEach((c) => {
      expect(c.getAttribute("fill")).toBe("currentColor");
    });
  });
});
