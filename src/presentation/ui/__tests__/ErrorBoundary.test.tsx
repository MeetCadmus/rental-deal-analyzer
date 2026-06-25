import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { ErrorBoundary } from "../ErrorBoundary";

function Boom(): never { throw new Error("kaboom"); }

test("renders children when they don't throw", () => {
  render(<ErrorBoundary><div>safe child</div></ErrorBoundary>);
  expect(screen.getByText("safe child")).toBeInTheDocument();
});

test("shows the recovery fallback when a child throws", () => {
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  render(<ErrorBoundary><Boom /></ErrorBoundary>);
  expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Reload/i })).toBeInTheDocument();
  spy.mockRestore();
});
