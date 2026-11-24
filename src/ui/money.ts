/** SauceDemo adds 8% tax and rounds half-up to cents.
 * Checked against a live order: Backpack $29.99 + Bike Light $9.99
 * => item total $39.98, tax $3.20, total $43.18.
 */
export function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

export function parsePrice(text: string): number {
  const value = Number(text.replace(/[^0-9.-]/g, ''));
  if (Number.isNaN(value)) {
    throw new Error(`Cannot parse price: ${text}`);
  }
  return value;
}

export function formatPrice(value: number): string {
  return `$${roundCents(value).toFixed(2)}`;
}

export function salesTax(itemTotal: number): number {
  return roundCents(roundCents(itemTotal) * 0.08);
}
