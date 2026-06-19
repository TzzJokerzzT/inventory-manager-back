export const MOVEMENT_TYPES = {
  PURCHASE: "purchase",
  RETURN: "return",
  SALE: "sale",
  SHRINKAGE: "shrinkage",
  ADJUSTMENT_IN: "adjustment_in",
  ADJUSTMENT_OUT: "adjustment_out",
} as const;

export type MovementTypeValue = (typeof MOVEMENT_TYPES)[keyof typeof MOVEMENT_TYPES];

export const ENTRY_TYPES: Set<MovementTypeValue> = new Set([
  MOVEMENT_TYPES.PURCHASE,
  MOVEMENT_TYPES.RETURN,
  MOVEMENT_TYPES.ADJUSTMENT_IN,
]);

export const EXIT_TYPES: Set<MovementTypeValue> = new Set([
  MOVEMENT_TYPES.SALE,
  MOVEMENT_TYPES.SHRINKAGE,
  MOVEMENT_TYPES.ADJUSTMENT_OUT,
]);