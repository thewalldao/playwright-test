import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list']
  ],

  use: {
    headless: false,
    viewport: { width: 1920, height: 1080 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: {
      slowMo: 50
    }
  },

  projects: [
    // Setup project - NO TRACE (password safe)
    {
      name: 'setup',
      testMatch: "auth.setup.ts",
      use: {
        ...devices['Desktop Chrome'],
        trace: 'off',  // 🔐 No trace - password safe
        headless: false,
        viewport: { width: 1920, height: 1080 },
      },
    },


    {
      name: 'Chrome',
      use: { browserName: 'chromium', channel: 'chrome' },
      dependencies: ['setup'],
    },
    {
      name: 'Edge',
      use: { browserName: 'chromium', channel: 'msedge' },
      dependencies: ['setup'],
    },

    // E2E Galaxy S9 - with TRACE
    {
      name: 'Galaxy S9',
      use: {
        ...devices['Galaxy S9'],
        trace: {
          mode: 'on',
          screenshots: true,
          snapshots: true,
          sources: false,
        },
      },
      dependencies: ['setup'],
    },
  ]
});
