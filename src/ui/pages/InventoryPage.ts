import { expect, type Locator, type Page } from '@playwright/test';
import { parsePrice } from '../money';
import { ShopHeader } from './ShopHeader';

export const sortLabels = {
  az: 'Name (A to Z)',
  za: 'Name (Z to A)',
  lohi: 'Price (low to high)',
  hilo: 'Price (high to low)',
} as const;

export type SortOption = keyof typeof sortLabels;

export class InventoryPage {
  readonly header: ShopHeader;
  readonly title: Locator;
  readonly items: Locator;
  readonly activeOption: Locator;

  constructor(private readonly page: Page) {
    this.header = new ShopHeader(page);
    this.title = page.getByTestId('title');
    this.items = page.getByTestId('inventory-item');
    this.activeOption = page.getByTestId('active-option');
  }

  item(name: string): Locator {
    return this.items.filter({ hasText: name });
  }

  /** The real <button>, not the "View details" links that also expose role=button. */
  cartButton(name: string): Locator {
    return this.item(name).locator('button');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/inventory\.html$/);
    await expect(this.title).toHaveText('Products');
  }

  async names(): Promise<string[]> {
    return this.page.getByTestId('inventory-item-name').allInnerTexts();
  }

  async prices(): Promise<number[]> {
    const texts = await this.page.getByTestId('inventory-item-price').allInnerTexts();
    return texts.map(parsePrice);
  }

  async imageSources(): Promise<string[]> {
    return this.items.locator('img').evaluateAll((images) =>
      images.map((image) => image.getAttribute('src') ?? ''),
    );
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.page.getByTestId('product-sort-container').selectOption(option);
  }

  async sortValue(): Promise<string> {
    return this.page.getByTestId('product-sort-container').inputValue();
  }

  async add(name: string): Promise<void> {
    await this.cartButton(name).click();
  }

  async openProduct(name: string): Promise<void> {
    await this.item(name).getByTestId('inventory-item-name').click();
    // The catalog stays mounted under the detail route, so unscoped test ids match hidden cards.
    await expect(this.page.getByTestId('back-to-products')).toBeVisible();
    await expect(this.page).toHaveURL(/\/inventory-item\.html\?id=\d+/);
    await expect(this.page.getByTestId('inventory-item-name').filter({ visible: true })).toHaveText(name);
  }

  visiblePrice(): Locator {
    return this.page.getByTestId('inventory-item-price').filter({ visible: true });
  }

  async backToProducts(): Promise<void> {
    await this.page.getByTestId('back-to-products').click();
    await this.expectLoaded();
  }
}
