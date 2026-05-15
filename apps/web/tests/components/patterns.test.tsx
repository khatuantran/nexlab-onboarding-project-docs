import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import {
  BlobBackdrop,
  DotField,
  GradientMesh,
  GridPattern,
  WaveDivider,
} from "@/components/patterns";

describe("pattern primitives", () => {
  it("BlobBackdrop renders SVG with aria-hidden", () => {
    const { container } = render(<BlobBackdrop tone="blue" size="lg" opacity={0.2} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.getAttribute("width")).toBe("480");
  });

  it("GridPattern renders SVG with mask gradient class", () => {
    const { container } = render(<GridPattern tone="green" density="tight" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.className.baseVal).toContain("[mask-image:");
  });

  it("GradientMesh renders div with multi-radial background", () => {
    const { container } = render(<GradientMesh tones={["primary", "purple", "cyan"]} />);
    const div = container.querySelector("div");
    expect(div).toBeInTheDocument();
    expect(div?.getAttribute("aria-hidden")).toBe("true");
    const bgImage = (div as HTMLElement).style.backgroundImage;
    expect(bgImage).toContain("radial-gradient");
    expect(bgImage.match(/radial-gradient/g)?.length).toBe(3);
  });

  it("WaveDivider rotates when flip=true", () => {
    const { container } = render(<WaveDivider flip />);
    const svg = container.querySelector("svg");
    expect(svg?.className.baseVal).toContain("rotate-180");
  });

  it("DotField renders N circles deterministically", () => {
    const { container, rerender } = render(<DotField count={10} />);
    const circles1 = container.querySelectorAll("circle");
    expect(circles1).toHaveLength(10);
    const first1 = circles1[0].getAttribute("cx");
    rerender(<DotField count={10} />);
    const first2 = container.querySelectorAll("circle")[0].getAttribute("cx");
    expect(first1).toBe(first2);
  });

  it("ignores tones beyond 3 in GradientMesh", () => {
    const { container } = render(
      <GradientMesh tones={["primary", "blue", "green", "purple", "pink"]} />,
    );
    const div = container.querySelector("div") as HTMLElement;
    expect(div.style.backgroundImage.match(/radial-gradient/g)?.length).toBe(3);
  });
});
