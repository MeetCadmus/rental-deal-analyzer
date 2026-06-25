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

test("toggles are keyboard-accessible Radix switches", async ({ page }) => {
  await page.goto(APP);
  const sw = page.getByRole("switch", { name: /Show unit details/ });
  await expect(sw).toHaveAttribute("aria-checked", "false");
  await sw.focus();
  await page.keyboard.press("Space");
  await expect(sw).toHaveAttribute("aria-checked", "true");
});

test("deals drawer is a Radix dialog: opens and closes on Escape", async ({ page }) => {
  await page.goto(APP);
  await page.getByTitle(/Browse, search & switch deals/).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/My deals/)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("overflow menu is a Radix dropdown: opens with menuitems, closes on Escape", async ({ page }) => {
  await page.goto(APP);
  await page.getByTitle("More actions").click();
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  expect(await page.getByRole("menuitem").count()).toBeGreaterThan(0);
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
});

test("a new deal can be created from the header", async ({ page }) => {
  await page.goto(APP);
  const switcher = page.getByTitle(/Browse, search & switch deals/);
  const before = await switcher.textContent();

  await page.getByTitle(/Start a new blank deal/).click();

  // The deal count in the switcher pill should increase.
  await expect(switcher).not.toHaveText(before ?? "");
});
