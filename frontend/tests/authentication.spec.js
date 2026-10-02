import { test, expect } from '@playwright/test';

test('TC-AUTH-002 - Client can login', async ({ page }) => {

  // 1. Go to Client Portal
  await page.goto('http://localhost:5173/');

  // 2. Open the login page
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('button', { name: 'Sign in' })
    .click();

  // 3. Enter valid client credentials
  await page
    .getByRole('textbox', { name: 'Email *' })
    .fill('');

  await page
    .getByRole('textbox', { name: 'Password *' })
    .fill('');

  // 4. Click Login
  await page
    .getByRole('button', { name: 'Login' })
    .click();

  // 5. Verify redirection to Client Dashboard
  await expect(page).toHaveURL('http://localhost:5173/client/dashboard');
});