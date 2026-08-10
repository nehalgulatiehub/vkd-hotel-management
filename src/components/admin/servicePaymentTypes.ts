/**
 * Payment types that belong to a dedicated service manager (Another Hotel, Safari,
 * Volvo, Vehicle, Visa, Cruise). These must be excluded from the generic Booking
 * payment pages so each payment only appears under its own manager.
 */
export const SERVICE_PAYMENT_TYPES = [
  "hotel",
  "another_hotel",
  "hotel_direct",
  "safari",
  "safari_direct",
  "vehicle",
  "another_vehicle",
  "vehicle_direct",
  "delhi_manali",
  "manali_delhi",
  "volvo",
  "visa",
  "cruise",
];
