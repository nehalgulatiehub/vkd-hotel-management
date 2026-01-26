import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function usePaymentDialog(onPaymentSuccess?: () => void) {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showViewPaymentDialog, setShowViewPaymentDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [bookingPayments, setBookingPayments] = useState<any[]>([]);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const fetchBookingPayments = async (bookingId: string) => {
    const { data } = await supabase
      .from("payments")
      .select("id, amount, payment_date, payment_mode, reference_number, notes, approval_status, cities(name)")
      .eq("booking_id", bookingId)
      .order("payment_date", { ascending: false });
    setBookingPayments(data || []);
  };

  const handleViewPayment = async (booking: any) => {
    setSelectedBooking(booking);
    setBookingPayments([]);
    setShowViewPaymentDialog(true);
    await fetchBookingPayments(booking.id);
  };

  const handleAddPayment = (booking: any) => {
    setSelectedBooking(booking);
    setPaymentAmount("");
    setPaymentMode("");
    setPaymentReference("");
    setShowPaymentDialog(true);
  };

  const submitPayment = async () => {
    if (!paymentAmount || !paymentMode) {
      toast.error("Please fill in required fields");
      return;
    }

    if (isSubmittingPayment) return;
    setIsSubmittingPayment(true);

    try {
      const amount = parseFloat(paymentAmount);
      
      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          booking_id: selectedBooking.id,
          amount: amount,
          payment_mode: paymentMode,
          reference_number: paymentReference,
          payment_date: new Date().toISOString().split('T')[0]
        });

      if (paymentError) throw paymentError;

      // Update booking paid and due amounts
      const newPaidAmount = (selectedBooking.paid_amount || 0) + amount;
      const newDueAmount = (selectedBooking.total_amount || 0) - newPaidAmount;

      await supabase
        .from("bookings")
        .update({
          paid_amount: newPaidAmount,
          due_amount: newDueAmount,
          payment_status: newDueAmount <= 0 ? "paid" : "partial"
        })
        .eq("id", selectedBooking.id);

      toast.success("Payment added successfully");
      setShowPaymentDialog(false);
      onPaymentSuccess?.();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to add payment");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  return {
    showPaymentDialog,
    setShowPaymentDialog,
    showViewPaymentDialog,
    setShowViewPaymentDialog,
    selectedBooking,
    bookingPayments,
    paymentAmount,
    setPaymentAmount,
    paymentMode,
    setPaymentMode,
    paymentReference,
    setPaymentReference,
    isSubmittingPayment,
    handleViewPayment,
    handleAddPayment,
    submitPayment,
  };
}
