import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Eye, CreditCard, Search, CheckCircle, XCircle } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/TablePagination";
import { DateRangeFilter } from "@/components/ui/DateRangeFilter";
import { format } from "date-fns";
import { toast } from "sonner";

interface PaymentWithBooking {
  id: string;
  amount: number;
  payment_date: string | null;
  payment_mode: string | null;
  approval_status: string | null;
  booking: {
    id: string;
    booking_number: string;
    customer_name: string | null;
  } | null;
}

export default function AdminDMVolvoPendingPayments() {
  const navigate = useNavigate();
  const { isAdmin, isAccount, user, loading: authLoading } = useAuthContext();
  const [payments, setPayments] = useState<PaymentWithBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterActive, setFilterActive] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());

  const canManage = isAdmin() || isAccount();

  useEffect(() => {
    if (!authLoading && canManage) {
      fetchPayments();
    }
  }, [authLoading, canManage]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          id, amount, payment_date, payment_mode, approval_status,
          booking:bookings(id, booking_number, customer_name)
        `)
        .eq("payment_type", "delhi_manali")
        .eq("approval_status", "pending")
        .order("payment_date", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      payment.booking?.booking_number?.toLowerCase().includes(searchLower) ||
      payment.booking?.customer_name?.toLowerCase().includes(searchLower);

    let matchesDate = true;
    if (filterActive && fromDate && toDate && payment.payment_date) {
      const paymentDate = new Date(payment.payment_date);
      matchesDate = paymentDate >= new Date(fromDate) && paymentDate <= new Date(toDate);
    }

    return matchesSearch && matchesDate;
  });

  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filteredPayments);

  const handleSelectPayment = (paymentId: string, checked: boolean) => {
    setSelectedPayments(prev => {
      const newSet = new Set(prev);
      checked ? newSet.add(paymentId) : newSet.delete(paymentId);
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedPayments(checked ? new Set(paginatedItems.map(p => p.id)) : new Set());
  };

  const handleBulkApproval = async (status: "approved" | "rejected") => {
    if (selectedPayments.size === 0) {
      toast.error("Please select at least one payment");
      return;
    }
    try {
      const { error } = await supabase
        .from("payments")
        .update({ approval_status: status, approved_by: user?.id, approved_at: new Date().toISOString() })
        .in("id", Array.from(selectedPayments));
      if (error) throw error;
      toast.success(`${selectedPayments.size} payment(s) ${status}`);
      setSelectedPayments(new Set());
      fetchPayments();
    } catch (error) {
      toast.error("Failed to update payments");
    }
  };

  const handleSingleApproval = async (paymentId: string, status: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("payments")
        .update({ approval_status: status, approved_by: user?.id, approved_at: new Date().toISOString() })
        .eq("id", paymentId);
      if (error) throw error;
      toast.success(`Payment ${status}`);
      setPayments(prev => prev.filter(p => p.id !== paymentId));
    } catch (error) {
      toast.error("Failed to update payment");
    }
  };

  if (authLoading) {
    return <div className="min-h-screen"><AdminHeader title="D-M Volvo Pending Payments" /><main className="p-4"><Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card></main></div>;
  }

  if (!canManage) {
    return <div className="min-h-screen"><AdminHeader title="Access Denied" /><main className="p-4"><Card><CardContent className="py-8 text-center text-muted-foreground">Access denied.</CardContent></Card></main></div>;
  }

  return (
    <div className="min-h-screen">
      <AdminHeader title="D-M Volvo Pending Payments" />
      <main className="p-4 space-y-4">
        <DateRangeFilter fromDate={fromDate} toDate={toDate} onFromDateChange={setFromDate} onToDateChange={setToDate} onSearch={() => setFilterActive(true)} onClear={() => { setFromDate(""); setToDate(""); setFilterActive(false); }} />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Delhi-Manali Volvo Pending - Total: ₹{totalAmount.toLocaleString()}</CardTitle>
            {selectedPayments.size > 0 && (
              <div className="flex gap-2">
                <Button size="sm" variant="default" onClick={() => handleBulkApproval("approved")}><CheckCircle className="h-4 w-4 mr-1" /> Approve ({selectedPayments.size})</Button>
                <Button size="sm" variant="destructive" onClick={() => handleBulkApproval("rejected")}><XCircle className="h-4 w-4 mr-1" /> Reject ({selectedPayments.size})</Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No pending D-M Volvo payments found.</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"><Checkbox checked={paginatedItems.length > 0 && selectedPayments.size === paginatedItems.length} onCheckedChange={handleSelectAll} /></TableHead>
                      <TableHead>Booking #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell><Checkbox checked={selectedPayments.has(payment.id)} onCheckedChange={(checked) => handleSelectPayment(payment.id, !!checked)} /></TableCell>
                        <TableCell className="font-medium">{payment.booking?.booking_number || "-"}</TableCell>
                        <TableCell>{payment.booking?.customer_name || "-"}</TableCell>
                        <TableCell>{payment.payment_date ? format(new Date(payment.payment_date), "dd/MM/yyyy") : "-"}</TableCell>
                        <TableCell>{payment.payment_mode || "-"}</TableCell>
                        <TableCell className="text-right">₹{payment.amount.toLocaleString()}</TableCell>
                        <TableCell><Badge variant="outline" className="text-yellow-600">Pending</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => payment.booking && navigate(`/admin/bookings/${payment.booking.id}`)}><Eye className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => payment.booking && navigate(`/admin/booking-payments?id=${payment.booking.id}`)}><CreditCard className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" className="text-green-600" onClick={() => handleSingleApproval(payment.id, "approved")}><CheckCircle className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleSingleApproval(payment.id, "rejected")}><XCircle className="h-4 w-4" /></Button>
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
