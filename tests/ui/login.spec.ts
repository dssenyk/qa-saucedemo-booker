import { sauce } from '../../src/config';
import { expect, test } from './fixtures';

test.describe('login', () => {
  test('standard_user opens the catalog', async ({ loginPage, inventoryPage }) => {
    await loginPage.open();
    await loginPage.signIn(sauce.users.standard, sauce.password);

    await inventoryPage.expectLoaded();
    await expect(inventoryPage.items.first()).toBeVisible();
  });
});

test.describe('rejected login', () => {
  test('asks for a username and then for a password', async ({ loginPage, page }) => {
    await loginPage.open();
    await loginPage.submit.click();
    await loginPage.expectError('Epic sadface: Username is required');
    await expect(page).not.toHaveURL(/inventory/);

    await loginPage.signIn(sauce.users.standard, '');
    await loginPage.expectError('Epic sadface: Password is required');
    await expect(page).not.toHaveURL(/inventory/);
  });

  test('rejects an unknown password and the locked out user', async ({ loginPage, page }) => {
    await loginPage.open();
    await loginPage.signIn(sauce.users.standard, 'not-the-password');
    await loginPage.expectError(
      'Epic sadface: Username and password do not match any user in this service',
    );
    await expect(page).not.toHaveURL(/inventory/);

    await loginPage.open();
    await loginPage.signIn(sauce.users.locked, sauce.password);
    await loginPage.expectError('Epic sadface: Sorry, this user has been locked out.');
    await expect(page).not.toHaveURL(/inventory/);
  });
});
