/**
 * Unit conversion helper for purchase and inventory management.
 * Computes how many base units correspond to 1 of the line unit.
 *
 * Example:
 * Base Unit: "kg", Line Unit: "gram" -> 1 gram = 0.001 kg.
 * 500 grams * 0.001 = 0.5 kg.
 * Price for 500 grams @ ₹20/kg = 0.5 * ₹20 = ₹10.
 */
export function getUnitMultiplier(lineUnit: string | null | undefined, baseUnit: string | null | undefined): number {
  const normLine = (lineUnit || "").toLowerCase().trim();
  const normBase = (baseUnit || "").toLowerCase().trim();

  if (!normLine || !normBase || normLine === normBase) {
    return 1;
  }

  // Weight conversions
  const isKg = (u: string) => u === "kg" || u === "kilogram" || u === "kilograms";
  const isGram = (u: string) => u === "gram" || u === "grams" || u === "g" || u === "gm";

  if (isKg(normBase) && isGram(normLine)) {
    return 0.001; // 500 grams = 0.5 kg
  }
  if (isGram(normBase) && isKg(normLine)) {
    return 1000;
  }

  // Volume conversions
  const isLiter = (u: string) => u === "liter" || u === "litre" || u === "liters" || u === "litres" || u === "l";
  const isMl = (u: string) => u === "ml" || u === "milliliter" || u === "milliliters";

  if (isLiter(normBase) && isMl(normLine)) {
    return 0.001;
  }
  if (isMl(normBase) && isLiter(normLine)) {
    return 1000;
  }

  // Count conversions
  const isDozen = (u: string) => u === "dozen" || u === "dozens" || u === "dz";
  const isPiece = (u: string) => u === "piece" || u === "pieces" || u === "pc" || u === "pcs";

  if (isDozen(normBase) && isPiece(normLine)) {
    return 1 / 12;
  }
  if (isPiece(normBase) && isDozen(normLine)) {
    return 12;
  }

  return 1;
}

/**
 * Formats a quantity with its effective base unit for display clarity.
 * Example: 500 grams of a kg item -> "500 Gram (g) (= 0.5 kg)"
 */
export function formatEffectiveUnitLabel(
  quantity: number,
  lineUnit: string | null | undefined,
  baseUnit: string | null | undefined
): string | null {
  const mult = getUnitMultiplier(lineUnit, baseUnit);
  if (mult === 1) return null;
  const effective = (quantity * mult).toLocaleString("en-IN", { maximumFractionDigits: 4 });
  return `(= ${effective} ${baseUnit})`;
}
