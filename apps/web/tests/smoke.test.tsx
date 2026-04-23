import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "./lib/test-utils";
import { App } from "../src/App";

describe("App smoke (unauthenticated)", () => {
  it("redirects to /login and renders the login form", async () => {
    renderWithProviders(<App />);
    expect(await screen.findByRole("heading", { name: /đăng nhập/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });
});
