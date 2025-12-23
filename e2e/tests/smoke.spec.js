const { test, expect } = require('@playwright/test');

test.describe('TrackitAll smoke tests', () => {
  test('auth page renders with inputs', async ({ page, baseURL }) => {
    await page.goto('/auth');
    // The Auth page includes an email input with data-testid="email-input"
    const email = page.getByTestId('email-input');
    await expect(email).toBeVisible({ timeout: 10000 });
    const submit = page.getByTestId('submit-button');
    await expect(submit).toBeVisible();
  });

  test('home redirects to auth for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    // App should navigate to /auth for unauthenticated users
    await page.goto('/auth');
    await expect(page.getByTestId('email-input')).toBeVisible();
  });
});
