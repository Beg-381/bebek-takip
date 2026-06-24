const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:5000',
    viewport: { width: 390, height: 844 },
    locale: 'tr-TR',
    colorScheme: 'light',
    actionTimeout: 10000,
  },
  projects: [
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'], locale: 'tr-TR' } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'], locale: 'tr-TR' } },
  ],
  webServer: {
    command: 'node server.js',
    port: 5000,
    reuseExistingServer: true,
    timeout: 10000,
  },
});
