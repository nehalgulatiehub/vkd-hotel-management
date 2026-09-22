export const SERVICE_PAYMENT_TYPES = {
  anotherHotel: ["another_hotel", "hotel", "hotel_direct"],
  safari: ["safari", "safari_direct"],
  vehicle: ["vehicle", "another_vehicle", "vehicle_direct"],
  delhiManali: ["delhi_manali", "volvo_dm"],
  manaliDelhi: ["manali_delhi", "volvo_md"],
  visa: ["visa"],
  cruise: ["cruise"],
} as const;

const SERVICE_PAYMENT_TYPE_SET = new Set<string>(
  Object.values(SERVICE_PAYMENT_TYPES).flat(),
);

/** Payments without a service category belong to the own-hotel booking. */
export const isOwnHotelPayment = (paymentType: string | null | undefined) =>
  !SERVICE_PAYMENT_TYPE_SET.has((paymentType || "").toLowerCase());
