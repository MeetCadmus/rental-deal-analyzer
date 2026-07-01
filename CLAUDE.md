# CLAUDE.md — working notes for this repo

Context for any AI/dev session. Read this first, then the code is the source of truth.

## What this is

**Rental Deal Analyzer** — a single-page app for underwriting small multifamily / rental
deals (cash flow, cap rate, CoC, DSCR, IRR, projections, deal grade) with a multi-deal
workspace, optional cloud sync, an AI-assisted "Quick fill" flow, and shareable deal links.

- Live: https://meetcadmus.github.io/rental-deal-analyzer/ (GitHub Pages, **deployed via Actions**)
- Repo: MeetCadmus/rental-deal-analyzer

## Stack & build

- **React 18 + TypeScript (strict), built with Vite.** Tests run on **Vitest** (jsdom) +
  **Playwright** (e2e).
- This replaced the old single-file `fourplex_calculator.jsx` + Babel-in-browser loader
  (removed). There is now a real build step.
- **Key deps:** Zustand (state), zod (import validation), Radix UI (Switch / Dialog /
  DropdownMenu — accessible primitives), `@supabase/supabase-js` (lazy, optional sync).
  Tooling: ESLint (flat, type-aware) + Prettier + v8 coverage, all gated in CI.
- Styling is **CSS Modules** (`*.module.css` co-located with each component) for static
  chrome, with **dynamic values kept as inline styles** (score colors, bar widths, toggle
  state, etc.). Both reference the CSS-variable tokens from `theme.css`; in inline styles
  use the `C` token map (`src/presentation/theme/tokens.ts`), in CSS use `var(--c-*)`.
  Never raw hex. Add `:hover`/`:focus-visible`/media rules in the module, not inline.
  A few shared style **objects** (e.g. the header-button `hb` passed to `HeaderMenu`) stay
  inline because they're passed via props. Global responsive hooks (`.layout`,
  `.sticky-col`, `.mobile-bar`, `.no-print`, `.preset-grid`, `.ytable-scroll`,
  `.tap-sm`, `del-row-*`) live in `theme.css` and are composed alongside module classes.

## Architecture — Clean Architecture + light DDD (dependency rule: inward only)

```
src/
  domain/            # PURE finance core — no React/DOM. The ubiquitous language.
    money.ts           fmt/fmtD/fmtP/fmtX, clamp, num, lv, fmtGroup, editNumber
    time.ts            relTime, fmtWhen
    types.ts           Deal (aggregate), Unit, Financing, Closing, Expenses, Projection,
                       BaseMetrics, YearlyResult, DealScore, …
    defaults.ts        INIT, BLANK, DCC, DEX, CLASS_PRESETS
    examples.ts        EXAMPLES (Atlanta sample deals; `col` is a CSS-var string)
    deal.ts            fullState, makeDeal, dealTitle, uid, newDealId
    finance/           closing, expenses, computeBase, computeYearly,
                       computeSensitivity, scoring (calcDealScore/Killers/
                       whatNeedsToBeTrue/calcLoanOptions)
    index.ts           barrel
  infrastructure/    # side-effects; depends only on domain
    csv.ts  listing.ts  ai.ts  download.ts
    validation.ts               zod schemas: validateAIResult / validateDealImport (boundaries)
    storage/dealRepository.ts   persist/load + mergeDealStores + tombstones (DDD repository)
    storage/preferences.ts      theme / active-tab / collapsed-card prefs (localStorage)
    sync/supabase.ts            lazy @supabase/supabase-js (dynamic import) + fetch/push/auth
  application/       # React orchestration — no JSX
    workspaceStore.ts     Zustand store: deals/activeId/working deal/ui/user/sync/toast +
                          typed actions (CRUD, set*, applyAI, CSV/share, sign-in). The
                          App's "application service". `touched` is a non-reactive module var.
    useWorkspaceEffects.ts side-effects: autosave (store.subscribe), lazy Supabase sync, share import
    useMetrics.ts         selector hook → R/Y/SEN/score/title via useMemo on `state`
    uiState.ts            useTheme, useViewTab
  presentation/      # *.module.css co-located with each component (static chrome)
    theme/theme.css  theme/tokens.ts   (the single "Calm" theme; see below)
    ui/              Card, inputs (Field/MoneyInput/RentInput), Icon, HeaderMenu (Radix
                     DropdownMenu), ErrorBoundary, useGrouped, primitives (Tog=Radix Switch,
                     Pill/Bar/Info/SmBtn/SecLabel/PLRow/MBox)
    charts/          ChartBox, CashflowChart, EquityChart, ReturnDonut
    sections/        QuickFill, PropertyDetails, Units, Financing, ClosingCosts, Expenses,
                     Repairs, Projection, AreaInsights, ListingLink
    results/         OverviewTab, IncomeTab, ProjectionTab, AnalysisTab, CalcTrace, ProjTrace
    deals/           DealsDrawer (Radix Dialog), ScenarioCompare
  App.tsx            thin composition root (header + section components + results + drawer + toasts)
  main.tsx           ReactDOM root inside <ErrorBoundary>; imports theme.css
  e2e/               Playwright specs (run against the built preview)
```

