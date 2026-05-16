import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { ProgressRing } from "@/components/patterns/ProgressRing";

describe("ProgressRing — CR-006 v4 primitive", () => {
  it("renders svg role=img with aria-label reflecting pct", () => {
    const { container } = render(<ProgressRing pct={60} />);
    const svg = container.querySelector("svg[role='img']");
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute("aria-label")).toBe("Tiến độ 60%");
    expect(container.querySelectorAll("circle")).toHaveLength(2);
  });

  it("clamps pct outside 0-100 and 0 still renders 2 circles", () => {
    const { container, rerender } = render(<ProgressRing pct={-10} />);
    expect(container.querySelector("svg")?.getAttribute("aria-label")).toBe("Tiến độ 0%");
    rerender(<ProgressRing pct={150} />);
    expect(container.querySelector("svg")?.getAttribute("aria-label")).toBe("Tiến độ 100%");
  });

  it("size prop affects rendered width/height", () => {
    const { container } = render(<ProgressRing pct={50} size={88} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("88");
    expect(svg?.getAttribute("height")).toBe("88");
  });
});
