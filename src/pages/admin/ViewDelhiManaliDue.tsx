import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Eye, Search } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/TablePagination";
import { DateRangeFilter } from "@/components/ui/DateRangeFilter";
import { format } from "date-fns";

interface VolvoWithBooking {
  id: string;
  route: string;
  travel_date: string;
  number_of_seats: number | null;
  rate_per_seat: number | null;
  total_amount: number | null;
  paid_amount: number | null;
  due_amount: number | null;
  booking: {
    id: string;
    booking_number: string;
    customer_name: string | null;
  } | null;
}

export default function ViewDelhiManaliDue() {
  const navigate = useNavigate();
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [volvos, setVolvos] = useState<VolvoWithBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterActive, setFilterActive] = useState(false);

  const canManage = isAdmin() || isAccount();

  const filteredVolvos = volvos.filter(volvo => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      volvo.booking?.booking_number.toLowerCase().includes(searchLower) ||
      volvo.booking?.customer_name?.toLowerCase().includes(searchLower);

    let matchesDate = true;
    if (filterActive && fromDate && toDate) {
      const travelDate = new Date(volvo.travel_date);
      matchesDate = travelDate >= new Date(fromDate) && travelDate <= new Date(toDate);
    }

    return matchesSearch && matchesDate && (volvo.due_amount || 0) > 0;
  });

  const totalDue = filteredVolvos.reduce((sum, v) => sum + (v.due_amount || 0), 0);
  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filteredVolvos);

  useEffect(() => {
    if (!authLoading && canManage) {
      fetchVolvos();
    }
  }, [authLoading, canManage]);

  const fetchVolvos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("volvo_bookings")
        .select(`
          id, route, travel_date, number_of_seats, rate_per_seat,
          total_amount, paid_amount, due_amount,
          booking:bookings(id, booking_number, customer_name)
        `)
        .eq("route", "delhi_manali")
        .gt("due_amount", 0)
        .order("travel_date", { ascending: false });

      if (error) throw error;
      setVolvos(data || []);
    } catch (error) {
      console.error("Error fetching volvos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSearch = () => {
    setFilterActive(true);
  };

  const handleDateClear = () => {
    setFromDate("");
    setToDate("");
    setFilterActive(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen">
        <AdminHeader title="View Delhi-Manali Due" />
        <main className="p-4">
          <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
        </main>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="min-h-screen">
        <AdminHeader title="Access Denied" />
        <main className="p-4">
          <Card><CardContent className="py-8 text-center text-muted-foreground">Access denied.</CardContent></Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AdminHeader title="View Delhi-Manali Due" />
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
            <CardTitle className="text-base">Delhi-Manali Due Amount - Total: ₹{totalDue.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by booking or customer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredVolvos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No Delhi-Manali dues found.</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Travel Date</TableHead>
                      <TableHead>Seats</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Due</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((volvo) => (
                      <TableRow key={volvo.id}>
                        <TableCell className="font-medium">{volvo.booking?.booking_number || "-"}</TableCell>
                        <TableCell>{volvo.booking?.customer_name || "-"}</TableCell>
                        <TableCell>{format(new Date(volvo.travel_date), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{volvo.number_of_seats || 0}</TableCell>
                        <TableCell className="text-right">₹{(volvo.total_amount || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right">₹{(volvo.paid_amount || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-medium text-destructive">₹{(volvo.due_amount || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => volvo.booking && navigate(`/admin/bookings/${volvo.booking.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                  totalItems={totalItems}
                  startIndex={startIndex}
                  endIndex={endIndex}
                />
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
