import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "./lib/test-utils";
import { App } from "../src/App";

describe("App smoke", () => {
  it("renders 'Onboarding Portal' heading", () => {
    renderWithProviders(<App />);
    expect(screen.getByRole("heading", { name: /onboarding portal/i })).toBeInTheDocument();
  });

  it("renders placeholder copy for M1", () => {
    renderWithProviders(<App />);
    expect(screen.getByText(/implementation in progress/i)).toBeInTheDocument();
  });
});
