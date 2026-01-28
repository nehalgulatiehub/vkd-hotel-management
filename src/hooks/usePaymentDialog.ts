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

  const updateServiceTable = async (serviceInfo: ServiceInfo, amount: number) => {
    const tableMap: Record<string, string> = {
      'safari': 'safari_bookings',
      'hotel': 'hotel_bookings',
      'vehicle': 'vehicle_bookings',
      'volvo_dm': 'volvo_bookings',
      'volvo_md': 'volvo_bookings'
    };

    const tableName = tableMap[serviceInfo.type];
    if (!tableName) return;

    // Get current service record using raw query approach for dynamic table
    let serviceRecord: { paid_amount: number | null; total_amount: number | null } | null = null;
    
    if (serviceInfo.type === 'safari') {
      const { data } = await supabase
        .from("safari_bookings")
        .select("paid_amount, total_amount")
        .eq("id", serviceInfo.id)
        .maybeSingle();
      serviceRecord = data;
    } else if (serviceInfo.type === 'hotel') {
      const { data } = await supabase
        .from("hotel_bookings")
        .select("paid_amount, total_amount")
        .eq("id", serviceInfo.id)
        .maybeSingle();
      serviceRecord = data;
    } else if (serviceInfo.type === 'vehicle') {
      const { data } = await supabase
        .from("vehicle_bookings" as any)
        .select("paid_amount, total_amount")
        .eq("id", serviceInfo.id)
        .maybeSingle();
      serviceRecord = data as any;
    } else if (serviceInfo.type === 'volvo_dm' || serviceInfo.type === 'volvo_md') {
      const { data } = await supabase
        .from("volvo_bookings" as any)
        .select("paid_amount, total_amount")
        .eq("id", serviceInfo.id)
        .maybeSingle();
      serviceRecord = data as any;
    }

    if (serviceRecord) {
      const newPaidAmount = (serviceRecord.paid_amount || 0) + amount;
      const newDueAmount = (serviceRecord.total_amount || 0) - newPaidAmount;

      if (serviceInfo.type === 'safari') {
        await supabase
          .from("safari_bookings")
          .update({ paid_amount: newPaidAmount, due_amount: newDueAmount })
          .eq("id", serviceInfo.id);
      } else if (serviceInfo.type === 'hotel') {
        await supabase
          .from("hotel_bookings")
          .update({ paid_amount: newPaidAmount, due_amount: newDueAmount })
          .eq("id", serviceInfo.id);
      } else if (serviceInfo.type === 'vehicle') {
        await supabase
          .from("vehicle_bookings" as any)
          .update({ paid_amount: newPaidAmount, due_amount: newDueAmount })
          .eq("id", serviceInfo.id);
      } else if (serviceInfo.type === 'volvo_dm' || serviceInfo.type === 'volvo_md') {
        await supabase
          .from("volvo_bookings" as any)
          .update({ paid_amount: newPaidAmount, due_amount: newDueAmount })
          .eq("id", serviceInfo.id);
      }
    }
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

      // Also update the service-specific table if provided
      if (selectedService) {
        await updateServiceTable(selectedService, amount);
      }

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
