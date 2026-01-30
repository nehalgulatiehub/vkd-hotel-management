import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Eye, CreditCard, Search, CheckCircle, XCircle } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/TablePagination";
import { DateRangeFilter } from "@/components/ui/DateRangeFilter";
import { format } from "date-fns";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { reversePaymentOnRejection } from "@/utils/paymentSync";

interface PaymentWithBooking {
  id: string;
  amount: number;
  payment_date: string | null;
  payment_mode: string | null;
  approved_at: string | null;
  booking: { id: string; booking_number: string; customer_name: string | null } | null;
  hotel_name?: string | null;
  room_name?: string | null;
}

export default function AdminDMVolvoApprovedPayments() {
  const navigate = useNavigate();
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [payments, setPayments] = useState<PaymentWithBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterActive, setFilterActive] = useState(false);
  const [rejectingPaymentId, setRejectingPaymentId] = useState<string | null>(null);
  const [rejectLoading, setRejectLoading] = useState(false);

  const canManage = isAdmin() || isAccount();

  useEffect(() => { if (!authLoading && canManage) fetchPayments(); }, [authLoading, canManage]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("payments").select(`id, amount, payment_date, payment_mode, approved_at, booking:bookings(id, booking_number, customer_name)`).eq("payment_type", "delhi_manali").eq("approval_status", "approved").order("approved_at", { ascending: false });
      if (error) throw error;

      const bookingIds = [...new Set((data || []).map(p => p.booking?.id).filter(Boolean))];
      let hotelBookingsMap: Record<string, { hotel_name: string | null; room_name: string | null }> = {};
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (bookingIds.length > 0) {
        const { data: hotelBookings } = await supabase.from("hotel_bookings").select(`booking_id, room_type, hotel:another_hotels(name), own_hotel:own_hotels(name)`).in("booking_id", bookingIds);
        const roomIds = [...new Set((hotelBookings || []).map((hb: any) => hb.room_type).filter((rt: any) => rt && uuidRegex.test(rt)))];
        let roomsMap: Record<string, string> = {};
        if (roomIds.length > 0) {
          const { data: rooms } = await supabase.from("rooms").select("id, room_type, room_number").in("id", roomIds);
          roomsMap = (rooms || []).reduce((acc: Record<string, string>, r: any) => ({ ...acc, [r.id]: r.room_type || r.room_number }), {});
        }
        hotelBookings?.forEach((hb: any) => {
          const isUuid = hb.room_type && uuidRegex.test(hb.room_type);
          hotelBookingsMap[hb.booking_id] = { hotel_name: hb.hotel?.name || hb.own_hotel?.name || null, room_name: isUuid ? (roomsMap[hb.room_type] || hb.room_type) : hb.room_type || null };
        });
      }

      setPayments((data || []).map(p => ({ ...p, hotel_name: p.booking?.id ? hotelBookingsMap[p.booking.id]?.hotel_name : null, room_name: p.booking?.id ? hotelBookingsMap[p.booking.id]?.room_name : null })));
    } catch (error) { console.error("Error fetching payments:", error); } finally { setLoading(false); }
  };

  const handleRejectPayment = async () => {
    if (!rejectingPaymentId) return;
    setRejectLoading(true);
    try {
      // Fetch payment details for reversing amounts
      const { data: paymentData } = await supabase
        .from("payments")
        .select("id, amount, booking_id, payment_type")
        .eq("id", rejectingPaymentId)
        .single();

      const { error } = await supabase.from("payments").update({ approval_status: "pending", approved_at: null, approved_by: null }).eq("id", rejectingPaymentId);
      if (error) throw error;

      // Reverse the paid/due amounts since this was previously approved
      if (paymentData) {
        await reversePaymentOnRejection([paymentData]);
      }

      toast.success("Payment reverted to pending status");
      fetchPayments();
    } catch (error) { console.error("Error rejecting payment:", error); toast.error("Failed to reject payment"); } finally { setRejectLoading(false); setRejectingPaymentId(null); }
  };

  const filteredPayments = payments.filter((payment) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = payment.booking?.booking_number?.toLowerCase().includes(searchLower) || payment.booking?.customer_name?.toLowerCase().includes(searchLower);
    let matchesDate = true;
    if (filterActive && fromDate && toDate && payment.approved_at) {
      const approvedDate = new Date(payment.approved_at);
      matchesDate = approvedDate >= new Date(fromDate) && approvedDate <= new Date(toDate);
    }
    return matchesSearch && matchesDate;
  });

  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filteredPayments);

  if (authLoading) return <div className="min-h-screen"><AdminHeader title="D-M Volvo Approved Payments" /><main className="p-4"><Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card></main></div>;
  if (!canManage) return <div className="min-h-screen"><AdminHeader title="Access Denied" /><main className="p-4"><Card><CardContent className="py-8 text-center text-muted-foreground">Access denied.</CardContent></Card></main></div>;

  return (
    <div className="min-h-screen">
      <AdminHeader title="D-M Volvo Approved Payments" />
      <main className="p-4 space-y-4">
        <DateRangeFilter fromDate={fromDate} toDate={toDate} onFromDateChange={setFromDate} onToDateChange={setToDate} onSearch={() => setFilterActive(true)} onClear={() => { setFromDate(""); setToDate(""); setFilterActive(false); }} />
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /> Delhi-Manali Volvo Approved - Total: ₹{totalAmount.toLocaleString()}</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-4"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></div></div>
            {loading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> : filteredPayments.length === 0 ? <div className="text-center py-8 text-muted-foreground">No approved D-M Volvo payments found.</div> : (
              <>
                <Table>
                  <TableHeader><TableRow><TableHead>Booking #</TableHead><TableHead>Customer</TableHead><TableHead>Hotel</TableHead><TableHead>Room</TableHead><TableHead>Payment Date</TableHead><TableHead>Approved Date</TableHead><TableHead>Mode</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {paginatedItems.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.booking?.booking_number || "-"}</TableCell>
                        <TableCell>{payment.booking?.customer_name || "-"}</TableCell>
                        <TableCell>{payment.hotel_name || "-"}</TableCell>
                        <TableCell>{payment.room_name || "-"}</TableCell>
                        <TableCell>{payment.payment_date ? format(new Date(payment.payment_date), "dd/MM/yyyy") : "-"}</TableCell>
                        <TableCell>{payment.approved_at ? format(new Date(payment.approved_at), "dd/MM/yyyy") : "-"}</TableCell>
                        <TableCell>{payment.payment_mode || "-"}</TableCell>
                        <TableCell className="text-right">₹{payment.amount.toLocaleString()}</TableCell>
                        <TableCell><Badge className="bg-green-600">Approved</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => payment.booking && navigate(`/admin/bookings/${payment.booking.id}`)}><Eye className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => payment.booking && navigate(`/admin/booking-payments?id=${payment.booking.id}`)}><CreditCard className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => setRejectingPaymentId(payment.id)}><XCircle className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} totalItems={totalItems} startIndex={startIndex} endIndex={endIndex} />
              </>
            )}
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={!!rejectingPaymentId} onOpenChange={() => setRejectingPaymentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Reject Payment</AlertDialogTitle><AlertDialogDescription>Are you sure you want to reject this payment? It will be reverted to pending status.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={rejectLoading}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleRejectPayment} disabled={rejectLoading} className="bg-red-600 hover:bg-red-700">{rejectLoading ? "Rejecting..." : "Reject"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
