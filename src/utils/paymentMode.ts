export const CASH_IN_BANK_MODE = "Cash in Bank";

export function isCashPaymentMode(mode: string | null | undefined) {
  return ["cash", "cash in hand"].includes((mode || "").trim().toLowerCase());
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
  return labels[mode.trim().toLowerCase()] || mode;
}
