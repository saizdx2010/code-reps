import { defineConfig } from '@playwright/test'

// E2E_PORT lets separate checkouts run the suite side by side without sharing a server.
const port = Number(process.env.E2E_PORT) || 4175

const expectTimeout = Number(process.env.E2E_EXPECT_TIMEOUT ?? 10_000)
if (!Number.isInteger(expectTimeout) || expectTimeout <= 0) {
  throw new Error('E2E_EXPECT_TIMEOUT must be a positive integer in milliseconds')
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 2,
  timeout: 45_000,
  expect: { timeout: expectTimeout },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium', viewport: { width: 1280, height: 900 } } }],
  // Build fresh assets for isolated SQLite tests, then start dedicated Vite.
  webServer: {
    command: `yarn build && yarn dev --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
