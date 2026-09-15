import { SelectItem } from "@/components/ui/select";
import { CASH_IN_BANK_MODE } from "@/utils/paymentMode";

export function PaymentModeOptions() {
  return (
    <>
      <SelectItem value="cash">Cash in Hand</SelectItem>
      <SelectItem value={CASH_IN_BANK_MODE}>Cash in Bank</SelectItem>
      <SelectItem value="card">Card</SelectItem>
      <SelectItem value="upi">UPI</SelectItem>
      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
      <SelectItem value="cheque">Cheque</SelectItem>
    </>
  );
}
