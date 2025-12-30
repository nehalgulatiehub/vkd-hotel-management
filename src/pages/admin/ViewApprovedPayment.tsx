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
import { CheckCircle, Eye } from "lucide-react";
import { TablePagination } from "@/components/ui/TablePagination";
import { usePagination } from "@/hooks/usePagination";

interface PaymentWithDetails {
  id: string;
  amount: number;
  payment_mode: string | null;
  payment_date: string | null;
  reference_number: string | null;
  approval_status: string | null;
  approved_at: string | null;
  booking: {
    id: string;
    booking_number: string;
    check_in_date: string;
    check_out_date: string;
    customer_name: string | null;
    contact_no: string | null;
    total_amount: number | null;
    adults: number | null;
    address: string | null;
    agent?: { name: string; company_name: string | null } | null;
  } | null;
  approved_by_profile?: { username: string | null; first_name: string | null; last_name: string | null } | null;
}

export default function ViewApprovedPayment() {
  const { isAdmin, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCustomer, setSearchCustomer] = useState("");
  const [filterPaymentMode, setFilterPaymentMode] = useState<string>("all");

  const filteredPayments = payments.filter(payment => {
    const matchesCustomer = !searchCustomer || 
      payment.booking?.customer_name?.toLowerCase().includes(searchCustomer.toLowerCase());
    const matchesMode = filterPaymentMode === "all" || 
      payment.payment_mode?.toLowerCase() === filterPaymentMode.toLowerCase();
    return matchesCustomer && matchesMode;
  });

  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filteredPayments, { itemsPerPage: 10 });

  useEffect(() => {
    if (!authLoading && isAdmin()) {
      fetchApprovedPayments();
    }
  }, [authLoading]);

  const fetchApprovedPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          id, amount, payment_mode, payment_date, reference_number, approval_status, approved_at, approved_by,
          booking:bookings(id, booking_number, check_in_date, check_out_date, customer_name, contact_no, total_amount, adults, address, agent:agents(name, company_name))
        `)
        .eq("approval_status", "approved")
        .order("approved_at", { ascending: false });

      if (error) throw error;

      // Fetch approved_by profiles
      const approverIds = [...new Set((data || []).map(p => p.approved_by).filter(Boolean))];
      let profilesMap: Record<string, any> = {};
      
      if (approverIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, first_name, last_name")
          .in("id", approverIds);
        
        profilesMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
      }

      const paymentsWithProfiles = (data || []).map(p => ({
        ...p,
        approved_by_profile: p.approved_by ? profilesMap[p.approved_by] : null
      }));

      setPayments(paymentsWithProfiles as PaymentWithDetails[]);
    } catch (error) {
      console.error("Error fetching approved payments:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen"><Header title="View Approved Payment" /><main className="p-4"><Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card></main></div>;
  }

  if (!isAdmin()) {
    return <div className="min-h-screen"><Header title="Access Denied" /><main className="p-4"><Card><CardContent className="py-8 text-center text-muted-foreground">Admin access required.</CardContent></Card></main></div>;
  }

  return (
    <div className="min-h-screen">
      <Header title="View Approved Payment" />
      <main className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Approved Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <Input
                placeholder="Search by customer name..."
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
              <div className="text-center py-8 text-muted-foreground">No approved payments found.</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S.No</TableHead>
                      <TableHead>Booking</TableHead>
                      <TableHead>Customer Name</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Payment Mode</TableHead>
                      <TableHead>Approve Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((payment, index) => (
                      <TableRow key={payment.id}>
                        <TableCell>{(currentPage - 1) * 10 + index + 1}</TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            <div className="font-medium">Booking: {payment.booking?.booking_number}</div>
                            <div>{payment.booking?.check_in_date} - {payment.booking?.check_out_date}</div>
                            <div>No. of Rooms: {payment.booking?.adults || 1}</div>
                            <div>Price: Rs. {payment.booking?.total_amount?.toLocaleString() || 0}/-</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            <div className="font-medium">{payment.booking?.customer_name || "N/A"}</div>
                            <div>Contact No.: {payment.booking?.contact_no || "N/A"}</div>
                            <div>Place: {payment.booking?.address || "N/A"}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            <div>Agent: {payment.booking?.agent?.name || "Direct"}</div>
                            <div>Hotel: -</div>
                            <div>Room: -</div>
                          </div>
                        </TableCell>
                        <TableCell>Rs. {payment.amount?.toLocaleString() || 0}/-</TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <div>{payment.payment_mode || "N/A"}</div>
                            {payment.reference_number && <div>Code: {payment.reference_number}</div>}
                          </div>
                        </TableCell>
                        <TableCell>{payment.approved_at ? format(new Date(payment.approved_at), "yyyy-MM-dd") : "N/A"}</TableCell>
                        <TableCell>{payment.approved_by_profile?.username || payment.approved_by_profile?.first_name || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-green-600">Approved</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => navigate(`/bookings/${payment.booking?.id}`)}>
                              View Booking
                            </Button>
                            <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                              View Payment
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
