import { defineConfig } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run build && npx serve out -l 3000",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 180_000,
      },
});
