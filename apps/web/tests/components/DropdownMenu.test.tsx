import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

describe("DropdownMenu primitive", () => {
  it("opens on trigger click and exposes role=menu + items", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="actions">⋯</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Sửa</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Lưu trữ</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    expect(screen.queryByRole("menu")).toBeNull();
    await user.click(screen.getByLabelText("actions"));

    const menu = await screen.findByRole("menu");
    expect(menu).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Sửa" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Lưu trữ" })).toBeInTheDocument();
  });

  it("invokes onSelect when an item is clicked", async () => {
    const user = userEvent.setup();
    let selected = "";
    render(
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="actions">⋯</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => (selected = "edit")}>Sửa</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByLabelText("actions"));
    await user.click(await screen.findByRole("menuitem", { name: "Sửa" }));
    expect(selected).toBe("edit");
  });
});
