import { test, expect } from '@playwright/test';

test('TC-FAM-016 - Staff cannot access User Management', async ({ page }) => {

  // 1. Go to Firm Portal login page
  await page.goto('http://localhost:5173/firm/signin');

  // 2. Log in as Staff
  await page.getByRole('textbox', { name: 'Email *' }).fill('');
  await page.getByRole('textbox', { name: 'Password *' }).fill('');
  await page.getByRole('button', { name: 'Login' }).click();

  // 3. Check page redirection to Firm Dashboard after successful login
  await expect(page).toHaveURL('http://localhost:5173/firm/dashboard');

  // 4. Attempt to access the User Management page
  await page.goto('http://localhost:5173/admin/users');

  // 5. Verify Staff is redirected to the Firm Dashboard
  await expect(page).toHaveURL('http://localhost:5173/firm/dashboard');

});

// TC-FAM-017
test('TC-FAM-017 - Staff can view Services', async ({ page }) => {

  await page.goto('http://localhost:5173/firm/signin');

  await page.getByRole('textbox', { name: 'Email *' }).fill('');
  await page.getByRole('textbox', { name: 'Password *' }).fill('');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page).toHaveURL('http://localhost:5173/firm/dashboard');

  await page.getByRole('link', { name: 'Services' }).click();

  await expect(page).toHaveURL('http://localhost:5173/firm/services');
});


test('TC-FAM-018 - Staff cannot create a service template', async ({ page }) => {

  await page.goto('http://localhost:5173/firm/signin');

  await page.getByRole('textbox', { name: 'Email *' }).fill('');
  await page.getByRole('textbox', { name: 'Password *' }).fill('');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page).toHaveURL('http://localhost:5173/firm/dashboard');


  await page.getByRole('link', { name: 'Services' }).click();

  await expect(page).toHaveURL('http://localhost:5173/firm/services');

  const addService = page.getByRole('button', { name: 'Add Service' });

  console.log('ADD SERVICE COUNT:', await addService.count());
  console.log('ADD SERVICE VISIBLE:', await addService.isVisible());


  // Staff should NOT have the Add Service button.
  await expect(addService).toHaveCount(0);
});
