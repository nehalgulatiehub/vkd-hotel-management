import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { AlertCircle } from "lucide-react";
import { TablePagination } from "@/components/ui/TablePagination";
import { usePagination } from "@/hooks/usePagination";

interface BookingWithDue {
  id: string;
  booking_number: string;
  customer_name: string | null;
  contact_no: string | null;
  check_in_date: string;
  check_out_date: string;
  total_amount: number | null;
  paid_amount: number | null;
  due_amount: number | null;
  agent?: { name: string } | null;
}

export default function ViewDueAmount() {
  const { isAdmin, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingWithDue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCustomer, setSearchCustomer] = useState("");

  const filteredBookings = bookings.filter(booking => {
    return !searchCustomer || 
      booking.customer_name?.toLowerCase().includes(searchCustomer.toLowerCase()) ||
      booking.booking_number?.toLowerCase().includes(searchCustomer.toLowerCase());
  });

  const { currentPage, totalPages, paginatedData, goToPage } = usePagination(filteredBookings, 10);

  const totalDue = filteredBookings.reduce((sum, b) => sum + (b.due_amount || 0), 0);

  useEffect(() => {
    if (!authLoading && isAdmin()) {
      fetchBookingsWithDue();
    }
  }, [authLoading]);

  const fetchBookingsWithDue = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id, booking_number, customer_name, contact_no, 
          check_in_date, check_out_date, total_amount, paid_amount, due_amount,
          agent:agents(name)
        `)
        .gt("due_amount", 0)
        .order("due_amount", { ascending: false });

      if (error) throw error;
      setBookings((data || []) as BookingWithDue[]);
    } catch (error) {
      console.error("Error fetching bookings with due:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen"><Header title="Due Amount" /><main className="p-4"><Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card></main></div>;
  }

  if (!isAdmin()) {
    return <div className="min-h-screen"><Header title="Access Denied" /><main className="p-4"><Card><CardContent className="py-8 text-center text-muted-foreground">Admin access required.</CardContent></Card></main></div>;
  }

  return (
    <div className="min-h-screen">
      <Header title="Due Amount" />
      <main className="p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Bookings with Due Amount
            </CardTitle>
            <Badge variant="destructive" className="text-lg">
              Total Due: Rs. {totalDue.toLocaleString()}/-
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <Input
                placeholder="Search by customer or booking number..."
                value={searchCustomer}
                onChange={(e) => setSearchCustomer(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : paginatedData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No bookings with due amount found.</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S.No</TableHead>
                      <TableHead>Booking</TableHead>
                      <TableHead>Customer Name</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Paid Amount</TableHead>
                      <TableHead>Due Amount</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((booking, index) => (
                      <TableRow key={booking.id}>
                        <TableCell>{(currentPage - 1) * 10 + index + 1}</TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            <div className="font-medium">{booking.booking_number}</div>
                            <div>{booking.check_in_date} - {booking.check_out_date}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            <div className="font-medium">{booking.customer_name || "N/A"}</div>
                            <div>{booking.contact_no || "N/A"}</div>
                          </div>
                        </TableCell>
                        <TableCell>{booking.agent?.name || "Direct"}</TableCell>
                        <TableCell>Rs. {booking.total_amount?.toLocaleString() || 0}/-</TableCell>
                        <TableCell className="text-green-600">Rs. {booking.paid_amount?.toLocaleString() || 0}/-</TableCell>
                        <TableCell className="text-destructive font-medium">Rs. {booking.due_amount?.toLocaleString() || 0}/-</TableCell>
                        <TableCell>
                          <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => navigate(`/bookings/${booking.id}`)}>
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
