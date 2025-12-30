import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { RotateCcw } from "lucide-react";
import { TablePagination } from "@/components/ui/TablePagination";
import { usePagination } from "@/hooks/usePagination";

interface RefundWithDetails {
  id: string;
  refund_date: string | null;
  refund_amount: number;
  refund_mode: string | null;
  reference_number: string | null;
  approval_status: string | null;
  booking: {
    id: string;
    booking_number: string;
    customer_name: string | null;
    total_amount: number | null;
  } | null;
}

export default function ViewBookReturnPayment() {
  const { isAdmin, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [refunds, setRefunds] = useState<RefundWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchBooking, setSearchBooking] = useState("");

  const filteredRefunds = refunds.filter(r => {
    return !searchBooking || 
      r.booking?.booking_number?.toLowerCase().includes(searchBooking.toLowerCase()) ||
      r.booking?.customer_name?.toLowerCase().includes(searchBooking.toLowerCase());
  });

  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filteredRefunds, { itemsPerPage: 10 });

  const totalRefunds = filteredRefunds.reduce((sum, r) => sum + (r.refund_amount || 0), 0);

  useEffect(() => {
    if (!authLoading && isAdmin()) {
      fetchRefunds();
    }
  }, [authLoading]);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("refunds")
        .select(`
          id, refund_date, refund_amount, refund_mode, reference_number, approval_status,
          booking:bookings(id, booking_number, customer_name, total_amount)
        `)
        .order("refund_date", { ascending: false });

      if (error) throw error;
      setRefunds((data || []) as RefundWithDetails[]);
    } catch (error) {
      console.error("Error fetching refunds:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen"><Header title="View Book Return Payment" /><main className="p-4"><Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card></main></div>;
  }

  if (!isAdmin()) {
    return <div className="min-h-screen"><Header title="Access Denied" /><main className="p-4"><Card><CardContent className="py-8 text-center text-muted-foreground">Admin access required.</CardContent></Card></main></div>;
  }

  return (
    <div className="min-h-screen">
      <Header title="View Book Return Payment" />
      <main className="p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Book Return Payments
            </CardTitle>
            <Badge variant="secondary" className="text-lg">
              Total Refunds: Rs. {totalRefunds.toLocaleString()}/-
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <Input
                placeholder="Search by booking or customer..."
                value={searchBooking}
                onChange={(e) => setSearchBooking(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : paginatedItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No refunds found.</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S.No</TableHead>
                      <TableHead>Booking</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Refund Date</TableHead>
                      <TableHead>Booking Amount</TableHead>
                      <TableHead>Refund Amount</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((refund, index) => (
                      <TableRow key={refund.id}>
                        <TableCell>{(currentPage - 1) * 10 + index + 1}</TableCell>
                        <TableCell className="font-medium">{refund.booking?.booking_number || "N/A"}</TableCell>
                        <TableCell>{refund.booking?.customer_name || "N/A"}</TableCell>
                        <TableCell>{refund.refund_date ? format(new Date(refund.refund_date), "dd-MMM-yyyy") : "N/A"}</TableCell>
                        <TableCell>Rs. {refund.booking?.total_amount?.toLocaleString() || 0}/-</TableCell>
                        <TableCell className="text-green-600 font-medium">Rs. {refund.refund_amount?.toLocaleString() || 0}/-</TableCell>
                        <TableCell>{refund.refund_mode || "N/A"}</TableCell>
                        <TableCell>{refund.reference_number || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant={refund.approval_status === "approved" ? "default" : refund.approval_status === "rejected" ? "destructive" : "secondary"}>
                            {refund.approval_status || "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => navigate(`/bookings/${refund.booking?.id}`)}>
                              View Booking
                            </Button>
                            <Button variant="link" size="sm" className="h-auto p-0 text-xs text-blue-600" onClick={() => navigate(`/payments/booking?id=${refund.booking?.id}`)}>
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
