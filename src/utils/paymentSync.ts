import { supabase } from "@/integrations/supabase/client";

interface PaymentInfo {
  id: string;
  amount: number;
  booking_id: string;
  payment_type: string;
}

/**
 * Syncs the paid_amount and due_amount in the service-specific table (safari_bookings, hotel_bookings, etc.)
 * when a payment is approved. This ensures the money detail pages show correct values.
 */
export async function syncServiceTableOnApproval(payments: PaymentInfo[]) {
  for (const payment of payments) {
    const { booking_id, amount, payment_type } = payment;

    // Update bookings table first
    const { data: booking } = await supabase
      .from("bookings")
      .select("paid_amount, total_amount")
      .eq("id", booking_id)
      .single();

    if (booking) {
      const newPaidAmount = (booking.paid_amount || 0) + amount;
      const newDueAmount = (booking.total_amount || 0) - newPaidAmount;

      await supabase
        .from("bookings")
        .update({
          paid_amount: newPaidAmount,
          due_amount: newDueAmount,
          payment_status: newDueAmount <= 0 ? "paid" : "partial"
        })
        .eq("id", booking_id);
    }

    // Now update service-specific table based on payment_type
    if (payment_type === "safari") {
      const { data: safariBooking } = await supabase
        .from("safari_bookings")
        .select("id, paid_amount, total_amount")
        .eq("booking_id", booking_id)
        .maybeSingle();

      if (safariBooking) {
        const newPaid = (safariBooking.paid_amount || 0) + amount;
        const newDue = (safariBooking.total_amount || 0) - newPaid;
        await supabase
          .from("safari_bookings")
          .update({ paid_amount: newPaid, due_amount: newDue })
          .eq("id", safariBooking.id);
      }
    } else if (payment_type === "hotel" || payment_type === "another_hotel") {
      const { data: hotelBooking } = await supabase
        .from("hotel_bookings")
        .select("id, paid_amount, total_amount")
        .eq("booking_id", booking_id)
        .maybeSingle();

      if (hotelBooking) {
        const newPaid = (hotelBooking.paid_amount || 0) + amount;
        const newDue = (hotelBooking.total_amount || 0) - newPaid;
        await supabase
          .from("hotel_bookings")
          .update({ paid_amount: newPaid, due_amount: newDue })
          .eq("id", hotelBooking.id);
      }
    } else if (payment_type === "vehicle") {
      const { data: vehicleBooking } = await supabase
        .from("vehicle_bookings" as any)
        .select("id, paid_amount, total_amount")
        .eq("booking_id", booking_id)
        .maybeSingle();

      if (vehicleBooking) {
        const newPaid = ((vehicleBooking as any).paid_amount || 0) + amount;
        const newDue = ((vehicleBooking as any).total_amount || 0) - newPaid;
        await supabase
          .from("vehicle_bookings" as any)
          .update({ paid_amount: newPaid, due_amount: newDue })
          .eq("id", (vehicleBooking as any).id);
      }
    } else if (payment_type === "volvo_dm" || payment_type === "delhi_manali") {
      const { data: volvoBooking } = await supabase
        .from("volvo_bookings" as any)
        .select("id, paid_amount, total_amount")
        .eq("booking_id", booking_id)
        .eq("route_type", "delhi_manali")
        .maybeSingle();

      if (volvoBooking) {
        const newPaid = ((volvoBooking as any).paid_amount || 0) + amount;
        const newDue = ((volvoBooking as any).total_amount || 0) - newPaid;
        await supabase
          .from("volvo_bookings" as any)
          .update({ paid_amount: newPaid, due_amount: newDue })
          .eq("id", (volvoBooking as any).id);
      }
    } else if (payment_type === "volvo_md" || payment_type === "manali_delhi") {
      const { data: volvoBooking } = await supabase
        .from("volvo_bookings" as any)
        .select("id, paid_amount, total_amount")
        .eq("booking_id", booking_id)
        .eq("route_type", "manali_delhi")
        .maybeSingle();

      if (volvoBooking) {
        const newPaid = ((volvoBooking as any).paid_amount || 0) + amount;
        const newDue = ((volvoBooking as any).total_amount || 0) - newPaid;
        await supabase
          .from("volvo_bookings" as any)
          .update({ paid_amount: newPaid, due_amount: newDue })
          .eq("id", (volvoBooking as any).id);
      }
    }
  }
}
