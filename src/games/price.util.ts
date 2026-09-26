/**
 * Turns a formatted price such as "₹899.00" or "Free" into a number.
 * Returns `null` when the value cannot be interpreted as a price.
 */
export function parsePriceToNumber(
  price: string | null | undefined,
): number | null {
  if (!price) {
    return null;
  }

  const numeric = price.replace(/[^0-9.]/g, "");

  if (!numeric) {
    return null;
  }

  const value = Number(numeric);

  return Number.isFinite(value) ? value : null;
}

/**
 * Checks whether a game's normal price is strictly below the configured
 * maximum. `maxPrice === null` means no limit, and a game whose price cannot
 * be read is allowed through so it is never silently dropped.
 */
export function isWithinMaxPrice(
  originalPrice: string,
  maxPrice: number | null,
): boolean {
  if (maxPrice === null) {
    return true;
  }

  const value = parsePriceToNumber(originalPrice);

  if (value === null) {
    return true;
  }

  return value < maxPrice;
}
