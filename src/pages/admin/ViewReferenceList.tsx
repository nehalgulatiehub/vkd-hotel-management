import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { List } from "lucide-react";
import { TablePagination } from "@/components/ui/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { DateRangeFilter } from "@/components/ui/DateRangeFilter";

interface BookingWithReference {
  id: string;
  booking_number: string;
  reference: string | null;
  reference_email: string | null;
  customer_name: string | null;
  contact_no: string | null;
  check_in_date: string;
  check_out_date: string;
  total_amount: number | null;
  paid_amount: number | null;
  due_amount: number | null;
  booking_type: string | null;
  created_at: string | null;
  agent?: { name: string; company_name: string | null } | null;
  created_by_profile?: { username: string | null; first_name: string | null } | null;
}

export default function ViewReferenceList() {
  const { isAdmin, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingWithReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchReference, setSearchReference] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = !searchReference || 
      booking.reference?.toLowerCase().includes(searchReference.toLowerCase()) ||
      booking.booking_number?.toLowerCase().includes(searchReference.toLowerCase());
    
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
          id, booking_number, reference, reference_email, customer_name, contact_no, 
          check_in_date, check_out_date, total_amount, paid_amount, due_amount, booking_type, created_by, created_at,
          agent:agents(name, company_name)
        `)
        .not("reference", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const creatorIds = [...new Set((data || []).map(b => b.created_by).filter(Boolean))];
      let profilesMap: Record<string, any> = {};
      
      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, first_name")
          .in("id", creatorIds);
        
        profilesMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
      }

      const bookingsWithProfiles = (data || []).map(b => ({
        ...b,
        created_by_profile: b.created_by ? profilesMap[b.created_by] : null
      }));

      setBookings(bookingsWithProfiles as BookingWithReference[]);
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
    return <div className="min-h-screen"><Header title="View Reference List" /><main className="p-4"><Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card></main></div>;
  }

  if (!isAdmin()) {
    return <div className="min-h-screen"><Header title="Access Denied" /><main className="p-4"><Card><CardContent className="py-8 text-center text-muted-foreground">Admin access required.</CardContent></Card></main></div>;
  }

  return (
    <div className="min-h-screen">
      <Header title="View Reference List" />
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
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <List className="h-4 w-4" />
              Reference List
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <Input
                placeholder="Search by reference or booking number..."
                value={searchReference}
                onChange={(e) => setSearchReference(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : paginatedItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No bookings with references found.</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S.No</TableHead>
                      <TableHead>Booking</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Customer Name</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((booking, index) => (
                      <TableRow key={booking.id}>
                        <TableCell>{(currentPage - 1) * 10 + index + 1}</TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            <div className="font-medium">Booking: {booking.booking_number}</div>
                            <div>{booking.check_in_date} - {booking.check_out_date}</div>
                          </div>
                        </TableCell>
                        <TableCell>{booking.booking_type || "Agent"}</TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            <div className="font-medium">{booking.customer_name || "N/A"}</div>
                            <div>Contact: {booking.contact_no || "N/A"}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            <div className="font-medium">{booking.reference || "N/A"}</div>
                            {booking.reference_email && <div>{booking.reference_email}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            <div>Booking: Rs. {booking.total_amount?.toLocaleString() || 0}/-</div>
                            <div>Received: Rs. {booking.paid_amount?.toLocaleString() || 0}/-</div>
                            <div>Due: Rs. {booking.due_amount?.toLocaleString() || 0}/-</div>
                          </div>
                        </TableCell>
                        <TableCell>{booking.created_by_profile?.username || booking.created_by_profile?.first_name || "N/A"}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => navigate(`/admin/bookings/${booking.id}`)}>
                              View Booking
                            </Button>
                            <Button variant="link" size="sm" className="h-auto p-0 text-xs text-blue-600" onClick={() => navigate(`/admin/booking-payments?id=${booking.id}`)}>
                              View Payments
                            </Button>
                            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => window.print()}>
                              Print Booking
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
