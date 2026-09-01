import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { formatDisplayDate } from "@/utils/dateFormat";
import { recalcAllModulesForBooking } from "@/utils/paymentSync";

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
  cityId: string | null;
  status: string;
  referenceNumber: string;
}

interface UserViewPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string | null;
  onPaymentUpdated?: () => void;
}

export function UserViewPaymentDialog({ open, onOpenChange, bookingId, onPaymentUpdated }: UserViewPaymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [serviceSummaries, setServiceSummaries] = useState<ServiceSummary[]>([]);
  const [paymentsByType, setPaymentsByType] = useState<Record<string, PaymentRecord[]>>({});
  const [cities, setCities] = useState<any[]>([]);
  
  // Edit payment states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [editPaymentAmount, setEditPaymentAmount] = useState("");
  const [editPaymentMode, setEditPaymentMode] = useState("");
  const [editPaymentReference, setEditPaymentReference] = useState("");
  const [editPaymentCityId, setEditPaymentCityId] = useState("");
  
  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);

  useEffect(() => {
    if (open && bookingId) {
      fetchPaymentData();
      fetchCities();
    }
  }, [open, bookingId]);

  const fetchCities = async () => {
    const { data } = await supabase.from("cities").select("id, name").order("name");
    setCities(data || []);
  };

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
        .select("id, amount, payment_mode, payment_date, reference_number, notes, approval_status, payment_type, city_id, cities(name)")
        .eq("booking_id", bookingId)
        .order("payment_date", { ascending: false });

      // Fetch service-specific data
      const [safariRes, hotelRes, vehicleRes, volvoRes, visaRes, cruiseRes] = await Promise.all([
        supabase.from("safari_bookings").select("id, booking_id, safari_date, total_amount, paid_amount, due_amount").eq("booking_id", bookingId),
        supabase.from("hotel_bookings").select("id, booking_id, check_in_date, total_amount, paid_amount, due_amount, own_hotel_id, another_hotels(name), own_hotels(name)").eq("booking_id", bookingId),
        supabase.from("vehicle_bookings").select("id, booking_id, pickup_date, total_amount, paid_amount, due_amount, transporters(name)").eq("booking_id", bookingId),
        supabase.from("volvo_bookings").select("id, booking_id, travel_date, total_amount, paid_amount, due_amount, route").eq("booking_id", bookingId),
        supabase.from("visa_bookings").select("id, booking_id, visa_date, total_amount").eq("booking_id", bookingId),
        supabase.from("cruise_bookings").select("id, booking_id, cruise_date, total_amount").eq("booking_id", bookingId),
      ]);

      // Split volvo bookings by route
      const volvoDMData = volvoRes.data?.filter(v => v.route?.toLowerCase().includes("delhi") && v.route?.toLowerCase().indexOf("delhi") < v.route?.toLowerCase().indexOf("manali")) || [];
      const volvoMDData = volvoRes.data?.filter(v => v.route?.toLowerCase().includes("manali") && v.route?.toLowerCase().indexOf("manali") < v.route?.toLowerCase().indexOf("delhi")) || [];

      // Group payments by type
      const groupedPayments: Record<string, PaymentRecord[]> = {};
      const summaries: ServiceSummary[] = [];
      const toAmount = (value: unknown) => {
        const amount = Number(value ?? 0);
        return Number.isFinite(amount) ? amount : 0;
      };

      const bookingGrandTotal = toAmount(bookingData.total_amount);

      // Helper function to map payments to records
      const mapPaymentsToRecords = (paymentList: any[]) => paymentList.map(p => ({
        id: p.id,
        customer: bookingData.customer_name || "N/A",
        payment: toAmount(p.amount),
        date: p.payment_date || "",
        mode: p.payment_mode || "",
        paymentDetail: p.notes || p.reference_number || "",
        place: p.cities?.name || "",
        cityId: p.city_id || null,
        status: p.approval_status || "pending",
        referenceNumber: p.reference_number || ""
      }));

      // Determine hotel context
      const ownHotelData = (hotelRes.data || []).filter((h: any) => h.own_hotel_id || h.own_hotels);
      const hasOwnHotel = ownHotelData.length > 0;
      const anotherHotelData = (hotelRes.data || []).filter((h: any) => h.another_hotels && !h.own_hotel_id && !h.own_hotels);
      const hasAnotherHotel = anotherHotelData.length > 0;
      const anotherHotelPayments = (payments || []).filter(p => p.payment_type === "another_hotel");
      // When the booking is on an another_hotel (not our own), skip the generic "Booking" row
      // and show only the "Another Hotel" section. Otherwise show the Booking row as usual.
      const showBookingRow = !(hasAnotherHotel && !hasOwnHotel);

      // Payments tagged to a service module never belong to the Booking (own hotel) row
      const MODULE_PAYMENT_TYPES = new Set([
        "safari", "hotel", "another_hotel", "vehicle",
        "volvo_dm", "volvo_md", "delhi_manali", "manali_delhi", "visa", "cruise",
      ]);

      // Module totals (used to derive the own-hotel share of the booking amount)
      const safariTotalAmount = (safariRes.data || []).reduce((s, r: any) => s + toAmount(r.total_amount), 0);
      const dmTotalAmount = volvoDMData.reduce((s, r: any) => s + toAmount(r.total_amount), 0);
      const mdTotalAmount = volvoMDData.reduce((s, r: any) => s + toAmount(r.total_amount), 0);
      const vehicleTotalAmount = (vehicleRes.data || []).reduce((s, r: any) => s + toAmount(r.total_amount), 0);
      const anotherHotelTotalAmount = anotherHotelData.reduce((s: number, r: any) => s + toAmount(r.total_amount), 0);
      const visaTotalAmount = (visaRes.data || []).reduce((s, r: any) => s + toAmount(r.total_amount), 0);
      const cruiseTotalAmount = (cruiseRes.data || []).reduce((s, r: any) => s + toAmount(r.total_amount), 0);
      const modulesTotalAmount = safariTotalAmount + dmTotalAmount + mdTotalAmount + vehicleTotalAmount
        + anotherHotelTotalAmount + visaTotalAmount + cruiseTotalAmount;
      const ownHotelTotalAmount = ownHotelData.reduce((s: number, r: any) => s + toAmount(r.total_amount), 0);

      const nonModulePayments = (payments || []).filter(
        p => !MODULE_PAYMENT_TYPES.has((p.payment_type || "").toLowerCase())
      );

      if (showBookingRow) {
        const bookingPayments = nonModulePayments;
        const bookingReceived = bookingPayments.reduce((sum, p) => sum + toAmount(p.amount), 0);
        const bookingTotal = ownHotelTotalAmount > 0
          ? ownHotelTotalAmount
          : Math.max(0, bookingGrandTotal - modulesTotalAmount);
        summaries.push({
          type: "Booking",
          customerName: bookingData.customer_name || "N/A",
          totalPayment: bookingTotal,
          totalReceived: bookingReceived,
          date: bookingData.check_in_date,
          totalDue: Math.max(0, bookingTotal - bookingReceived)
        });
        groupedPayments["Booking"] = mapPaymentsToRecords(bookingPayments);
      }

      // Process Delhi-Manali Volvo payments
      const dmPayments = (payments || []).filter(p => p.payment_type === "delhi_manali");
      const dmReceived = dmPayments.reduce((sum, p) => sum + toAmount(p.amount), 0);
      if (volvoDMData.length > 0 || dmPayments.length > 0) {
        summaries.push({
          type: "Delhi - Manali",
          customerName: bookingData.customer_name || "N/A",
          totalPayment: dmTotalAmount,
          totalReceived: dmReceived,
          date: volvoDMData[0]?.travel_date || bookingData.check_in_date,
          totalDue: Math.max(0, dmTotalAmount - dmReceived)
        });
        groupedPayments["Delhi - Manali"] = mapPaymentsToRecords(dmPayments);
      }

      // Process Manali-Delhi Volvo payments
      const mdPayments = (payments || []).filter(p => p.payment_type === "manali_delhi");
      const mdReceived = mdPayments.reduce((sum, p) => sum + toAmount(p.amount), 0);
      if (volvoMDData.length > 0 || mdPayments.length > 0) {
        summaries.push({
          type: "Manali - Delhi",
          customerName: bookingData.customer_name || "N/A",
          totalPayment: mdTotalAmount,
          totalReceived: mdReceived,
          date: volvoMDData[0]?.travel_date || bookingData.check_in_date,
          totalDue: Math.max(0, mdTotalAmount - mdReceived)
        });
        groupedPayments["Manali - Delhi"] = mapPaymentsToRecords(mdPayments);
      }

      // Process Safari payments
      const safariPayments = (payments || []).filter(p => p.payment_type === "safari");
      const safariReceived = safariPayments.reduce((sum, p) => sum + toAmount(p.amount), 0);
      if (safariRes.data?.length > 0 || safariPayments.length > 0) {
        summaries.push({
          type: "Safari",
          customerName: bookingData.customer_name || "N/A",
          totalPayment: safariTotalAmount,
          totalReceived: safariReceived,
          date: safariRes.data?.[0]?.safari_date || bookingData.check_in_date,
          totalDue: Math.max(0, safariTotalAmount - safariReceived)
        });
        groupedPayments["Safari"] = mapPaymentsToRecords(safariPayments);
      }

      // Another hotel section - if the booking is on another_hotel we show all payments here,
      // otherwise only the payments explicitly tagged as another_hotel.
      const anotherHotelDisplayPayments = (hasAnotherHotel && !hasOwnHotel)
        ? (payments || [])
        : anotherHotelPayments;
      const anotherHotelTotal = hasAnotherHotel && !hasOwnHotel
        ? (anotherHotelTotalAmount > 0 ? anotherHotelTotalAmount : bookingGrandTotal)
        : anotherHotelTotalAmount;
      const anotherHotelReceived = anotherHotelDisplayPayments.reduce((sum, p) => sum + toAmount(p.amount), 0);
      if (hasAnotherHotel || anotherHotelPayments.length > 0) {
        summaries.push({
          type: "Another Hotel",
          customerName: bookingData.customer_name || "N/A",
          totalPayment: anotherHotelTotal,
          totalReceived: anotherHotelReceived,
          date: anotherHotelData[0]?.check_in_date || bookingData.check_in_date,
          totalDue: Math.max(0, anotherHotelTotal - anotherHotelReceived)
        });
        groupedPayments["Another Hotel"] = mapPaymentsToRecords(anotherHotelDisplayPayments);
      }

      // Process Vehicle payments
      const vehiclePayments = (payments || []).filter(p => p.payment_type === "vehicle");
      const vehicleReceived = vehiclePayments.reduce((sum, p) => sum + toAmount(p.amount), 0);
      if (vehicleRes.data?.length > 0 || vehiclePayments.length > 0) {
        summaries.push({
          type: "Additional Vehicle",
          customerName: bookingData.customer_name || "N/A",
          totalPayment: vehicleTotalAmount,
          totalReceived: vehicleReceived,
          date: vehicleRes.data?.[0]?.pickup_date || bookingData.check_in_date,
          totalDue: Math.max(0, vehicleTotalAmount - vehicleReceived)
        });
        groupedPayments["Additional Vehicle"] = mapPaymentsToRecords(vehiclePayments);
      }

      // Visa
      const visaPayments = (payments || []).filter(p => p.payment_type === "visa");
      const visaReceived = visaPayments.reduce((sum, p) => sum + toAmount(p.amount), 0);
      if ((visaRes.data?.length || 0) > 0 || visaPayments.length > 0) {
        summaries.push({
          type: "Visa",
          customerName: bookingData.customer_name || "N/A",
          totalPayment: visaTotalAmount,
          totalReceived: visaReceived,
          date: (visaRes.data?.[0] as any)?.visa_date || bookingData.check_in_date,
          totalDue: Math.max(0, visaTotalAmount - visaReceived)
        });
        groupedPayments["Visa"] = mapPaymentsToRecords(visaPayments);
      }

      // Cruise
      const cruisePayments = (payments || []).filter(p => p.payment_type === "cruise");
      const cruiseReceived = cruisePayments.reduce((sum, p) => sum + toAmount(p.amount), 0);
      if ((cruiseRes.data?.length || 0) > 0 || cruisePayments.length > 0) {
        summaries.push({
          type: "Cruise",
          customerName: bookingData.customer_name || "N/A",
          totalPayment: cruiseTotalAmount,
          totalReceived: cruiseReceived,
          date: (cruiseRes.data?.[0] as any)?.cruise_date || bookingData.check_in_date,
          totalDue: Math.max(0, cruiseTotalAmount - cruiseReceived)
        });
        groupedPayments["Cruise"] = mapPaymentsToRecords(cruisePayments);
      }

      // Extra amount received over the Booking (own hotel) total is adjusted into the
      // other modules that still have a due amount (safari, vehicle, etc.).
      const bookingRow = summaries.find(s => s.type === "Booking");
      if (bookingRow) {
        let extra = bookingRow.totalReceived - bookingRow.totalPayment;
        if (extra > 0) {
          bookingRow.totalReceived = bookingRow.totalPayment;
          bookingRow.totalDue = 0;
          for (const s of summaries) {
            if (s.type === "Booking" || extra <= 0) continue;
            const need = Math.max(0, s.totalPayment - s.totalReceived);
            if (need <= 0) continue;
            const take = Math.min(need, extra);
            s.totalReceived += take;
            s.totalDue = Math.max(0, s.totalPayment - s.totalReceived);
            extra -= take;
          }
          if (extra > 0) {
            bookingRow.totalReceived += extra;
          }
        }
      }

      setServiceSummaries(summaries);
      setPaymentsByType(groupedPayments);
    } catch (error) {
      console.error("Error fetching payment data:", error);
    } finally {
      setLoading(false);
    }
  };

  const recalcBookingTotals = async () => {
    if (!bookingId) return;
    try {
      await recalcAllModulesForBooking(bookingId);
    } catch (error) {
      console.error("Error recalculating booking totals:", error);
    }
  };

  const handleEditPayment = (payment: PaymentRecord) => {
    setEditingPayment(payment);
    setEditPaymentAmount(String(payment.payment));
    setEditPaymentMode(payment.mode);
    setEditPaymentReference(payment.referenceNumber);
    setEditPaymentCityId(payment.cityId || "");
    setEditDialogOpen(true);
  };

  const handleEditPaymentSave = async () => {
    if (!editingPayment) return;
    
    try {
      const { error } = await supabase
        .from("payments")
        .update({
          amount: parseFloat(editPaymentAmount),
          payment_mode: editPaymentMode,
          reference_number: editPaymentReference,
          city_id: editPaymentCityId || null,
        })
        .eq("id", editingPayment.id);

      if (error) throw error;

      toast.success("Payment updated successfully");
      setEditDialogOpen(false);
      setEditingPayment(null);
      await recalcBookingTotals();
      fetchPaymentData();
      onPaymentUpdated?.();
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Failed to update payment");
    }
  };

  const handleDeletePayment = async () => {
    if (!deletingPaymentId) return;
    
    try {
      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", deletingPaymentId);

      if (error) throw error;

      toast.success("Payment deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingPaymentId(null);
      await recalcBookingTotals();
      fetchPaymentData();
      onPaymentUpdated?.();
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error("Failed to delete payment");
    }
  };

  const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString("en-IN")}/-`;
  const formatDate = (dateStr: string) => {
    return formatDisplayDate(dateStr, "N/A");
  };

  return (
    <>
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
                                    setTimeout(() => {
                                      const element = document.getElementById(`section-${summary.type.replace(/\s+/g, '-')}`);
                                      if (element) {
                                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                      }
                                    }, 100);
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

                  {/* Payment Details Tables */}
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
                                <TableHead className="font-semibold border-r text-center">Status</TableHead>
                                <TableHead className="font-semibold text-center">Action</TableHead>
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
                                  <TableCell className="border-r text-center">
                                    {summary.totalDue <= 0 && summary.totalReceived > 0 ? (
                                      <span className="text-green-600">Paid</span>
                                    ) : (
                                      <span className={payment.status === "approved" ? "text-green-600" : "text-orange-600"}>
                                        {payment.status === "approved" ? "Approved" : "Pending"}
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => handleEditPayment(payment)}
                                        className="text-[#dc2626] hover:text-[#dc2626]/80 underline text-xs"
                                      >
                                        Edit
                                      </button>
                                      <span className="text-gray-400">|</span>
                                      <button
                                        onClick={() => {
                                          setDeletingPaymentId(payment.id);
                                          setDeleteDialogOpen(true);
                                        }}
                                        className="text-[#dc2626] hover:text-[#dc2626]/80 underline text-xs"
                                      >
                                        Delete
                                      </button>
                                    </div>
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

      {/* Edit Payment Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Payment Amount <span className="text-destructive">*</span></Label>
              <Input
                type="number"
                value={editPaymentAmount}
                onChange={(e) => setEditPaymentAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Mode <span className="text-destructive">*</span></Label>
              <Select value={editPaymentMode} onValueChange={setEditPaymentMode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reference Number</Label>
              <Input
                value={editPaymentReference}
                onChange={(e) => setEditPaymentReference(e.target.value)}
                placeholder="Transaction/Cheque number"
              />
            </div>
            <div className="space-y-2">
              <Label>Place (City)</Label>
              <Select value={editPaymentCityId} onValueChange={setEditPaymentCityId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditPaymentSave}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePayment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
