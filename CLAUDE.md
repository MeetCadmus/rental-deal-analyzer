# CLAUDE.md — working notes for this repo

Context for any AI/dev session. Read this first, then the code is the source of truth.

## What this is
**Rental Deal Analyzer** — a single-page app for underwriting small multifamily / rental
deals (cash flow, cap rate, CoC, DSCR, IRR, projections, deal grade) with a multi-deal
workspace, optional cloud sync, and an AI-assisted "Quick fill" flow.

- Live: https://meetcadmus.github.io/rental-deal-analyzer/ (GitHub Pages, auto-deploys from `main`)
- Repo: MeetCadmus/rental-deal-analyzer

## Architecture (important quirks)
- **Almost everything lives in one file: `fourplex_calculator.jsx`** (~1,700 lines: helpers,
  React components, the App, and all the finance math). Keep new code there unless there's a
  strong reason not to.
- **No build step.** `index.html` fetches the `.jsx`, rewrites `import {…} from "react"` into a
  destructure from the global `React`, strips `export default`, and compiles with
  **Babel standalone (classic runtime)** in the browser. React/ReactDOM/Babel load from CDNs.
- **Styling is inline** via a `C` palette of **CSS variables** (light/dark themes in `THEME_CSS`).
  Use `C.*` tokens, not raw hex. Dark mode toggles `data-theme` on `<html>`.
- `config.js` holds optional public Supabase keys (safe to commit). `supabase/` has the
  migration + setup notes (`SUPABASE.md`). Sync is dormant unless keys are present.

## Run & test
```bash
npm install        # only dep: @babel/standalone
npm test           # node --test — the math/logic suite (currently ~93 tests)
python3 -m http.server 8000   # then open http://localhost:8000 (file:// won't work)
```
- Tests load the pure functions out of the JSX via the same Babel transform the browser uses
  (`test-harness.js`). To make a function testable, add its name to the `exportNames` list in
  `test-harness.js` and write a `test/*.test.js`.
- **`test-harness.js` lives at the repo root**, not in `test/`, so "run all in test/" never tries
  to execute it.
- Quick sanity render (no browser): compile the file and `renderToString` the App with stubbed
  `window`/`document`/`localStorage` (see the inline `node -e` snippets used in history).

## Dev workflow (please follow)
`main` is **protected** — direct pushes are blocked; CI (`npm test`) must pass. So:
1. `git checkout -b <type>/<short-name>`
2. make the change **in `fourplex_calculator.jsx`** (+ tests if logic changed)
3. verify: `npm test` green **and** the file still compiles/renders
4. `git commit` (end message with the Co-Authored-By trailer), push, `gh pr create`
5. `gh pr checks <n> --watch` → `gh pr merge <n> --squash --delete-branch`
6. `git checkout main && git fetch -p && git reset --hard origin/main`
- Pages redeploys automatically; Safari caches the `.jsx`, so hard-refresh / reopen the tab to see changes.
- Commit author identity is `Maksym Andreiev <vipmindwalker@gmail.com>`.

## Data model (a "deal")
Working state `S` (see `INIT`): `address, notes, listingUrl, insights, aiSource/aiAt, price, units[],
financing{downPct,rate,loanYears,reserveMonths}, closing(DCC), expenses(DEX), projection{…},
repairs{…}, partnership{…}, comparables[]`.
- **Deals library**: array of deals, each with `_id, _label, _ts, _created`, persisted to
  `localStorage` (`re_deals_v1`) and optionally Supabase. `+ New deal` uses the **`BLANK`**
  template (sensible defaults but empty property fields). Deletions use **tombstones** (`TOMB`)
  so they stick and sync.
- **Expenses are stored ANNUAL** (`expenses.v === 2`); `migrateExpenses()` upgrades old per-mo data.
- `fullState(d)` merges a partial deal over defaults (and migrates). `computeBase` / `computeYearly`
  / `computeSensitivity` are the pure metric engines — covered by tests; change them carefully.

## Quick fill / AI round-trip
- Capture: paste a Zillow **link** (or text) → `parseListing` (uses `addressFromUrl` for the
  URL slug) fills address/price/units/`listingUrl`. Or **Copy AI prompt** (`buildAIPrompt`,
  embeds the link) → run in any chat AI → paste its JSON → `parseAIResult` (tolerant of smart
  quotes / NBSP / code fences / trailing commas) → `applyAI` fills units+rents, itemized
  expenses, financing rate/refi, closing %, projection (appreciation/rent-growth/exit cap),
  `insights`, the opinion (→ notes), and `aiSource` (the model names itself; blank if unsure).
- `parseListing` / `addressFromUrl` / `buildAIPrompt` / `parseAIResult` are pure and **tested**.
- **Area & due-diligence** (`insights`) is editable and **non-math** (informational only);
  collapses to a slim "add" bar when empty.
- `+ New deal` uses `BLANK` (empty property fields) so the prompt isn't seeded with fake
  "known" values; `QuickFill` is keyed by `activeId` so its inputs reset per deal.

## Conventions
- Numbers in inputs use `Field` / `MoneyInput` / `RentInput` (live comma grouping, caret-safe,
  `useGrouped`). Don't reintroduce raw `type=number`.
- Tooltips: `<Info lines={[…]} />` (viewport-clamped). Sectioned forms: `SecLabel` with a subtotal.
- Keep changes mobile-first (the layout is single-column under 680px; grids use `minmax(0,1fr)`).
- Prefer small, reviewable PRs; add a test whenever you touch the math or a pure helper.
