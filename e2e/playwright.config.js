/** Playwright config for quick smoke E2E tests */
module.exports = {
  testDir: 'e2e/tests',
  timeout: 30_000,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    actionTimeout: 10_000,
  },
  reporter: [['list'], ['html', { outputFolder: 'e2e/playwright-report' }]],
};
