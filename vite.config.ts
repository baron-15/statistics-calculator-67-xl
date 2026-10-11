import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/** GitHub Pages serves this project at https://baron-15.github.io/statistics-calculator-67-xl/. */
const PAGES_BASE = "/statistics-calculator-67-xl/";

export default defineConfig(({ command, isPreview }) => ({
  // Dev server and tests run at "/"; the production build (and `vite preview` of it) uses the Pages subpath.
  base: command === "build" || isPreview ? PAGES_BASE : "/",
  plugins: [react(), tailwindcss()],
  test: {
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    environment: "node",
  },
}));
