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
import { DateRangeFilter } from "@/components/ui/DateRangeFilter";

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
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");

  const filteredCancellations = cancellations.filter(c => {
    const matchesSearch = !searchBooking || 
      c.booking?.booking_number?.toLowerCase().includes(searchBooking.toLowerCase()) ||
      c.booking?.customer_name?.toLowerCase().includes(searchBooking.toLowerCase());
    
    let matchesDate = true;
    if (appliedFromDate || appliedToDate) {
      const cancelDate = c.cancellation_date ? new Date(c.cancellation_date) : null;
      if (cancelDate) {
        if (appliedFromDate) matchesDate = matchesDate && cancelDate >= new Date(appliedFromDate);
        if (appliedToDate) matchesDate = matchesDate && cancelDate <= new Date(appliedToDate);
      } else {
        matchesDate = false;
      }
    }
    
    return matchesSearch && matchesDate;
  });

  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filteredCancellations, { itemsPerPage: 10 });

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
    return <div className="min-h-screen"><Header title="View Cancellation Charge" /><main className="p-4"><Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card></main></div>;
  }

  if (!isAdmin()) {
    return <div className="min-h-screen"><Header title="Access Denied" /><main className="p-4"><Card><CardContent className="py-8 text-center text-muted-foreground">Admin access required.</CardContent></Card></main></div>;
  }

  return (
    <div className="min-h-screen">
      <Header title="View Cancellation Charge" />
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
            ) : paginatedItems.length === 0 ? (
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
                    {paginatedItems.map((cancellation, index) => (
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
                          <div className="flex flex-col gap-1">
                            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => navigate(`/bookings/${cancellation.booking?.id}`)}>
                              View Booking
                            </Button>
                            <Button variant="link" size="sm" className="h-auto p-0 text-xs text-blue-600" onClick={() => navigate(`/payments/booking?id=${cancellation.booking?.id}`)}>
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
