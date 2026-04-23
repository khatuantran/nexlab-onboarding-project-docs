import { describe, it, expect } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { Routes, Route, useLocation } from "react-router-dom";
import { SearchInput } from "@/components/search/SearchInput";
import { renderWithRouter } from "../../lib/test-utils";

function LocationSpy() {
  const loc = useLocation();
  return <div data-testid="loc">{loc.pathname + loc.search}</div>;
}

function renderAt(path: string) {
  return renderWithRouter(
    <>
      <SearchInput />
      <Routes>
        <Route path="*" element={<LocationSpy />} />
      </Routes>
    </>,
    [path],
  );
}

describe("SearchInput", () => {
  it("submit with current project slug detected → navigate with projectSlug", async () => {
    const user = userEvent.setup();
    renderAt("/projects/demo/features/login-with-email");

    const input = screen.getByRole("searchbox");
    await user.type(input, "login{enter}");

    const loc = await screen.findByTestId("loc");
    expect(loc.textContent).toContain("/search");
    expect(loc.textContent).toContain("q=login");
    expect(loc.textContent).toContain("projectSlug=demo");
  });

  it("submit from /search standalone → navigate without projectSlug", async () => {
    const user = userEvent.setup();
    renderAt("/search");

    const input = screen.getByRole("searchbox");
    await user.type(input, "login{enter}");

    const loc = await screen.findByTestId("loc");
    expect(loc.textContent).toContain("q=login");
    expect(loc.textContent).not.toContain("projectSlug=");
  });

  it("empty input + Enter → no navigate (stays on current route)", async () => {
    const user = userEvent.setup();
    renderAt("/projects/demo");

    const input = screen.getByRole("searchbox");
    await user.click(input);
    await user.keyboard("{Enter}");

    const loc = screen.getByTestId("loc");
    expect(loc.textContent).toBe("/projects/demo");
  });
});
