import { sauce } from '../../src/config';
import { expect, loginAs, test } from './fixtures';

test.describe('catalog', () => {
  test.beforeEach(async ({ loginPage, inventoryPage }) => {
    await loginAs(loginPage, inventoryPage, sauce.users.standard);
  });

  test('lists each product and opens its details', async ({ inventoryPage, page }) => {
    await expect(inventoryPage.items).toHaveCount(6);

    const names = await inventoryPage.names();
    const descriptions = await page.getByTestId('inventory-item-desc').allInnerTexts();
    const priceTexts = await page.getByTestId('inventory-item-price').allInnerTexts();
    const sources = await inventoryPage.imageSources();

    expect(new Set(names).size).toBe(names.length);
    expect(descriptions).toHaveLength(names.length);
    for (const description of descriptions) {
      expect(description.trim().length).toBeGreaterThan(0);
    }
    for (const price of priceTexts) {
      expect(price).toMatch(/^\$\d+\.\d{2}$/);
    }
    expect(new Set(sources).size).toBe(sources.length);
    for (const source of sources) {
      expect(source).not.toContain('sl-404');
    }

    const product = 'Sauce Labs Backpack';
    const listedPrice = await inventoryPage.item(product).getByTestId('inventory-item-price').innerText();
    await expect(inventoryPage.cartButton(product)).toHaveText('Add to cart');
    await inventoryPage.openProduct(product);
    await expect(inventoryPage.visiblePrice()).toHaveText(listedPrice);
    await inventoryPage.backToProducts();
    await expect(inventoryPage.item(product)).toBeVisible();
  });
});
