import { SERVICE_PAYMENT_TYPES as PAYMENT_CATEGORIES } from "@/utils/paymentCategories";

/**
 * Payment types that belong to a dedicated service manager (Another Hotel, Safari,
 * Volvo, Vehicle, Visa, Cruise). These must be excluded from the generic Booking
 * payment pages so each payment only appears under its own manager.
 */
export const SERVICE_PAYMENT_TYPES = [
  ...new Set([...Object.values(PAYMENT_CATEGORIES).flat(), "volvo"]),
];
