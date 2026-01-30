import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ServiceInfo {
  type: 'safari' | 'hotel' | 'vehicle' | 'volvo_dm' | 'volvo_md';
  id: string;
}

export function usePaymentDialog(onPaymentSuccess?: () => void) {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showViewPaymentDialog, setShowViewPaymentDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<ServiceInfo | null>(null);
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

  const handleViewPayment = async (booking: any, serviceInfo?: ServiceInfo) => {
    setSelectedBooking(booking);
    setSelectedService(serviceInfo || null);
    setBookingPayments([]);
    setShowViewPaymentDialog(true);
    await fetchBookingPayments(booking.id);
  };

  const handleAddPayment = (booking: any, serviceInfo?: ServiceInfo) => {
    setSelectedBooking(booking);
    setSelectedService(serviceInfo || null);
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
      
      // Determine payment_type based on selectedService
      let paymentType = "booking";
      if (selectedService) {
        const typeMap: Record<string, string> = {
          'safari': 'safari',
          'hotel': 'hotel',
          'vehicle': 'vehicle',
          'volvo_dm': 'delhi_manali',
          'volvo_md': 'manali_delhi'
        };
        paymentType = typeMap[selectedService.type] || "booking";
      }
      
      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          booking_id: selectedBooking.id,
          amount: amount,
          payment_mode: paymentMode,
          reference_number: paymentReference,
          payment_date: new Date().toISOString().split('T')[0],
          payment_type: paymentType,
          approval_status: "pending" // Payments start as pending - amounts update only on approval
        });

      if (paymentError) throw paymentError;

      // NOTE: We do NOT update booking.paid_amount or service table amounts here.
      // This happens when the payment is APPROVED by an admin via syncServiceTableOnApproval.

      toast.success("Payment added successfully (pending approval)");
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
    selectedService,
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
