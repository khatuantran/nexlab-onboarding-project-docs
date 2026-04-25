import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AvatarStack } from "@/components/common/AvatarStack";

describe("AvatarStack", () => {
  it("renders nothing when names list is empty", () => {
    const { container } = render(<AvatarStack names={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows up to max avatars with no overflow chip", () => {
    render(<AvatarStack names={["Alice", "Bob"]} max={3} />);
    expect(screen.queryByLabelText(/người khác/i)).toBeNull();
  });

  it("renders +N chip when names exceed max", () => {
    render(<AvatarStack names={["Alice", "Bob", "Charlie", "Dave", "Eve"]} max={3} />);
    expect(screen.getByLabelText(/\+2 người khác/i)).toHaveTextContent("+2");
  });
});
