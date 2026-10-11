import { defineConfig, devices } from "@playwright/test";

/**
 * PLAYWRIGHT_BASE_URL points the suite at a server you started yourself (e.g. `npx vite --port 5401 --strictPort`).
 * Otherwise `npm run dev` is started on 5180 (a running server on that port is reused).
 */
const external = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = external ?? "http://localhost:5180";

export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL },
  ...(external ? {} : { webServer: { command: "npm run dev -- --port 5180 --strictPort", url: baseURL, reuseExistingServer: true } }),
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
