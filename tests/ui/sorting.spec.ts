import { sauce } from '../../src/config';
import { sortLabels } from '../../src/ui/pages/InventoryPage';
import { expect, loginAs, test } from './fixtures';

test.describe('sorting', () => {
  test.beforeEach(async ({ loginPage, inventoryPage }) => {
    await loginAs(loginPage, inventoryPage, sauce.users.standard);
  });

  test('sorts the catalog by name in both directions', async ({ inventoryPage }) => {
    const initial = await inventoryPage.names();
    expect(initial.length).toBeGreaterThan(1);

    await inventoryPage.sortBy('az');
    await expect(inventoryPage.activeOption).toHaveText(sortLabels.az);
    const ascending = await inventoryPage.names();
    expect(ascending).toEqual([...ascending].sort((a, b) => a.localeCompare(b, 'en')));

    await inventoryPage.sortBy('za');
    await expect(inventoryPage.activeOption).toHaveText(sortLabels.za);
    const descending = await inventoryPage.names();
    expect(descending).toEqual([...descending].sort((a, b) => b.localeCompare(a, 'en')));
    expect(descending).not.toEqual(initial);
  });

  test('sorts the catalog by price in both directions', async ({ inventoryPage }) => {
    const initial = await inventoryPage.prices();

    await inventoryPage.sortBy('lohi');
    await expect(inventoryPage.activeOption).toHaveText(sortLabels.lohi);
    const ascending = await inventoryPage.prices();
    expect(ascending).toEqual([...ascending].sort((a, b) => a - b));
    expect(ascending).not.toEqual(initial);

    await inventoryPage.sortBy('hilo');
    await expect(inventoryPage.activeOption).toHaveText(sortLabels.hilo);
    const descending = await inventoryPage.prices();
    expect(descending).toEqual([...descending].sort((a, b) => b - a));
    expect(descending).not.toEqual(ascending);
  });
});
