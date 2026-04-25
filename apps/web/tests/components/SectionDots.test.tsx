import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionDots } from "@/components/common/SectionDots";

describe("SectionDots", () => {
  it("aria-label reflects filled count", () => {
    render(<SectionDots filled={3} />);
    expect(screen.getByLabelText(/3\/5 sections có nội dung/i)).toBeInTheDocument();
  });

  it("supports custom total", () => {
    render(<SectionDots filled={1} total={3} />);
    expect(screen.getByLabelText(/1\/3 sections có nội dung/i)).toBeInTheDocument();
  });
});
