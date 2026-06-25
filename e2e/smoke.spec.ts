import { test, expect } from "@playwright/test";

const APP = "/rental-deal-analyzer/";

test("app loads, shows results, and persists an edit across reload", async ({ page }) => {
  await page.goto(APP);

  // Header + results render (proves the store/metrics/effects wired up).
  await expect(page.getByText("Investment Property Analyzer")).toBeVisible();
  // "Deal score" also appears in the (hidden) mobile bar, so scope to the visible one.
  await expect(page.getByText("Deal score").first()).toBeVisible();

  // Edit the address; autosave should persist it.
  const addr = page.getByPlaceholder(/Maple St/);
  await addr.fill("999 E2E Ave");
  await expect(addr).toHaveValue("999 E2E Ave");

  // Reload — the edit survives (localStorage autosave).
  await page.reload();
  await expect(page.getByPlaceholder(/Maple St/)).toHaveValue("999 E2E Ave");
});

test("a new deal can be created from the header", async ({ page }) => {
  await page.goto(APP);
  const switcher = page.getByTitle(/Browse, search & switch deals/);
  const before = await switcher.textContent();

  await page.getByTitle(/Start a new blank deal/).click();

  // The deal count in the switcher pill should increase.
  await expect(switcher).not.toHaveText(before ?? "");
});
