import { customer, sauce } from '../../src/config';
import { formatPrice, roundCents, salesTax } from '../../src/ui/money';
import { expect, loginAs, test } from './fixtures';

const onesie = 'Sauce Labs Onesie';
const boltShirt = 'Sauce Labs Bolt T-Shirt';

test.describe('checkout', () => {
  test.beforeEach(async ({ loginPage, inventoryPage }) => {
    await loginAs(loginPage, inventoryPage, sauce.users.standard);
  });

  test('completes an order and empties the cart', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
    page,
  }) => {
    await inventoryPage.add(onesie);
    await inventoryPage.add(boltShirt);
    await inventoryPage.header.openCart();

    const itemTotal = roundCents((await cartPage.prices()).reduce((sum, price) => sum + price, 0));
    const tax = salesTax(itemTotal);
    const total = roundCents(itemTotal + tax);

    await cartPage.checkout();
    await expect(checkoutPage.title).toHaveText('Checkout: Your Information');
    await checkoutPage.fillCustomer(customer);
    await checkoutPage.continue();

    await expect(page).toHaveURL(/\/checkout-step-two\.html$/);
    await expect(checkoutPage.title).toHaveText('Checkout: Overview');
    await expect(page.getByTestId('inventory-item-name')).toHaveText([onesie, boltShirt]);
    await expect(page.getByTestId('payment-info-value')).toHaveText('SauceCard #31337');
    await expect(page.getByTestId('shipping-info-value')).toHaveText('Free Pony Express Delivery!');
    await expect(page.getByTestId('subtotal-label')).toHaveText(`Item total: ${formatPrice(itemTotal)}`);
    await expect(page.getByTestId('tax-label')).toHaveText(`Tax: ${formatPrice(tax)}`);
    await expect(page.getByTestId('total-label')).toHaveText(`Total: ${formatPrice(total)}`);

    await checkoutPage.finish();
    await expect(checkoutPage.title).toHaveText('Checkout: Complete!');
    await expect(page.getByTestId('complete-header')).toHaveText('Thank you for your order!');

    await checkoutPage.header.openCart();
    await expect(page.getByTestId('inventory-item')).toHaveCount(0);
    await checkoutPage.header.expectBadge(0);
  });

  test('stops on each missing required field', async ({ inventoryPage, cartPage, checkoutPage, page }) => {
    await inventoryPage.add(onesie);
    await inventoryPage.header.openCart();
    await cartPage.checkout();

    await checkoutPage.continue();
    await expect(checkoutPage.error).toHaveText('Error: First Name is required');

    await checkoutPage.firstName.fill(customer.firstName);
    await checkoutPage.continue();
    await expect(checkoutPage.error).toHaveText('Error: Last Name is required');

    await checkoutPage.lastName.fill(customer.lastName);
    await checkoutPage.continue();
    await expect(checkoutPage.error).toHaveText('Error: Postal Code is required');
    await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
  });
});
