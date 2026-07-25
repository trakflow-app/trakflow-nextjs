const CENTS_PER_UNIT = 100;

/**
 * Rounds a currency value to the nearest cent.
 */
function roundToCents(value: number): number {
  return Math.round(value * CENTS_PER_UNIT) / CENTS_PER_UNIT;
}

/**
 * Normalizes a material name for case/whitespace-insensitive matching.
 */
export function normalizeMaterialName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Computes the combined quantity and quantity-weighted average cost when
 * incoming stock is merged into an existing material batch. Shared by the
 * single-row and batch merge paths so both apply the exact same formula.
 */
export function computeMergedMaterialQuantityAndCost(
  existing: { unitQty: number; unitCost: number },
  incoming: { quantity: number; unitCost: number },
): { quantity: number; cost: number } {
  const combinedQuantity = existing.unitQty + incoming.quantity;
  const combinedCost =
    combinedQuantity === 0
      ? incoming.unitCost
      : roundToCents(
          (existing.unitQty * existing.unitCost +
            incoming.quantity * incoming.unitCost) /
            combinedQuantity,
        );

  return { quantity: combinedQuantity, cost: combinedCost };
}
