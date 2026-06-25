# Rental Deal Analyzer

[![CI](https://github.com/MeetCadmus/rental-deal-analyzer/actions/workflows/ci.yml/badge.svg)](https://github.com/MeetCadmus/rental-deal-analyzer/actions/workflows/ci.yml)

A React + TypeScript single-page app for underwriting small multifamily / rental
investment deals. Built around an Atlanta market default set, but the math is general —
paste a property's numbers and get cash flow, returns, projections, and a deal grade in
real time.

**Live:** <https://meetcadmus.github.io/rental-deal-analyzer/>

> Educational tool. Not financial, legal, or tax advice.

## Features

- **Full underwriting** — income waterfall (GPI → vacancy → EGI → NOI), financing, and
  cash-on-cash, cap rate, DSCR, GRM, the 1% rule, break-even occupancy/rent.
- **Quick or itemized expenses & closing costs**, including state transfer/recording taxes
  and prepaids/escrows (state-neutral — no Georgia assumptions baked in).
- **Multi-year projection** — amortization, rent growth, appreciation **or exit-cap**
  valuation, configurable selling costs, refinance and value-add scenarios, IRR, and a
  total-return breakdown.
- **Charts** — cumulative cash position (with payback year), equity vs. loan balance, and
  a return-components donut, all with hover/tap tooltips.
- **Deal scoring** (A–D) and automatic "deal killer" flags.
- **Analysis tools** — price/rate and rent sensitivity grids, "what needs to be true" to
  hit a target, and a loan-type comparison.
- **Multi-deal workspace** — every property auto-saves to your browser; search, switch,
  rename, duplicate, delete (with undo), and **compare deals side-by-side** ranked by any
  metric.
- **AI-assisted quick fill** — paste a Zillow link, copy a prompt to any chat AI, paste its
  JSON answer back (validated before it's applied).
- **Import / export** — single deal as CSV (Excel-friendly) or your whole portfolio as JSON;
  shareable `#deal=…` links.
- **Optional cloud sync** (Supabase + Google sign-in) — see [SUPABASE.md](SUPABASE.md).
- **Dark mode**, accessible (Radix) primitives, mobile-optimized layout, and print/PDF output.

## Develop

```bash
npm install
npm run dev          # Vite dev server
npm run build        # tsc --noEmit && vite build → dist/
npm run preview      # serve the production build at the /rental-deal-analyzer/ base path
```

Quality gates (also run in CI):

```bash
npm run typecheck    # tsc --noEmit (strict)
npm run lint         # ESLint (type-aware): rules-of-hooks, no-floating-promises, jsx-a11y
npm run format       # Prettier --write   (format:check verifies)
npm test             # Vitest — domain math + component/integration suite (jsdom)
npm run test:coverage
npm run test:e2e     # Playwright e2e against the built preview
```

## Architecture

Clean Architecture + light DDD (dependency rule points inward). See
[CLAUDE.md](CLAUDE.md) for the full map.

| Layer                | What lives there                                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------------------------- |
| `src/domain`         | Pure finance core — money/time helpers, types, the compute\* engine, scoring. No React.                         |
| `src/infrastructure` | CSV / listing / AI parsing, zod import validation, localStorage repository (tombstones), lazy Supabase sync.    |
| `src/application`    | Zustand workspace store + side-effect hooks (autosave, sync) + derived-metrics selector.                        |
| `src/presentation`   | UI primitives, charts, input sections, results tabs, deals drawer/compare — styled with co-located CSS Modules. |
| `src/App.tsx`        | Thin composition root. `e2e/` holds the Playwright specs.                                                       |

## Deploy

Pushes to `main` deploy to GitHub Pages via Actions (`.github/workflows/deploy.yml`).
`vite.config.ts` sets `base: '/rental-deal-analyzer/'`.

## Data & privacy

All deals are stored locally in your browser (`localStorage`) — nothing is uploaded unless
you opt into cloud sync. Use **Export all** to back up your portfolio or move it to another
browser/device.
