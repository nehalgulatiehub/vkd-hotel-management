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
import { Users } from "lucide-react";
import { TablePagination } from "@/components/ui/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { DateRangeFilter } from "@/components/ui/DateRangeFilter";

interface BookingWithPax {
  id: string;
  booking_number: string;
  customer_name: string | null;
  check_in_date: string;
  check_out_date: string;
  adults: number | null;
  children: number | null;
  agent?: { name: string } | null;
}

export default function ViewTotalPax() {
  const { isAdmin, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingWithPax[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCustomer, setSearchCustomer] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = !searchCustomer || 
      booking.customer_name?.toLowerCase().includes(searchCustomer.toLowerCase()) ||
      booking.booking_number?.toLowerCase().includes(searchCustomer.toLowerCase());
    
    let matchesDate = true;
    if (appliedFromDate || appliedToDate) {
      const checkInDate = booking.check_in_date ? new Date(booking.check_in_date) : null;
      if (checkInDate) {
        if (appliedFromDate) matchesDate = matchesDate && checkInDate >= new Date(appliedFromDate);
        if (appliedToDate) matchesDate = matchesDate && checkInDate <= new Date(appliedToDate);
      } else {
        matchesDate = false;
      }
    }
    
    return matchesSearch && matchesDate;
  });

  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filteredBookings, { itemsPerPage: 10 });

  const totalAdults = filteredBookings.reduce((sum, b) => sum + (b.adults || 0), 0);
  const totalChildren = filteredBookings.reduce((sum, b) => sum + (b.children || 0), 0);

  useEffect(() => {
    if (!authLoading && isAdmin()) {
      fetchBookings();
    }
  }, [authLoading]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id, booking_number, customer_name, check_in_date, check_out_date, adults, children,
          agent:agents(name)
        `)
        .in("status", ["confirmed", "completed"])
        .order("check_in_date", { ascending: false });

      if (error) throw error;
      setBookings((data || []) as BookingWithPax[]);
    } catch (error) {
      console.error("Error fetching bookings:", error);
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
    return <div className="min-h-screen"><Header title="Total Pax" /><main className="p-4"><Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card></main></div>;
  }

  if (!isAdmin()) {
    return <div className="min-h-screen"><Header title="Access Denied" /><main className="p-4"><Card><CardContent className="py-8 text-center text-muted-foreground">Admin access required.</CardContent></Card></main></div>;
  }

  return (
    <div className="min-h-screen">
      <Header title="Total Pax" />
      <main className="p-4 space-y-4">
        <DateRangeFilter
          fromDate={fromDate}
          toDate={toDate}
          onFromDateChange={setFromDate}
          onToDateChange={setToDate}
          onSearch={handleDateSearch}
          onClear={handleDateClear}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{totalAdults + totalChildren}</div>
              <p className="text-muted-foreground text-sm">Total Pax</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{totalAdults}</div>
              <p className="text-muted-foreground text-sm">Adults</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{totalChildren}</div>
              <p className="text-muted-foreground text-sm">Children</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Pax Details by Booking
            </CardTitle>
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
            ) : paginatedItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No bookings found.</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S.No</TableHead>
                      <TableHead>Booking</TableHead>
                      <TableHead>Customer Name</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Adults</TableHead>
                      <TableHead>Children</TableHead>
                      <TableHead>Total Pax</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((booking, index) => (
                      <TableRow key={booking.id}>
                        <TableCell>{(currentPage - 1) * 10 + index + 1}</TableCell>
                        <TableCell className="font-medium">{booking.booking_number}</TableCell>
                        <TableCell>{booking.customer_name || "N/A"}</TableCell>
                        <TableCell>{booking.agent?.name || "Direct"}</TableCell>
                        <TableCell>{booking.check_in_date}</TableCell>
                        <TableCell>{booking.check_out_date}</TableCell>
                        <TableCell><Badge variant="outline">{booking.adults || 0}</Badge></TableCell>
                        <TableCell><Badge variant="secondary">{booking.children || 0}</Badge></TableCell>
                        <TableCell><Badge>{(booking.adults || 0) + (booking.children || 0)}</Badge></TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => navigate(`/admin/bookings/${booking.id}`)}>
                              View Booking
                            </Button>
                            <Button variant="link" size="sm" className="h-auto p-0 text-xs text-blue-600" onClick={() => navigate(`/admin/booking-payments?id=${booking.id}`)}>
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
