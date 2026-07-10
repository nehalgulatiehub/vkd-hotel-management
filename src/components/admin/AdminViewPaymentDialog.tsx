import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ServiceSummary {
  type: string;
  customerName: string;
  totalPayment: number;
  totalReceived: number;
  date: string;
  totalDue: number;
}

interface PaymentRecord {
  id: string;
  customer: string;
  payment: number;
  date: string;
  mode: string;
  paymentDetail: string;
  place: string;
  status: string;
}

interface AdminViewPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string | null;
}

export function AdminViewPaymentDialog({ open, onOpenChange, bookingId }: AdminViewPaymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [serviceSummaries, setServiceSummaries] = useState<ServiceSummary[]>([]);
  const [paymentsByType, setPaymentsByType] = useState<Record<string, PaymentRecord[]>>({});

  useEffect(() => {
    if (open && bookingId) {
      fetchPaymentData();
    }
  }, [open, bookingId]);

  const fetchPaymentData = async () => {
    if (!bookingId) return;
    setLoading(true);
    
    try {
      // Fetch booking details
      const { data: bookingData } = await supabase
        .from("bookings")
        .select(`
          id, booking_number, customer_name, check_in_date, total_amount, paid_amount, due_amount,
          agents(name)
        `)
        .eq("id", bookingId)
        .single();

      if (!bookingData) return;
      setBooking(bookingData);

      // Fetch all payments for this booking
      const { data: payments } = await supabase
        .from("payments")
        .select("id, amount, payment_mode, payment_date, reference_number, notes, approval_status, payment_type, cities(name)")
        .eq("booking_id", bookingId)
        .order("payment_date", { ascending: false });

      // Fetch service-specific data
      const [safariRes, hotelRes, vehicleRes, volvoDMRes, volvomDRes] = await Promise.all([
        supabase.from("safari_bookings").select("id, booking_id, safari_date, total_amount, paid_amount, due_amount").eq("booking_id", bookingId),
        supabase.from("hotel_bookings").select("id, booking_id, check_in_date, total_amount, paid_amount, due_amount, another_hotels(name), own_hotels(name)").eq("booking_id", bookingId),
        supabase.from("vehicle_bookings").select("id, booking_id, pickup_date, total_amount, paid_amount, due_amount, transporters(name)").eq("booking_id", bookingId),
        supabase.from("volvo_bookings").select("id, booking_id, travel_date, total_amount, paid_amount, due_amount, route").eq("booking_id", bookingId).eq("route", "delhi_manali"),
        supabase.from("volvo_bookings").select("id, booking_id, travel_date, total_amount, paid_amount, due_amount, route").eq("booking_id", bookingId).eq("route", "manali_delhi"),
      ]);

      // Group payments by type
      const groupedPayments: Record<string, PaymentRecord[]> = {};
      const summaries: ServiceSummary[] = [];
      const toAmount = (value: unknown) => {
        const amount = Number(value ?? 0);
        return Number.isFinite(amount) ? amount : 0;
      };

      // Booking row is the full booking amount, not total minus services.
      const bookingTotal = toAmount(bookingData.total_amount);

      // Process Booking payments (overall) - Always show the full booking total.
      const bookingPayments = payments || [];
      const bookingReceived = bookingPayments.reduce((sum, p) => sum + toAmount(p.amount), 0);
      summaries.push({
        type: "Booking",
        customerName: bookingData.customer_name || "N/A",
        totalPayment: bookingTotal,
        totalReceived: bookingReceived,
        date: bookingData.check_in_date,
        totalDue: Math.max(0, bookingTotal - bookingReceived)
      });
      groupedPayments["Booking"] = bookingPayments.map(p => ({
        id: p.id,
        customer: bookingData.customer_name || "N/A",
        payment: toAmount(p.amount),
        date: p.payment_date || "",
        mode: p.payment_mode || "",
        paymentDetail: p.notes || p.reference_number || "",
        place: p.cities?.name || "",
        status: p.approval_status || "pending"
      }));

      // Helper function to map payments to records
      const mapPaymentsToRecords = (paymentList: any[]) => paymentList.map(p => ({
        id: p.id,
        customer: bookingData.customer_name || "N/A",
        payment: toAmount(p.amount),
        date: p.payment_date || "",
        mode: p.payment_mode || "",
        paymentDetail: p.notes || p.reference_number || "",
        place: p.cities?.name || "",
        status: p.approval_status || "pending"
      }));

      // Process Delhi-Manali Volvo payments - show if bookings exist OR payments exist
      const dmPayments = (payments || []).filter(p => p.payment_type === "delhi_manali");
      const dmBookingTotal = volvoDMRes.data?.reduce((sum, v) => sum + toAmount(v.total_amount), 0) || 0;
      const dmReceived = dmPayments.reduce((sum, p) => sum + toAmount(p.amount), 0);
      if (volvoDMRes.data?.length > 0 || dmPayments.length > 0) {
        summaries.push({
          type: "Delhi - Manali",
          customerName: bookingData.customer_name || "N/A",
          totalPayment: dmBookingTotal,
          totalReceived: dmReceived,
          date: volvoDMRes.data?.[0]?.travel_date || bookingData.check_in_date,
          totalDue: Math.max(0, dmBookingTotal - dmReceived)
        });
        groupedPayments["Delhi - Manali"] = mapPaymentsToRecords(dmPayments);
      }

      // Process Manali-Delhi Volvo payments - show if bookings exist OR payments exist
      const mdPayments = (payments || []).filter(p => p.payment_type === "manali_delhi");
      const mdBookingTotal = volvomDRes.data?.reduce((sum, v) => sum + toAmount(v.total_amount), 0) || 0;
      const mdReceived = mdPayments.reduce((sum, p) => sum + toAmount(p.amount), 0);
      if (volvomDRes.data?.length > 0 || mdPayments.length > 0) {
        summaries.push({
          type: "Manali - Delhi",
          customerName: bookingData.customer_name || "N/A",
          totalPayment: mdBookingTotal,
          totalReceived: mdReceived,
          date: volvomDRes.data?.[0]?.travel_date || bookingData.check_in_date,
          totalDue: Math.max(0, mdBookingTotal - mdReceived)
        });
        groupedPayments["Manali - Delhi"] = mapPaymentsToRecords(mdPayments);
      }

      // Process Safari payments - show if bookings exist OR payments exist
      const safariPayments = (payments || []).filter(p => p.payment_type === "safari");
      const safariBookingTotal = safariRes.data?.reduce((sum, s) => sum + toAmount(s.total_amount), 0) || 0;
      const safariReceived = safariPayments.reduce((sum, p) => sum + toAmount(p.amount), 0);
      if (safariRes.data?.length > 0 || safariPayments.length > 0) {
        summaries.push({
          type: "Safari",
          customerName: bookingData.customer_name || "N/A",
          totalPayment: safariBookingTotal,
          totalReceived: safariReceived,
          date: safariRes.data?.[0]?.safari_date || bookingData.check_in_date,
          totalDue: Math.max(0, safariBookingTotal - safariReceived)
        });
        groupedPayments["Safari"] = mapPaymentsToRecords(safariPayments);
      }

      // Process Hotel payments - split into own hotel vs another hotel
      const ownHotelData = (hotelRes.data || []).filter((h: any) => h.own_hotels);
      const anotherHotelData = (hotelRes.data || []).filter((h: any) => h.another_hotels && !h.own_hotels);

      const ownHotelPayments = (payments || []).filter(p => p.payment_type === "hotel");
      const ownHotelTotal = ownHotelData.reduce((sum: number, h: any) => sum + toAmount(h.total_amount), 0);
      const ownHotelReceived = ownHotelPayments.reduce((sum, p) => sum + toAmount(p.amount), 0);
      if (ownHotelData.length > 0 || ownHotelPayments.length > 0) {
        summaries.push({
          type: "Hotel",
          customerName: bookingData.customer_name || "N/A",
          totalPayment: ownHotelTotal,
          totalReceived: ownHotelReceived,
          date: ownHotelData[0]?.check_in_date || bookingData.check_in_date,
          totalDue: Math.max(0, ownHotelTotal - ownHotelReceived)
        });
        groupedPayments["Hotel"] = mapPaymentsToRecords(ownHotelPayments);
      }

      const anotherHotelPayments = (payments || []).filter(p => p.payment_type === "another_hotel");
      const anotherHotelTotal = anotherHotelData.reduce((sum: number, h: any) => sum + toAmount(h.total_amount), 0);
      const anotherHotelReceived = anotherHotelPayments.reduce((sum, p) => sum + toAmount(p.amount), 0);
      if (anotherHotelData.length > 0 || anotherHotelPayments.length > 0) {
        summaries.push({
          type: "Another Hotel",
          customerName: bookingData.customer_name || "N/A",
          totalPayment: anotherHotelTotal,
          totalReceived: anotherHotelReceived,
          date: anotherHotelData[0]?.check_in_date || bookingData.check_in_date,
          totalDue: Math.max(0, anotherHotelTotal - anotherHotelReceived)
        });
        groupedPayments["Another Hotel"] = mapPaymentsToRecords(anotherHotelPayments);
      }

      // Process Vehicle payments - show if bookings exist OR payments exist
      const vehiclePayments = (payments || []).filter(p => p.payment_type === "vehicle");
      const vehicleBookingTotal = vehicleRes.data?.reduce((sum, v) => sum + toAmount(v.total_amount), 0) || 0;
      const vehicleReceived = vehiclePayments.reduce((sum, p) => sum + toAmount(p.amount), 0);
      if (vehicleRes.data?.length > 0 || vehiclePayments.length > 0) {
        summaries.push({
          type: "Additional Vehicle",
          customerName: bookingData.customer_name || "N/A",
          totalPayment: vehicleBookingTotal,
          totalReceived: vehicleReceived,
          date: vehicleRes.data?.[0]?.pickup_date || bookingData.check_in_date,
          totalDue: Math.max(0, vehicleBookingTotal - vehicleReceived)
        });
        groupedPayments["Additional Vehicle"] = mapPaymentsToRecords(vehiclePayments);
      }

      setServiceSummaries(summaries);
      setPaymentsByType(groupedPayments);
    } catch (error) {
      console.error("Error fetching payment data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString("en-IN")}/-`;
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      return format(new Date(dateStr), "yyyy-MM-dd");
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0">
        <DialogHeader className="p-4 border-b" style={{ backgroundColor: "#b44a50" }}>
          <DialogTitle className="text-white flex items-center gap-2">
            📋 View Payment
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <div className="p-4 space-y-6">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading payment details...</div>
            ) : (
              <>
                {/* Summary Table */}
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold border-r"></TableHead>
                        <TableHead className="font-semibold border-r text-center">Customer Name</TableHead>
                        <TableHead className="font-semibold border-r text-center">Total Payment</TableHead>
                        <TableHead className="font-semibold border-r text-center">Total Recieved Payment</TableHead>
                        <TableHead className="font-semibold border-r text-center">Date</TableHead>
                        <TableHead className="font-semibold border-r text-center">Total Due Payment</TableHead>
                        <TableHead className="font-semibold text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {serviceSummaries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No payment records found
                          </TableCell>
                        </TableRow>
                      ) : (
                        serviceSummaries.map((summary, index) => (
                          <TableRow key={index} className="border-b">
                            <TableCell className="font-semibold border-r">{summary.type}</TableCell>
                            <TableCell className="border-r text-center">{summary.customerName}</TableCell>
                            <TableCell className="border-r text-center">{formatCurrency(summary.totalPayment)}</TableCell>
                            <TableCell className="border-r text-center">{formatCurrency(summary.totalReceived)}</TableCell>
                            <TableCell className="border-r text-center">{formatDate(summary.date)}</TableCell>
                            <TableCell className="border-r text-center">{formatCurrency(summary.totalDue)}</TableCell>
                            <TableCell className="text-center">
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="h-auto p-0 text-blue-600 hover:text-blue-800"
                                onClick={() => {
                                  const element = document.getElementById(`section-${summary.type.replace(/\s+/g, '-')}`);
                                  element?.scrollIntoView({ behavior: 'smooth' });
                                }}
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Payment Details Tables - Show ALL sections */}
                {serviceSummaries.map((summary) => {
                  const payments = paymentsByType[summary.type] || [];
                  
                  return (
                    <div key={summary.type} id={`section-${summary.type.replace(/\s+/g, '-')}`} className="border rounded-md overflow-hidden">
                      <div className="px-4 py-2 font-semibold border-b bg-muted/30">
                        {summary.type}
                      </div>
                      {payments.length === 0 ? (
                        <div className="p-4 text-center text-red-500">
                          There is no any recieved payment.
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="font-semibold border-r text-center">S.No.</TableHead>
                              <TableHead className="font-semibold border-r text-center">Customer</TableHead>
                              <TableHead className="font-semibold border-r text-center">Payment</TableHead>
                              <TableHead className="font-semibold border-r text-center">Date</TableHead>
                              <TableHead className="font-semibold border-r text-center">Mode</TableHead>
                              <TableHead className="font-semibold border-r text-center">Payment Detail</TableHead>
                              <TableHead className="font-semibold border-r text-center">Place</TableHead>
                              <TableHead className="font-semibold text-center">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {payments.map((payment, idx) => (
                              <TableRow key={payment.id} className="border-b">
                                <TableCell className="border-r text-center">{idx + 1}</TableCell>
                                <TableCell className="border-r">{payment.customer}</TableCell>
                                <TableCell className="border-r text-center">{formatCurrency(payment.payment)}</TableCell>
                                <TableCell className="border-r text-center">{formatDate(payment.date)}</TableCell>
                                <TableCell className="border-r text-center">{payment.mode}</TableCell>
                                <TableCell className="border-r max-w-[200px]" title={payment.paymentDetail}>
                                  {payment.paymentDetail || "-"}
                                </TableCell>
                                <TableCell className="border-r text-center">{payment.place || "-"}</TableCell>
                                <TableCell className="text-center">
                                  <span className={payment.status === "approved" ? "text-green-600" : "text-orange-600"}>
                                    {payment.status === "approved" ? "Approved" : "Pending"}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}