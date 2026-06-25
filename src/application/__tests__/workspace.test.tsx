import { render, screen, fireEvent, act } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import App from "../../App";
import { useWorkspace } from "../workspaceStore";

const KEY = "re_deals_v1";
const read = () => JSON.parse(localStorage.getItem(KEY)!);

beforeEach(() => {
  localStorage.clear();
  // Reset the singleton store to a clean default deal so tests don't bleed state.
  const fresh = useWorkspace.getState();
  act(() => { fresh.newDeal(); });
});

test("App mounts and persists a default deal", () => {
  render(<App />);
  const store = read();
  expect(Array.isArray(store.deals)).toBe(true);
  expect(store.deals.length).toBeGreaterThan(0);
  // The deal switcher button shows the active title.
  expect(screen.getByTitle(/Browse, search & switch deals/i)).toBeInTheDocument();
});

test("editing the address autosaves through the store subscriber", () => {
  render(<App />);
  const addr = screen.getByPlaceholderText(/Maple St/i) as HTMLInputElement;
  act(() => { fireEvent.change(addr, { target: { value: "999 Verify Ave" } }); });
  const active = read();
  const deal = active.deals.find((d: any) => d._id === active.activeId);
  expect(deal.address).toBe("999 Verify Ave");
});

test("+ New deal adds a deal; switching back does NOT bump the prior deal's _ts", async () => {
  render(<App />);
  const before = read();
  const firstId = before.activeId;
  const firstTs = before.deals.find((d: any) => d._id === firstId)._ts;

  // Create a second deal via the header button.
  act(() => { fireEvent.click(screen.getByTitle(/Start a new blank deal/i)); });
  let after = read();
  expect(after.deals.length).toBe(before.deals.length + 1);
  expect(after.activeId).not.toBe(firstId);

  // Switch back to the first deal — a switch must not count as an edit.
  await act(async () => { useWorkspace.getState().switchDeal(firstId); });
  after = read();
  const firstAfter = after.deals.find((d: any) => d._id === firstId);
  expect(firstAfter._ts).toBe(firstTs);
});
