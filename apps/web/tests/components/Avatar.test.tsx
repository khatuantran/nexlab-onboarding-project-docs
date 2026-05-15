import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar } from "@/components/common/Avatar";

describe("Avatar (US-009 imageUrl extension)", () => {
  it("renders gradient initials when imageUrl is null", () => {
    const { container } = render(<Avatar name="Ngọc Linh" />);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText(/Ng/i)).toBeInTheDocument();
  });

  it("renders <img> with the Cloudinary src when imageUrl is set", () => {
    const url = "https://res.cloudinary.com/test/image/upload/v1/me.png";
    render(<Avatar name="Ngọc Linh" imageUrl={url} />);
    const img = screen.getByRole("img", { name: /ngọc linh/i }) as HTMLImageElement;
    expect(img.src).toBe(url);
  });
});
