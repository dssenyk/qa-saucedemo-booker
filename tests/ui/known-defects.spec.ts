import { sauce } from '../../src/config';
import { expect, loginAs, test } from './fixtures';

/**
 * These tests encode the behavior the product should have.
 * test.fail(condition) keeps the run green while the defect is still present
 * and becomes an ordinary passing test once the product is fixed.
 * Bug write-ups live in README.md under the same ids.
 */
test.describe('known product defects', () => {
  test('problem_user sees a distinct photo for each product', async ({ loginPage, inventoryPage }) => {
    await loginAs(loginPage, inventoryPage, sauce.users.problem);
    const sources = await inventoryPage.imageSources();

    const broken = sources.length === 0 || sources.some((source) => source.includes('sl-404'));
    test.fail(broken, 'BUG-UI-1: every problem_user photo is the sl-404 placeholder');

    expect(sources.some((source) => source.includes('sl-404'))).toBe(false);
    expect(new Set(sources).size).toBe(sources.length);
  });

  test('problem_user can sort the catalog by price high to low', async ({ loginPage, inventoryPage }) => {
    await loginAs(loginPage, inventoryPage, sauce.users.problem);
    await inventoryPage.sortBy('hilo');

    const value = await inventoryPage.sortValue();
    const prices = await inventoryPage.prices();
    const sorted = [...prices].sort((left, right) => right - left);
    const broken = value !== 'hilo' || prices.join(',') !== sorted.join(',');
    test.fail(broken, 'BUG-UI-2: the sort control stays on Name (A to Z) for problem_user');

    expect(value).toBe('hilo');
    expect(prices).toEqual(sorted);
  });

  test('error_user keeps the cart badge and buttons in sync', async ({ loginPage, inventoryPage, cartPage }) => {
    await loginAs(loginPage, inventoryPage, sauce.users.error);
    const count = await inventoryPage.items.count();
    expect(count).toBeGreaterThan(0);

    const labels: string[] = [];
    for (let index = 0; index < count; index += 1) {
      const button = inventoryPage.items.nth(index).locator('button');
      await button.click();
      labels.push((await button.innerText()).trim());
    }

    const badge = await inventoryPage.header.badgeCount();
    await inventoryPage.header.openCart();
    const lines = (await cartPage.names()).length;
    const broken = labels.some((label) => label !== 'Remove') || badge !== count || lines !== count;
    test.fail(broken, 'BUG-UI-3: error_user adds items the badge and buttons do not acknowledge');

    expect(labels.every((label) => label === 'Remove')).toBe(true);
    expect(badge).toBe(count);
    expect(lines).toBe(count);
  });
});
