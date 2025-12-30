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
import { Ban } from "lucide-react";
import { TablePagination } from "@/components/ui/TablePagination";
import { usePagination } from "@/hooks/usePagination";

interface CancellationWithDetails {
  id: string;
  cancellation_date: string | null;
  cancellation_charges: number | null;
  refund_amount: number | null;
  cancellation_reason: string | null;
  booking: {
    id: string;
    booking_number: string;
    customer_name: string | null;
    total_amount: number | null;
  } | null;
}

export default function ViewCancellationCharge() {
  const { isAdmin, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [cancellations, setCancellations] = useState<CancellationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchBooking, setSearchBooking] = useState("");

  const filteredCancellations = cancellations.filter(c => {
    return !searchBooking || 
      c.booking?.booking_number?.toLowerCase().includes(searchBooking.toLowerCase()) ||
      c.booking?.customer_name?.toLowerCase().includes(searchBooking.toLowerCase());
  });

  const { currentPage, totalPages, paginatedData, goToPage } = usePagination(filteredCancellations, 10);

  const totalCharges = filteredCancellations.reduce((sum, c) => sum + (c.cancellation_charges || 0), 0);

  useEffect(() => {
    if (!authLoading && isAdmin()) {
      fetchCancellations();
    }
  }, [authLoading]);

  const fetchCancellations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("cancellations")
        .select(`
          id, cancellation_date, cancellation_charges, refund_amount, cancellation_reason,
          booking:bookings(id, booking_number, customer_name, total_amount)
        `)
        .order("cancellation_date", { ascending: false });

      if (error) throw error;
      setCancellations((data || []) as CancellationWithDetails[]);
    } catch (error) {
      console.error("Error fetching cancellations:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen"><Header title="View Cancellation Charge" /><main className="p-4"><Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card></main></div>;
  }

  if (!isAdmin()) {
    return <div className="min-h-screen"><Header title="Access Denied" /><main className="p-4"><Card><CardContent className="py-8 text-center text-muted-foreground">Admin access required.</CardContent></Card></main></div>;
  }

  return (
    <div className="min-h-screen">
      <Header title="View Cancellation Charge" />
      <main className="p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Ban className="h-4 w-4" />
              Cancellation Charges
            </CardTitle>
            <Badge variant="secondary" className="text-lg">
              Total Charges: Rs. {totalCharges.toLocaleString()}/-
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
            ) : paginatedData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No cancellations found.</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S.No</TableHead>
                      <TableHead>Booking</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Cancellation Date</TableHead>
                      <TableHead>Booking Amount</TableHead>
                      <TableHead>Cancellation Charges</TableHead>
                      <TableHead>Refund Amount</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((cancellation, index) => (
                      <TableRow key={cancellation.id}>
                        <TableCell>{(currentPage - 1) * 10 + index + 1}</TableCell>
                        <TableCell className="font-medium">{cancellation.booking?.booking_number || "N/A"}</TableCell>
                        <TableCell>{cancellation.booking?.customer_name || "N/A"}</TableCell>
                        <TableCell>{cancellation.cancellation_date ? format(new Date(cancellation.cancellation_date), "dd-MMM-yyyy") : "N/A"}</TableCell>
                        <TableCell>Rs. {cancellation.booking?.total_amount?.toLocaleString() || 0}/-</TableCell>
                        <TableCell className="text-destructive font-medium">Rs. {cancellation.cancellation_charges?.toLocaleString() || 0}/-</TableCell>
                        <TableCell className="text-green-600">Rs. {cancellation.refund_amount?.toLocaleString() || 0}/-</TableCell>
                        <TableCell className="max-w-[200px] truncate">{cancellation.cancellation_reason || "N/A"}</TableCell>
                        <TableCell>
                          <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => navigate(`/bookings/${cancellation.booking?.id}`)}>
                            View Booking
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
