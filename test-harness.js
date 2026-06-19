"use strict";
// Loads the pure math/helpers out of the single-file React app the SAME way
// index.html does in the browser (rewrite the react import, strip the default
// export, compile JSX with @babel/standalone), then returns them for testing.
// No component is rendered here — only the exported functions are exercised.
const fs = require("fs");
const path = require("path");
const Babel = require("@babel/standalone");

function loadModule() {
  const file = path.join(__dirname, "fourplex_calculator.jsx");
  let src = fs.readFileSync(file, "utf8");

  // 1) `import { ... } from "react"` -> destructure from the injected React
  src = src.split("\n").map(function (l) {
    const t = l.trim();
    if (t.slice(0, 7) !== "import ") return l;
    const m = t.match(/^import\s*\{([^}]*)\}\s*from\s*["']react["']/);
    if (m) return "const {" + m[1] + "} = React;";
    return "";
  }).join("\n");

  // 2) drop `export default`
  src = src.replace(/export\s+default\s+/g, "");

  // 3) compile JSX (classic runtime, identical to the browser loader)
  const js = Babel.transform(src, { presets: [["react", { runtime: "classic" }]] }).code;

  const exportNames = [
    "computeBase", "computeYearly", "computeSensitivity",
    "calcDealScore", "calcKillers", "whatNeedsToBeTrue", "calcLoanOptions",
    "calcCC", "calcExp",
    "flattenState", "unflattenState", "coerceVal", "stateToCSV", "csvToState", "parseCSV",
    "fullState", "makeDeal", "dealTitle", "relTime", "mergeDealStores",
    "INIT", "DCC", "DEX", "CLASS_PRESETS", "EXAMPLES",
    "fmt", "fmtD", "fmtP", "fmtX", "clamp", "num", "lv",
  ];
  const body = js + "\nreturn {" + exportNames.join(",") + "};";

  // Stubs — only needed so the module evaluates; no component is invoked.
  const React = {
    createElement: function () { return null; },
    Fragment: "Fragment",
    useState: function (v) { return [typeof v === "function" ? v() : v, function () {}]; },
    useMemo: function (f) { return f(); },
    useCallback: function (f) { return f; },
    useEffect: function () {},
    useRef: function (v) { return { current: v }; },
  };
  const noStore = { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} };
  const win = { matchMedia: function () { return { matches: false }; }, print: function () {} };
  const doc = {
    createElement: function () { return { click: function () {} }; },
    getElementById: function () { return {}; },
    body: { appendChild: function () {}, removeChild: function () {} },
    documentElement: { setAttribute: function () {}, getAttribute: function () {} },
  };

  return new Function("React", "localStorage", "window", "document", body)(React, noStore, win, doc);
}

const M = loadModule();

// shared assertion helper
M.close = function close(assert, actual, expected, eps, msg) {
  if (eps == null) eps = 1e-6;
  assert.ok(
    Math.abs(actual - expected) <= eps,
    (msg ? msg + ": " : "") + "expected " + actual + " ≈ " + expected + " (±" + eps + ")"
  );
};

// canonical mortgage payment, re-derived independently for cross-checks
M.pmtOf = function pmtOf(loan, annualRatePct, years) {
  const i = annualRatePct / 100 / 12, n = years * 12;
  return i === 0 ? loan / n : loan * i * Math.pow(1 + i, n) / (Math.pow(1 + i, n) - 1);
};

module.exports = M;
