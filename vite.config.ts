/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves the project at /rental-deal-analyzer/.
export default defineConfig({
  base: "/rental-deal-analyzer/",
  plugins: [react()],
  build: { outDir: "dist", sourcemap: false },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    setupFiles: ["src/test/setup.ts"],
  },
});
