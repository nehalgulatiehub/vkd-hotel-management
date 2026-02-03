import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

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

      // Calculate service-specific totals first
      const safariTotal = safariRes.data?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0;
      const hotelTotal = hotelRes.data?.reduce((sum, h) => sum + (h.total_amount || 0), 0) || 0;
      const vehicleTotal = vehicleRes.data?.reduce((sum, v) => sum + (v.total_amount || 0), 0) || 0;
      const dmTotal = volvoDMRes.data?.reduce((sum, v) => sum + (v.total_amount || 0), 0) || 0;
      const mdTotal = volvomDRes.data?.reduce((sum, v) => sum + (v.total_amount || 0), 0) || 0;
      const servicesTotal = safariTotal + hotelTotal + vehicleTotal + dmTotal + mdTotal;
      
      // Booking amount is total minus service-specific amounts
      const bookingOnlyAmount = Math.max(0, (bookingData.total_amount || 0) - servicesTotal);

      // Helper function to map payments to records
      const mapPaymentsToRecords = (paymentList: any[]) => paymentList.map(p => ({
        id: p.id,
        customer: bookingData.customer_name || "N/A",
        payment: p.amount,
        date: p.payment_date || "",
        mode: p.payment_mode || "",
        paymentDetail: p.notes || p.reference_number || "",
        place: p.cities?.name || "",
        cityId: p.city_id || null,
        status: p.approval_status || "pending",
        referenceNumber: p.reference_number || ""
      }));

      // Process Booking payments (general) - Always show
      const bookingPayments = (payments || []).filter(p => !p.payment_type || p.payment_type === "booking");
      const bookingReceived = bookingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      summaries.push({
        type: "Booking",
        customerName: bookingData.customer_name || "N/A",
        totalPayment: bookingOnlyAmount,
        totalReceived: bookingReceived,
        date: bookingData.check_in_date,
        totalDue: Math.max(0, bookingOnlyAmount - bookingReceived)
      });
      groupedPayments["Booking"] = mapPaymentsToRecords(bookingPayments);

      // Process Delhi-Manali Volvo payments
      const dmPayments = (payments || []).filter(p => p.payment_type === "delhi_manali");
      const dmBookingTotal = volvoDMRes.data?.reduce((sum, v) => sum + (v.total_amount || 0), 0) || 0;
      const dmReceived = dmPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
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

      // Process Manali-Delhi Volvo payments
      const mdPayments = (payments || []).filter(p => p.payment_type === "manali_delhi");
      const mdBookingTotal = volvomDRes.data?.reduce((sum, v) => sum + (v.total_amount || 0), 0) || 0;
      const mdReceived = mdPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
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

      // Process Safari payments
      const safariPayments = (payments || []).filter(p => p.payment_type === "safari");
      const safariBookingTotal = safariRes.data?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0;
      const safariReceived = safariPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
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

      // Process Hotel payments
      const hotelPayments = (payments || []).filter(p => p.payment_type === "hotel" || p.payment_type === "another_hotel");
      const hotelBookingTotal = hotelRes.data?.reduce((sum, h) => sum + (h.total_amount || 0), 0) || 0;
      const hotelReceived = hotelPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      if (hotelRes.data?.length > 0 || hotelPayments.length > 0) {
        summaries.push({
          type: "Another Hotel",
          customerName: bookingData.customer_name || "N/A",
          totalPayment: hotelBookingTotal,
          totalReceived: hotelReceived,
          date: hotelRes.data?.[0]?.check_in_date || bookingData.check_in_date,
          totalDue: Math.max(0, hotelBookingTotal - hotelReceived)
        });
        groupedPayments["Another Hotel"] = mapPaymentsToRecords(hotelPayments);
      }

      // Process Vehicle payments
      const vehiclePayments = (payments || []).filter(p => p.payment_type === "vehicle");
      const vehicleBookingTotal = vehicleRes.data?.reduce((sum, v) => sum + (v.total_amount || 0), 0) || 0;
      const vehicleReceived = vehiclePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
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
      fetchPaymentData();
      onPaymentUpdated?.();
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error("Failed to delete payment");
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0">
          <DialogHeader className="p-4 border-b" style={{ backgroundColor: "#1e6e99" }}>
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
                                    <span className={payment.status === "approved" ? "text-green-600" : "text-orange-600"}>
                                      {payment.status === "approved" ? "Approved" : "Pending"}
                                    </span>
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