Rule of thumb: **domain depends on nothing; infrastructure → domain; application →
domain + infrastructure; presentation → application + domain.** Keep the finance math in
`domain/` pure and React-free (it's what the tests pin). State lives in the **Zustand
workspace store** (no god-hook, no prop-drilling) — leaf components read it directly;
App is a thin composition.

## Run & test

```bash
npm install
npm run dev           # Vite dev server
npm test              # Vitest — math/helper + store/component suite (111 tests)
npm run typecheck     # tsc --noEmit (strict)
npm run lint          # ESLint (type-aware): rules-of-hooks, no-floating-promises, jsx-a11y
npm run lint:fix      # ESLint --fix
npm run format        # Prettier --write (printWidth 160; matches the dense inline style)
npm run format:check  # Prettier --check (CI gate)
npm run test:coverage # Vitest + v8 coverage (text + html report)
npm run build         # tsc --noEmit && vite build  → dist/
npm run preview       # serve the production build (base path /rental-deal-analyzer/)
```

- **Two CI jobs** (`.github/workflows/ci.yml`): the required **`Typecheck · Test · Build`**
  (typecheck → lint → format:check → test → build) and a separate non-blocking
  **`E2E (Playwright)`** (installs chromium, runs `test:e2e`). Lint **errors** fail CI;
  `any` and the remaining structural-a11y findings are **warnings** (tracked, non-blocking).
  Run `npm run lint` & `npm run format` before pushing.

- Domain/infra tests live in `src/**/__tests__/*.test.ts` and import via `src/test/barrel.ts`
  (a re-export of domain + infra) using a shared `close`/`pmtOf` helper in `src/test/util.ts`.
  Component/integration tests (`@testing-library`, jsdom) and the Playwright e2e specs
  (`e2e/*.spec.ts`, run against the built `vite preview`) round out the suite (~111 total).
- **Always keep the finance math behavior identical** unless intentionally changing it —
  the math tests are the guard. Add a test when you touch a pure function.

## Theme (single "Calm" look)

- One theme — **Calm** (Apple/Claude/Google spirit: warm off-white canvas, near-black text,
  one muted clay accent). It's the base `:root` in `theme.css`; **dark mode** via
  `html[data-theme="dark"]`. (The old multi-skin switcher was removed.)
- Components style static chrome via CSS Modules and dynamic bits inline, both on the
  `var(--c-*)` tokens (via `C` in inline styles). Treatment vars:
  `--c-rad` (radius), `--c-head`/`--c-headfg`/`--c-headborder` (card/header chrome),
  `--c-fdisp`/`--c-fui` (fonts), `--c-ring` (focus). No emoji in chrome — use `<Icon name=…/>`.
- Fonts (Inter + Playfair Display) load from Google Fonts in `index.html`.

## Data model (a "deal")

Working state `S` (see `INIT` in `domain/defaults.ts`): `address, notes, listingUrl, insights,
aiSource/aiAt, price, otherIncome, units[], financing, closing(DCC), expenses(DEX), projection,
repairs, partnership, comparables[]`.

- **Deals library**: array of deals, each with `_id, _label, _ts, _created, _fav` (favorite
  flag — toggled via `toggleFav`, filterable in the drawer; metadata, so it never bumps `_ts`),
  persisted to
  `localStorage` (`re_deals_v1`) via `dealRepository`, optionally synced to Supabase.
  Deletions use **tombstones** so they stick and propagate. `+ New deal` uses `BLANK`.
- **Active deal in the URL**: `?deal=<id>` (see `infrastructure/dealUrl.ts`) pins each browser
  tab to its own deal. The store reads it on boot (overriding the shared last-active id from
  `localStorage`); `useWorkspaceEffects` keeps it in sync via `replaceState` on `activeId`
  change — so a refresh reloads the same deal per tab. Distinct from the share `#deal=<csv>` hash.
- **Expenses are stored ANNUAL** (`expenses.v === 2`); `migrateExpenses` upgrades old data.
- Opening/switching a deal must NOT bump `_ts` — only real edits do. The autosave lives in
  `useWorkspaceEffects` (a `store.subscribe` on `state`): switch/open actions set the
  non-reactive `touched` flag false **before** changing `state`, so the subscriber writes
  the deal back without bumping `_ts`. (An e2e test pins this.)
- **Cross-tab safety**: the autosave re-reads the current on-disk store (`readPersistedStore`)
  and replaces only the **active** deal before writing, so a second tab editing a _different_
  deal isn't clobbered. A `storage`-event listener refreshes the in-memory list when another
  tab writes, keeping this tab's active deal (its unsaved edits) intact. Paired with the
  `?deal=<id>` per-tab URL above.
- `EGI = GPI − vacancy + otherIncome`. Closing "transfer/deed tax" is an editable % of price
  (state-neutral — no Georgia assumptions baked in).

## Quick fill / share / AI

- `parseListing`/`addressFromUrl` (infra) read a Zillow link → address/price/units. **Copy AI
  prompt** (`buildAIPrompt`) also fills from the link, then copies a prompt; paste the AI's JSON
  back → `parseAIResult` → **`validateAIResult` (zod)** → `applyAI`. The prompt asks the model
  to self-report its name + tier.
- **Share link**: `#deal=<csv>` (reuses `stateToCSV`/`csvToState`); opening it adds the deal.
- Untrusted imports (AI JSON, CSV, share links) pass through **zod** (`validation.ts`):
  `validateAIResult` / `validateDealImport` reject garbage with a user-facing message
  (toast, or QuickFill's inline message) instead of creating a broken deal.
- These helpers are pure/testable (`src/infrastructure/__tests__`).

## Deploy

- **GitHub Pages via Actions.** `.github/workflows/deploy.yml` builds `dist/` and publishes on
  push to `main`. Pages "Source" is set to **GitHub Actions** (not branch). `vite.config.ts`
  sets `base: '/rental-deal-analyzer/'`. `public/config.js` carries the optional Supabase keys
  (safe to commit) and is loaded via `%BASE_URL%config.js`.

## Dev workflow (please follow)

`main` is **protected** — direct pushes blocked; CI (the **`Typecheck · Test · Build`** job in
`ci.yml`) must pass. So:

1. `git checkout -b <type>/<short-name>`
2. make the change in the right layer (+ tests if domain/infra logic changed)
3. verify: `npm run typecheck && npm test && npm run build` all green
4. `git commit` (end message with the Co-Authored-By trailer), push, `gh pr create`
5. `gh pr checks <n> --watch` → `gh pr merge <n> --squash --delete-branch`
6. `git checkout main && git fetch -p && git reset --hard origin/main`

- Merge auto-deploys via Actions. Commit author identity is `Maksym Andreiev <vipmindwalker@gmail.com>`.

## Conventions

- Numbers in inputs use `Field` / `MoneyInput` / `RentInput` (live comma grouping, caret-safe
  via `useGrouped`). Don't reintroduce raw `type=number`.
- Tooltips: `<Info lines={[…]} />` (viewport-clamped, flips below near the top). Section forms:
  `Card` (collapsible, remembers state) + `SecLabel`.
- Mobile-first: single column under 680px; grids use `minmax(0,1fr)`. Keep `no-print`/`sticky-col`/
  `mobile-bar`/`tap-sm`/`del-row-*` class hooks intact (CSS in `theme.css`).
- Prefer small, reviewable PRs; keep the dependency rule (don't import presentation from domain).
