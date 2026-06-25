# Rental Deal Analyzer

[![CI](https://github.com/MeetCadmus/rental-deal-analyzer/actions/workflows/ci.yml/badge.svg)](https://github.com/MeetCadmus/rental-deal-analyzer/actions/workflows/ci.yml)

A fast, single-file React app for analyzing small multifamily / rental investment deals.
Built around an Atlanta market default set, but the math is general — paste a property's
numbers and get cash flow, returns, projections, and a deal grade in real time.

> Educational tool. Not financial, legal, or tax advice.

## Features

- **Full underwriting** — income waterfall (GPI → vacancy → EGI → NOI), financing, and
  cash-on-cash, cap rate, DSCR, GRM, the 1% rule, break-even occupancy/rent.
- **Quick or itemized expenses & closing costs**, including Georgia statutory taxes
  (intangible / transfer / flat) and prepaids/escrows.
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
- **Import / export** — single deal as CSV (Excel-friendly) or your whole portfolio as JSON.
- **Dark mode**, mobile-optimized layout, and print/PDF output.

## Run it

No build step. Serve the folder and open `index.html` (it loads the JSX and compiles it in
the browser via Babel standalone):

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly via `file://` will not work because it fetches the `.jsx`
over HTTP — use a local server as above.

## Tests

The financial math is covered by a Node test suite (no browser needed). It loads the pure
functions out of the app using the same Babel transform the browser uses.

```bash
npm install
npm test
```

## Project layout

| Path                      | What it is                                                                              |
| ------------------------- | --------------------------------------------------------------------------------------- |
| `index.html`              | Loader: fetches the JSX, rewrites the React import, compiles with Babel, mounts the app |
| `fourplex_calculator.jsx` | The entire app — math, components, and state                                            |
| `test-harness.js`         | Loads the app's pure functions for testing                                              |
| `test/*.test.js`          | Math/metrics test suites (`node --test`)                                                |

## Data & privacy

All deals are stored locally in your browser (`localStorage`) — nothing is uploaded.
Use **Export all** to back up your portfolio or move it to another browser/device.
