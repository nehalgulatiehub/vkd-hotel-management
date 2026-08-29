import { supabase } from "@/integrations/supabase/client";

interface PaymentInfo {
  id: string;
  amount: number;
  booking_id: string;
  payment_type: string;
}

const MODULE_TABLE_BY_TYPE: Record<string, { table: string; route?: string }> = {
  safari: { table: "safari_bookings" },
  hotel: { table: "hotel_bookings" },
  another_hotel: { table: "hotel_bookings" },
  vehicle: { table: "vehicle_bookings" },
  volvo_dm: { table: "volvo_bookings", route: "delhi_manali" },
  delhi_manali: { table: "volvo_bookings", route: "delhi_manali" },
  volvo_md: { table: "volvo_bookings", route: "manali_delhi" },
  manali_delhi: { table: "volvo_bookings", route: "manali_delhi" },
  visa: { table: "visa_bookings" },
  cruise: { table: "cruise_bookings" },
};

const sum = (rows: any[] | null) =>
  (rows || []).reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);

/**
 * Recomputes paid/due amounts for a booking (and the relevant service module)
 * directly from the payments table.
 *
 * IMPORTANT: never increment/decrement stored amounts — the payments table is the
 * single source of truth, and a DB trigger also recalculates bookings totals on
 * insert/update/delete. Incrementing on top of that caused double counting
 * (e.g. one 30,000 payment showing as 60,000 received).
 */
export async function recalcBookingAmounts(bookingId: string, paymentType?: string) {
  // --- bookings level: sum of ALL payments for this booking
  const { data: allPays } = await supabase
    .from("payments")
    .select("amount")
    .eq("booking_id", bookingId);
  const totalPaid = sum(allPays);

  const { data: booking } = await supabase
    .from("bookings")
    .select("total_amount")
    .eq("id", bookingId)
    .maybeSingle();

  if (booking) {
    const totalAmount = Number(booking.total_amount) || 0;
    const due = Math.max(0, totalAmount - totalPaid);
    await supabase
      .from("bookings")
      .update({
        paid_amount: totalPaid,
        due_amount: due,
        payment_status: totalPaid <= 0 ? "pending" : due <= 0 ? "paid" : "partial",
      })
      .eq("id", bookingId);
  }

  // --- module level: sum of payments of that payment_type only
  const mod = paymentType ? MODULE_TABLE_BY_TYPE[paymentType] : undefined;
  if (!mod) return;

  const typeFilters =
    paymentType === "hotel" || paymentType === "another_hotel"
      ? ["hotel", "another_hotel"]
      : paymentType === "volvo_dm" || paymentType === "delhi_manali"
      ? ["volvo_dm", "delhi_manali"]
      : paymentType === "volvo_md" || paymentType === "manali_delhi"
      ? ["volvo_md", "manali_delhi"]
      : [paymentType as string];

  const { data: modPays } = await supabase
    .from("payments")
    .select("amount")
    .eq("booking_id", bookingId)
    .in("payment_type", typeFilters);
  const modPaid = sum(modPays);

  let query = (supabase as any)
    .from(mod.table)
    .select("id, total_amount")
    .eq("booking_id", bookingId);
  if (mod.route) query = query.eq("route", mod.route);
  const { data: modRow } = await query.maybeSingle();
  if (!modRow) return;

  const modTotal = Number(modRow.total_amount) || 0;
  await (supabase as any)
    .from(mod.table)
    .update({ paid_amount: modPaid, due_amount: Math.max(0, modTotal - modPaid) })
    .eq("id", modRow.id);
}

/** Called after payments are approved. */
export async function syncServiceTableOnApproval(payments: PaymentInfo[]) {
  for (const p of payments) {
    await recalcBookingAmounts(p.booking_id, p.payment_type);
  }
}

/** Called after payments are rejected / reverted from approved. */
export async function reversePaymentOnRejection(payments: PaymentInfo[]) {
  for (const p of payments) {
    await recalcBookingAmounts(p.booking_id, p.payment_type);
  }
}
