export const CASH_IN_BANK_MODE = "Cash in Bank";

export const normalizePaymentMode = (mode: string | null | undefined) =>
  (mode || "").trim().toLowerCase();

export const matchesPaymentMode = (
  mode: string | null | undefined,
  filter: string | null | undefined,
) => !filter || normalizePaymentMode(mode) === normalizePaymentMode(filter);

export function isCashPaymentMode(mode: string | null | undefined) {
  return ["cash", "cash in hand"].includes(normalizePaymentMode(mode));
}

export function paymentModeLabel(mode: string | null | undefined) {
  if (!mode) return "-";
  const labels: Record<string, string> = {
    cash: "Cash in Hand",
    "cash in hand": "Cash in Hand",
    "cash in bank": "Cash in Bank",
    card: "Card",
    "credit card": "Credit Card",
    upi: "UPI",
    bank_transfer: "Bank Transfer",
    "net banking": "Net Banking",
    cheque: "Cheque",
  };
  return labels[normalizePaymentMode(mode)] || mode;
}
