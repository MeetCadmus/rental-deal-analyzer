import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { QuickFill } from "../QuickFill";
import { makeDeal } from "../../../domain/deal";
import { BLANK } from "../../../domain/defaults";

beforeEach(() => localStorage.clear());

function renderQuickFill(onAI = vi.fn()) {
  render(<QuickFill state={makeDeal(BLANK)} onListing={() => {}} onAI={onAI} onSource={() => {}} />);
  fireEvent.click(screen.getByText(/Auto-fill/i)); // expand the collapsible card
  return { onAI, ta: screen.getByPlaceholderText(/Paste the AI's JSON answer/i) };
}

test("rejects AI JSON with no usable fields (validation blocks the apply)", () => {
  const { onAI, ta } = renderQuickFill();
  fireEvent.change(ta, { target: { value: '{"foo":"bar"}' } });
  fireEvent.click(screen.getByText(/Apply AI estimate/i));
  expect(onAI).not.toHaveBeenCalled();
  expect(screen.getByText(/no usable fields/i)).toBeInTheDocument();
});

test("rejects non-JSON text", () => {
  const { onAI, ta } = renderQuickFill();
  fireEvent.change(ta, { target: { value: "not json at all" } });
  fireEvent.click(screen.getByText(/Apply AI estimate/i));
  expect(onAI).not.toHaveBeenCalled();
  expect(screen.getByText(/Couldn't read JSON/i)).toBeInTheDocument();
});

test("applies valid AI JSON through to onAI", () => {
  const { onAI, ta } = renderQuickFill();
  fireEvent.change(ta, { target: { value: '{"price":500000,"opinion":"solid"}' } });
  fireEvent.click(screen.getByText(/Apply AI estimate/i));
  expect(onAI).toHaveBeenCalledTimes(1);
  expect(onAI.mock.calls[0][0].price).toBe(500000);
});
