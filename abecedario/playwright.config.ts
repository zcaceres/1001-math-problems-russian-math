import { defineConfig, devices } from '@playwright/test'

const port = process.env.PLAYWRIGHT_PORT ?? '4173'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    reducedMotion: 'reduce',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: process.env.PLAYWRIGHT_CHANNEL } },
    { name: 'ipad', use: { ...devices['iPad (gen 7)'], browserName: 'webkit' } },
    { name: 'phone', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium', channel: process.env.PLAYWRIGHT_CHANNEL } },
  ],
  webServer: {
    command: `bun run dev --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
  },
})
