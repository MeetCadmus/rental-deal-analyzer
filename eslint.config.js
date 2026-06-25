import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-config-prettier";
import globals from "globals";

// a11y findings are surfaced as warnings (visible, tracked) rather than build-breaking:
// the hand-rolled toggle/dialog/menu primitives are slated for accessible Radix
// replacements, which will resolve them holistically.
const a11yWarn = Object.fromEntries(Object.keys(jsxA11y.flatConfigs.recommended.rules).map((k) => [k, "warn"]));

export default tseslint.config(
  { ignores: ["dist", "node_modules", "coverage", "e2e", "playwright-report", "test-results", "*.config.js", "config.js"] },

  // ── Application source: type-aware linting (catches real bugs) ──
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.browser },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Experimental react-hooks@7 rules — too noisy / not yet standard. Keep the
      // battle-tested rules-of-hooks + exhaustive-deps, drop the rest.
      "react-hooks/refs": "off",
      "react-hooks/static-components": "off",
      "react-hooks/immutability": "off",
      // tsc already enforces unused locals; let it own that.
      "@typescript-eslint/no-unused-vars": "off",
      // `any` is tolerated at a few external boundaries — flag, don't fail the build.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      // empty catch blocks are intentional (best-effort localStorage / clipboard).
      "no-empty": ["error", { allowEmptyCatch: true }],
      // real-bug rules we DO want to fail on:
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
    },
  },

  // ── JSX accessibility (presentation only) — surfaced as warnings ──
  {
    files: ["src/presentation/**/*.tsx"],
    plugins: jsxA11y.flatConfigs.recommended.plugins,
    rules: {
      ...a11yWarn,
      // Deprecated and redundant with label-has-associated-control (which we keep).
      "jsx-a11y/label-has-for": "off",
    },
  },

  // ── Tests: ported 1:1 from the old JS suite (carry @ts-nocheck) — relax. ──
  {
    files: ["src/**/*.test.{ts,tsx}", "src/test/**/*.{ts,tsx}"],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: { ...globals.node } },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "no-empty": "off",
    },
  },

  prettier,
);
