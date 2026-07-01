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
  act(() => {
    fresh.newDeal();
  });
});

test("App mounts and persists a default deal", () => {
  render(<App />);
  const store = read();
  expect(Array.isArray(store.deals)).toBe(true);
  expect(store.deals.length).toBeGreaterThan(0);
  // The deal switcher button shows the active title.
  expect(screen.getByTitle(/Browse, search & switch deals/i)).toBeInTheDocument();
});

test("the active deal id is reflected in ?deal= and updates when the deal changes", () => {
  render(<App />);
  const dealParam = () => new URLSearchParams(location.search).get("deal");
  const before = read();
  expect(dealParam()).toBe(before.activeId); // mount syncs the URL to the active deal

  act(() => {
    fireEvent.click(screen.getByTitle(/Start a new blank deal/i));
  });
  const after = read();
  expect(after.activeId).not.toBe(before.activeId);
  expect(dealParam()).toBe(after.activeId); // switching updates the URL

  // Switching back updates it again — each tab's URL tracks its own deal.
  act(() => {
    useWorkspace.getState().switchDeal(before.activeId);
  });
  expect(dealParam()).toBe(before.activeId);
});

test("editing the address autosaves through the store subscriber", () => {
  render(<App />);
  const addr = screen.getByPlaceholderText(/Maple St/i) as HTMLInputElement;
  act(() => {
    fireEvent.change(addr, { target: { value: "999 Verify Ave" } });
  });
  const active = read();
  const deal = active.deals.find((d: any) => d._id === active.activeId);
  expect(deal.address).toBe("999 Verify Ave");
});

test("toggleFav flips a deal's favorite flag, persists it, and does NOT bump _ts", async () => {
  render(<App />);
  const before = read();
  const id = before.activeId;
  const ts = before.deals.find((d: any) => d._id === id)._ts;

  await act(async () => {
    useWorkspace.getState().toggleFav(id);
  });
  let after = read();
  let deal = after.deals.find((d: any) => d._id === id);
  expect(deal._fav).toBe(true);
  expect(deal._ts).toBe(ts); // favoriting is metadata — must not count as an edit

  // Toggling again clears it.
  await act(async () => {
    useWorkspace.getState().toggleFav(id);
  });
  after = read();
  deal = after.deals.find((d: any) => d._id === id);
  expect(deal._fav).toBe(false);
});

test("a favorited deal keeps its flag after the active deal is edited", () => {
  render(<App />);
  const id = read().activeId;
  act(() => {
    useWorkspace.getState().toggleFav(id);
  });
  // Edit the active deal — autosave folds `state` back over the deal.
  const addr = screen.getByPlaceholderText(/Maple St/i) as HTMLInputElement;
  act(() => {
    fireEvent.change(addr, { target: { value: "1 Favorite Way" } });
  });
  const deal = read().deals.find((d: any) => d._id === id);
  expect(deal._fav).toBe(true);
  expect(deal.address).toBe("1 Favorite Way");
});

test("applyAI: itemized closing costs switch closing to detailed mode and fill line items", () => {
  render(<App />);
  act(() => {
    useWorkspace.getState().applyAI({
      closing: { origPct: 1, transferTaxPct: 0.4, attyFee: 1500, prepaidDays: 20, taxEscrowMonths: 4 },
    });
  });
  const cc = useWorkspace.getState().state.closing;
  expect(cc.mode).toBe("detailed");
  expect(cc.origPct).toBe(1);
  expect(cc.transferTaxPct).toBe(0.4);
  expect(cc.attyFee).toBe(1500);
  expect(cc.prepaidDays).toBe(20);
  expect(cc.taxEscrowMonths).toBe(4);
});

test("applyAI: climate hazards are stored under insights.climate", () => {
  render(<App />);
  act(() => {
    useWorkspace.getState().applyAI({
      climate: { floodZone: "Zone AE — high", elevation: "~8 ft, coastal", storms: "hurricane-prone", history: "flooded 2017" },
    });
  });
  const ins = useWorkspace.getState().state.insights as any;
  expect(ins.climate.floodZone).toBe("Zone AE — high");
  expect(ins.climate.elevation).toBe("~8 ft, coastal");
  expect(ins.climate.storms).toBe("hurricane-prone");
  expect(ins.climate.history).toBe("flooded 2017");
});

test("applyAI: climate merges without clobbering existing insights", () => {
  render(<App />);
  act(() => {
    useWorkspace.getState().applyAI({ insights: { neighborhoodGrade: "B", safety: "low crime" } });
    useWorkspace.getState().applyAI({ climate: { floodZone: "Zone X" } });
  });
  const ins = useWorkspace.getState().state.insights as any;
  expect(ins.neighborhoodGrade).toBe("B");
  expect(ins.climate.floodZone).toBe("Zone X");
});

test("applyAI: a legacy closingPct still maps to quick mode", () => {
  render(<App />);
  act(() => {
    useWorkspace.getState().applyAI({ closingPct: 3.5 });
  });
  const cc = useWorkspace.getState().state.closing;
  expect(cc.mode).toBe("quick");
  expect(cc.quickPct).toBe(3.5);
});

test("+ New deal adds a deal; switching back does NOT bump the prior deal's _ts", async () => {
  render(<App />);
  const before = read();
  const firstId = before.activeId;
  const firstTs = before.deals.find((d: any) => d._id === firstId)._ts;

  // Create a second deal via the header button.
  act(() => {
    fireEvent.click(screen.getByTitle(/Start a new blank deal/i));
  });
  let after = read();
  expect(after.deals.length).toBe(before.deals.length + 1);
  expect(after.activeId).not.toBe(firstId);

  // Switch back to the first deal — a switch must not count as an edit.
  await act(async () => {
    useWorkspace.getState().switchDeal(firstId);
  });
  after = read();
  const firstAfter = after.deals.find((d: any) => d._id === firstId);
  expect(firstAfter._ts).toBe(firstTs);
});
