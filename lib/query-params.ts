/**
 * Reads the first string value for a query parameter.
 */
export function getSearchParamValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  // Next.js may provide one value or an array for repeated query parameters.
  const value = searchParams[key];

  return Array.isArray(value) ? value[0] : value;
}

/**
 * Parses a positive integer query parameter with a safe fallback.
 */
export function getPositiveInteger(
  value: string | undefined,
  fallback: number,
): number {
  // Convert the URL string before validating the page number.
  const numericValue = Number(value);

  return Number.isInteger(numericValue) && numericValue > 0
    ? numericValue
    : fallback;
}

/**
 * Returns a numeric query value only when it belongs to the allowed set.
 */
export function getAllowedNumber(
  value: string | undefined,
  allowedValues: readonly number[],
  fallback: number,
): number {
  // Convert the URL string before checking the page-size allowlist.
  const numericValue = Number(value);

  return allowedValues.includes(numericValue) ? numericValue : fallback;
}
