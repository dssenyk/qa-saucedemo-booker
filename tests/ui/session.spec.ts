import { sauce } from '../../src/config';
import { expect, loginAs, test } from './fixtures';

test.describe('session', () => {
  test('logout returns to the form and blocks the catalog url', async ({
    loginPage,
    inventoryPage,
    page,
  }) => {
    await loginAs(loginPage, inventoryPage, sauce.users.standard);
    await inventoryPage.header.logout();
    await expect(page).toHaveURL(/\/$/);
    await expect(loginPage.username).toBeVisible();

    await page.goto('/inventory.html');
    await loginPage.expectError(
      "Epic sadface: You can only access '/inventory.html' when you are logged in.",
    );
    await expect(page.getByTestId('inventory-item-name')).toHaveCount(0);
    await expect(loginPage.username).toBeVisible();
  });
});
