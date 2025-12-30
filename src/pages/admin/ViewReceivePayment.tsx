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
import { ArrowDownToLine } from "lucide-react";
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
  created_at: string | null;
  booking: {
    id: string;
    booking_number: string;
    customer_name: string | null;
  } | null;
  created_by_profile?: { username: string | null; first_name: string | null } | null;
}

export default function ViewReceivePayment() {
  const { isAdmin, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCustomer, setSearchCustomer] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");

  const filteredPayments = payments.filter(payment => {
    const matchesCustomer = !searchCustomer || 
      payment.booking?.customer_name?.toLowerCase().includes(searchCustomer.toLowerCase()) ||
      payment.booking?.booking_number?.toLowerCase().includes(searchCustomer.toLowerCase());
    const matchesStatus = filterStatus === "all" || 
      payment.approval_status?.toLowerCase() === filterStatus.toLowerCase();
    
    let matchesDate = true;
    if (appliedFromDate || appliedToDate) {
      const createdDate = payment.created_at ? new Date(payment.created_at) : null;
      if (createdDate) {
        if (appliedFromDate) matchesDate = matchesDate && createdDate >= new Date(appliedFromDate);
        if (appliedToDate) matchesDate = matchesDate && createdDate <= new Date(appliedToDate);
      } else {
        matchesDate = false;
      }
    }
    
    return matchesCustomer && matchesStatus && matchesDate;
  });

  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filteredPayments, { itemsPerPage: 10 });

  const totalReceived = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

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
          id, amount, payment_mode, payment_date, payment_type, reference_number, approval_status, created_at, created_by,
          booking:bookings(id, booking_number, customer_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const creatorIds = [...new Set((data || []).map(p => p.created_by).filter(Boolean))];
      let profilesMap: Record<string, any> = {};
      
      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, first_name")
          .in("id", creatorIds);
        
        profilesMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
      }

      const paymentsWithProfiles = (data || []).map(p => ({
        ...p,
        created_by_profile: p.created_by ? profilesMap[p.created_by] : null
      }));

      setPayments(paymentsWithProfiles as PaymentWithDetails[]);
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
    return <div className="min-h-screen"><Header title="View Receive Payment" /><main className="p-4"><Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card></main></div>;
  }

  if (!isAdmin()) {
    return <div className="min-h-screen"><Header title="Access Denied" /><main className="p-4"><Card><CardContent className="py-8 text-center text-muted-foreground">Admin access required.</CardContent></Card></main></div>;
  }

  return (
    <div className="min-h-screen">
      <Header title="View Receive Payment" />
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
              <ArrowDownToLine className="h-4 w-4" />
              Received Payments
            </CardTitle>
            <Badge variant="default" className="text-lg">
              Total: Rs. {totalReceived.toLocaleString()}/-
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <Input
                placeholder="Search by customer or booking..."
                value={searchCustomer}
                onChange={(e) => setSearchCustomer(e.target.value)}
              />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : paginatedItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No payments found.</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S.No</TableHead>
                      <TableHead>Booking</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Received Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Received By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((payment, index) => (
                      <TableRow key={payment.id}>
                        <TableCell>{(currentPage - 1) * 10 + index + 1}</TableCell>
                        <TableCell className="font-medium">{payment.booking?.booking_number || "N/A"}</TableCell>
                        <TableCell>{payment.booking?.customer_name || "N/A"}</TableCell>
                        <TableCell>{payment.created_at ? format(new Date(payment.created_at), "dd-MMM-yyyy") : "N/A"}</TableCell>
                        <TableCell className="font-medium">Rs. {payment.amount?.toLocaleString() || 0}/-</TableCell>
                        <TableCell>{payment.payment_mode || "N/A"}</TableCell>
                        <TableCell>{payment.created_by_profile?.username || payment.created_by_profile?.first_name || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant={payment.approval_status === "approved" ? "default" : payment.approval_status === "rejected" ? "destructive" : "secondary"}>
                            {payment.approval_status || "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => navigate(`/bookings/${payment.booking?.id}`)}>
                              View Booking
                            </Button>
                            <Button variant="link" size="sm" className="h-auto p-0 text-xs text-blue-600" onClick={() => navigate(`/payments/booking?id=${payment.booking?.id}`)}>
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
