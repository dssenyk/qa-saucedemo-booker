import { sauce } from '../../src/config';
import { expect, loginAs, test } from './fixtures';

const backpack = 'Sauce Labs Backpack';
const bikeLight = 'Sauce Labs Bike Light';

test.describe('cart', () => {
  test.beforeEach(async ({ loginPage, inventoryPage }) => {
    await loginAs(loginPage, inventoryPage, sauce.users.standard);
  });

  test('adds two products, removes one, and keeps the badge in sync', async ({
    inventoryPage,
    cartPage,
  }) => {
    await inventoryPage.add(backpack);
    await inventoryPage.add(bikeLight);

    await inventoryPage.header.expectBadge(2);
    await expect(inventoryPage.cartButton(backpack)).toHaveText('Remove');
    await expect(inventoryPage.cartButton(bikeLight)).toHaveText('Remove');

    await inventoryPage.header.openCart();
    await cartPage.expectLoaded();
    await expect(cartPage.line(backpack).getByTestId('item-quantity')).toHaveText('1');
    await expect(cartPage.line(bikeLight).getByTestId('item-quantity')).toHaveText('1');
    expect(await cartPage.names()).toEqual([backpack, bikeLight]);

    await cartPage.remove(bikeLight);
    await cartPage.header.expectBadge(1);
    expect(await cartPage.names()).toEqual([backpack]);

    await cartPage.continueShopping();
    await inventoryPage.expectLoaded();
    await expect(inventoryPage.cartButton(bikeLight)).toHaveText('Add to cart');
    await expect(inventoryPage.cartButton(backpack)).toHaveText('Remove');
  });
});
