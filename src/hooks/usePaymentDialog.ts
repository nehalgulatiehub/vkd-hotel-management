import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ServiceInfo {
  type: 'safari' | 'hotel' | 'vehicle' | 'volvo_dm' | 'volvo_md' | 'visa' | 'cruise';
  id: string;
}

const SERVICE_TABLES: Record<string, string> = {
  safari: "safari_bookings",
  hotel: "hotel_bookings",
  vehicle: "vehicle_bookings",
  volvo_dm: "volvo_bookings",
  volvo_md: "volvo_bookings",
  visa: "visa_bookings",
  cruise: "cruise_bookings",
};

const SERVICE_LABELS: Record<string, string> = {
  safari: "Safari",
  hotel: "Hotel",
  vehicle: "Vehicle",
  volvo_dm: "D-M Volvo",
  volvo_md: "M-D Volvo",
  visa: "Visa",
  cruise: "Cruise",
};

export function usePaymentDialog(onPaymentSuccess?: () => void) {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showViewPaymentDialog, setShowViewPaymentDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<ServiceInfo | null>(null);
  const [serviceTotals, setServiceTotals] = useState<{ label: string; total: number; paid: number; due: number } | null>(null);
  const [bookingPayments, setBookingPayments] = useState<any[]>([]);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentCityId, setPaymentCityId] = useState("");
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("cities").select("id, name").order("name");
      setCities(data || []);
    })();
  }, []);

  const fetchBookingPayments = async (bookingId: string) => {
    const { data } = await supabase
      .from("payments")
      .select("id, amount, payment_date, payment_mode, reference_number, notes, approval_status, cities(name)")
      .eq("booking_id", bookingId)
      .order("payment_date", { ascending: false });
    setBookingPayments(data || []);
  };

  // Loads the respective service module's own amount / received / due
  const fetchServiceTotals = async (serviceInfo?: ServiceInfo) => {
    if (!serviceInfo) { setServiceTotals(null); return; }
    const table = SERVICE_TABLES[serviceInfo.type];
    if (!table) { setServiceTotals(null); return; }
    const { data } = await (supabase as any)
      .from(table)
      .select("total_amount, paid_amount, due_amount")
      .eq("id", serviceInfo.id)
      .maybeSingle();
    if (!data) { setServiceTotals(null); return; }
    setServiceTotals({
      label: SERVICE_LABELS[serviceInfo.type] || "",
      total: Number(data.total_amount) || 0,
      paid: Number(data.paid_amount) || 0,
      due: Number(data.due_amount) || 0,
    });
  };

  const handleViewPayment = async (booking: any, serviceInfo?: ServiceInfo) => {
    setSelectedBooking(booking);
    setSelectedService(serviceInfo || null);
    setBookingPayments([]);
    setShowViewPaymentDialog(true);
    await fetchBookingPayments(booking.id);
    fetchServiceTotals(serviceInfo);
  };

  const handleAddPayment = (booking: any, serviceInfo?: ServiceInfo) => {
    setSelectedBooking(booking);
    setSelectedService(serviceInfo || null);
    setServiceTotals(null);
    setPaymentAmount("");
    setPaymentMode("");
    setPaymentReference("");
    setPaymentCityId("");
    setShowPaymentDialog(true);
    fetchServiceTotals(serviceInfo);
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
          'hotel': 'another_hotel',
          'vehicle': 'vehicle',
          'volvo_dm': 'delhi_manali',
          'volvo_md': 'manali_delhi',
          'visa': 'visa',
          'cruise': 'cruise'
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
          city_id: paymentCityId || null,
          payment_date: new Date().toISOString().split('T')[0],
          payment_type: paymentType,
          approval_status: "pending" // Payments start as pending - amounts update only on approval
        });

      if (paymentError) throw paymentError;

      // Recalculate booking totals so the received/due amounts reflect the new payment
      // immediately on the bookings list (regardless of approval status).
      try {
        const { data: bookingData } = await supabase
          .from("bookings")
          .select("total_amount")
          .eq("id", selectedBooking.id)
          .maybeSingle();
        const { data: allPays } = await supabase
          .from("payments")
          .select("amount")
          .eq("booking_id", selectedBooking.id);
        const totalPaid = (allPays || []).reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);
        const totalAmount = Number(bookingData?.total_amount || 0);
        const due = Math.max(0, totalAmount - totalPaid);
        const status = totalPaid <= 0 ? "pending" : due <= 0 ? "paid" : "partial";
        await supabase
          .from("bookings")
          .update({ paid_amount: totalPaid, due_amount: due, payment_status: status })
          .eq("id", selectedBooking.id);
      } catch (e) {
        console.error("Recalc booking totals after payment failed:", e);
      }

      // Update the respective service module's paid/due amounts
      if (selectedService) {
        try {
          const table = SERVICE_TABLES[selectedService.type];
          const { data: modPays } = await supabase
            .from("payments")
            .select("amount")
            .eq("booking_id", selectedBooking.id)
            .eq("payment_type", paymentType);
          const modPaid = (modPays || []).reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);
          const { data: modRow } = await (supabase as any)
            .from(table)
            .select("total_amount")
            .eq("id", selectedService.id)
            .maybeSingle();
          const modTotal = Number(modRow?.total_amount || 0);
          await (supabase as any)
            .from(table)
            .update({ paid_amount: modPaid, due_amount: Math.max(0, modTotal - modPaid) })
            .eq("id", selectedService.id);
        } catch (e) {
          console.error("Recalc module totals after payment failed:", e);
        }
        await fetchServiceTotals(selectedService);
      }

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
    serviceTotals,
    bookingPayments,
    paymentAmount,
    setPaymentAmount,
    paymentMode,
    setPaymentMode,
    paymentReference,
    setPaymentReference,
    paymentCityId,
    setPaymentCityId,
    cities,
    isSubmittingPayment,
    handleViewPayment,
    handleAddPayment,
    submitPayment,
  };
}
