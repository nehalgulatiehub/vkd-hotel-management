import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { Wallet } from "lucide-react";
import { TablePagination } from "@/components/ui/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { DateRangeFilter } from "@/components/ui/DateRangeFilter";

interface PaymentWithDetails {
  id: string;
  amount: number;
  payment_mode: string | null;
  payment_date: string | null;
  payment_type: string | null;
  reference_number: string | null;
  approval_status: string | null;
  booking: {
    id: string;
    booking_number: string;
    customer_name: string | null;
  } | null;
}

export default function ViewPaidPayment() {
  const { isAdmin, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCustomer, setSearchCustomer] = useState("");
  const [filterPaymentMode, setFilterPaymentMode] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");

  const filteredPayments = payments.filter(payment => {
    const matchesCustomer = !searchCustomer || 
      payment.booking?.customer_name?.toLowerCase().includes(searchCustomer.toLowerCase()) ||
      payment.booking?.booking_number?.toLowerCase().includes(searchCustomer.toLowerCase());
    const matchesMode = filterPaymentMode === "all" || 
      payment.payment_mode?.toLowerCase() === filterPaymentMode.toLowerCase();
    
    let matchesDate = true;
    if (appliedFromDate || appliedToDate) {
      const paymentDate = payment.payment_date ? new Date(payment.payment_date) : null;
      if (paymentDate) {
        if (appliedFromDate) matchesDate = matchesDate && paymentDate >= new Date(appliedFromDate);
        if (appliedToDate) matchesDate = matchesDate && paymentDate <= new Date(appliedToDate);
      } else {
        matchesDate = false;
      }
    }
    
    return matchesCustomer && matchesMode && matchesDate;
  });

  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filteredPayments, { itemsPerPage: 10 });

  const totalPaid = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  useEffect(() => {
    if (!authLoading && isAdmin()) {
      fetchPayments();
    }
  }, [authLoading]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          id, amount, payment_mode, payment_date, payment_type, reference_number, approval_status,
          booking:bookings(id, booking_number, customer_name)
        `)
        .eq("approval_status", "approved")
        .order("payment_date", { ascending: false });

      if (error) throw error;
      setPayments((data || []) as PaymentWithDetails[]);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSearch = () => {
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
  };

  const handleDateClear = () => {
    setFromDate("");
    setToDate("");
    setAppliedFromDate("");
    setAppliedToDate("");
  };

  if (authLoading) {
    return <div className="min-h-screen"><Header title="View Paid Payment" /><main className="p-4"><Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card></main></div>;
  }

  if (!isAdmin()) {
    return <div className="min-h-screen"><Header title="Access Denied" /><main className="p-4"><Card><CardContent className="py-8 text-center text-muted-foreground">Admin access required.</CardContent></Card></main></div>;
  }

  return (
    <div className="min-h-screen">
      <Header title="View Paid Payment" />
      <main className="p-4 space-y-4">
        <DateRangeFilter
          fromDate={fromDate}
          toDate={toDate}
          onFromDateChange={setFromDate}
          onToDateChange={setToDate}
          onSearch={handleDateSearch}
          onClear={handleDateClear}
        />
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Paid Payments
            </CardTitle>
            <Badge variant="default" className="text-lg bg-green-600">
              Total Paid: Rs. {totalPaid.toLocaleString()}/-
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <Input
                placeholder="Search by customer or booking..."
                value={searchCustomer}
                onChange={(e) => setSearchCustomer(e.target.value)}
              />
              <Select value={filterPaymentMode} onValueChange={setFilterPaymentMode}>
                <SelectTrigger>
                  <SelectValue placeholder="Payment Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="net banking">Net Banking</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : paginatedItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No paid payments found.</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S.No</TableHead>
                      <TableHead>Booking</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((payment, index) => (
                      <TableRow key={payment.id}>
                        <TableCell>{(currentPage - 1) * 10 + index + 1}</TableCell>
                        <TableCell className="font-medium">{payment.booking?.booking_number || "N/A"}</TableCell>
                        <TableCell>{payment.booking?.customer_name || "N/A"}</TableCell>
                        <TableCell>{payment.payment_date ? format(new Date(payment.payment_date), "dd-MMM-yyyy") : "N/A"}</TableCell>
                        <TableCell className="text-green-600 font-medium">Rs. {payment.amount?.toLocaleString() || 0}/-</TableCell>
                        <TableCell>{payment.payment_mode || "N/A"}</TableCell>
                        <TableCell>{payment.payment_type || "N/A"}</TableCell>
                        <TableCell>{payment.reference_number || "N/A"}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => navigate(`/admin/bookings/${payment.booking?.id}`)}>
                              View Booking
                            </Button>
                            <Button variant="link" size="sm" className="h-auto p-0 text-xs text-blue-600" onClick={() => navigate(`/admin/booking-payments?id=${payment.booking?.id}`)}>
                              View Payments
                            </Button>
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
