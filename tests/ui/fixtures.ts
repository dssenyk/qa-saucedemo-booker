import { test as base, expect } from '@playwright/test';
import { sauce } from '../../src/config';
import { CartPage } from '../../src/ui/pages/CartPage';
import { CheckoutPage } from '../../src/ui/pages/CheckoutPage';
import { InventoryPage } from '../../src/ui/pages/InventoryPage';
import { LoginPage } from '../../src/ui/pages/LoginPage';

type UiFixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
};

export const test = base.extend<UiFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
});

export { expect };

export async function loginAs(
  loginPage: LoginPage,
  inventoryPage: InventoryPage,
  username: string,
): Promise<void> {
  await loginPage.open();
  await loginPage.signIn(username, sauce.password);
  await inventoryPage.expectLoaded();
}
