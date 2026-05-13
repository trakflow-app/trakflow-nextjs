/**
 * Calculates remaining material quantity after deduction.
 * @param currentQuantity - The initial quantity available
 * @param quantityUsed - The quantity being used
 * @returns Object with remaining quantity and over-limit flag
 */
export function calculateRemainingQuantity(
  currentQuantity: number,
  quantityUsed: number,
) {
  const actualRemaining = currentQuantity - (quantityUsed || 0);
  return {
    remaining: Math.max(0, actualRemaining),
    isOverLimit: actualRemaining < 0,
    overage: Math.abs(actualRemaining),
  };
}
