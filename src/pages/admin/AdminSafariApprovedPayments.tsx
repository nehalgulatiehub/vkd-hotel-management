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
import { Eye, CreditCard, Search, CheckCircle } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/TablePagination";
import { DateRangeFilter } from "@/components/ui/DateRangeFilter";
import { format } from "date-fns";

interface PaymentWithBooking {
  id: string;
  amount: number;
  payment_date: string | null;
  payment_mode: string | null;
  approved_at: string | null;
  booking: { id: string; booking_number: string; customer_name: string | null } | null;
}

export default function AdminSafariApprovedPayments() {
  const navigate = useNavigate();
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [payments, setPayments] = useState<PaymentWithBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterActive, setFilterActive] = useState(false);

  const canManage = isAdmin() || isAccount();

  useEffect(() => { if (!authLoading && canManage) fetchPayments(); }, [authLoading, canManage]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("payments").select(`id, amount, payment_date, payment_mode, approved_at, booking:bookings(id, booking_number, customer_name)`).eq("payment_type", "safari").eq("approval_status", "approved").order("approved_at", { ascending: false });
      if (error) throw error;
      setPayments(data || []);
    } catch (error) { console.error("Error fetching payments:", error); } finally { setLoading(false); }
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

  if (authLoading) return <div className="min-h-screen"><AdminHeader title="Safari Approved Payments" /><main className="p-4"><Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card></main></div>;
  if (!canManage) return <div className="min-h-screen"><AdminHeader title="Access Denied" /><main className="p-4"><Card><CardContent className="py-8 text-center text-muted-foreground">Access denied.</CardContent></Card></main></div>;

  return (
    <div className="min-h-screen">
      <AdminHeader title="Safari Approved Payments" />
      <main className="p-4 space-y-4">
        <DateRangeFilter fromDate={fromDate} toDate={toDate} onFromDateChange={setFromDate} onToDateChange={setToDate} onSearch={() => setFilterActive(true)} onClear={() => { setFromDate(""); setToDate(""); setFilterActive(false); }} />
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /> Safari Approved Payments - Total: ₹{totalAmount.toLocaleString()}</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-4"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></div></div>
            {loading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> : filteredPayments.length === 0 ? <div className="text-center py-8 text-muted-foreground">No approved safari payments found.</div> : (
              <>
                <Table>
                  <TableHeader><TableRow><TableHead>Booking #</TableHead><TableHead>Customer</TableHead><TableHead>Payment Date</TableHead><TableHead>Approved Date</TableHead><TableHead>Mode</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {paginatedItems.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.booking?.booking_number || "-"}</TableCell>
                        <TableCell>{payment.booking?.customer_name || "-"}</TableCell>
                        <TableCell>{payment.payment_date ? format(new Date(payment.payment_date), "dd/MM/yyyy") : "-"}</TableCell>
                        <TableCell>{payment.approved_at ? format(new Date(payment.approved_at), "dd/MM/yyyy") : "-"}</TableCell>
                        <TableCell>{payment.payment_mode || "-"}</TableCell>
                        <TableCell className="text-right">₹{payment.amount.toLocaleString()}</TableCell>
                        <TableCell><Badge className="bg-green-600">Approved</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => payment.booking && navigate(`/admin/bookings/${payment.booking.id}`)}><Eye className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => payment.booking && navigate(`/admin/booking-payments?id=${payment.booking.id}`)}><CreditCard className="h-4 w-4" /></Button>
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
    </div>
  );
}
