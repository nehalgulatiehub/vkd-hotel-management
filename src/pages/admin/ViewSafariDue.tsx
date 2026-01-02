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

interface SafariWithBooking {
  id: string;
  safari_name: string;
  safari_date: string;
  number_of_persons: number | null;
  rate_per_person: number | null;
  total_amount: number | null;
  paid_amount: number | null;
  due_amount: number | null;
  booking: {
    id: string;
    booking_number: string;
    customer_name: string | null;
  } | null;
}

export default function ViewSafariDue() {
  const navigate = useNavigate();
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [safaris, setSafaris] = useState<SafariWithBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterActive, setFilterActive] = useState(false);

  const canManage = isAdmin() || isAccount();

  const filteredSafaris = safaris.filter(safari => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      safari.safari_name.toLowerCase().includes(searchLower) ||
      safari.booking?.booking_number.toLowerCase().includes(searchLower) ||
      safari.booking?.customer_name?.toLowerCase().includes(searchLower);

    let matchesDate = true;
    if (filterActive && fromDate && toDate) {
      const safariDate = new Date(safari.safari_date);
      matchesDate = safariDate >= new Date(fromDate) && safariDate <= new Date(toDate);
    }

    return matchesSearch && matchesDate && (safari.due_amount || 0) > 0;
  });

  const totalDue = filteredSafaris.reduce((sum, s) => sum + (s.due_amount || 0), 0);
  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filteredSafaris);

  useEffect(() => {
    if (!authLoading && canManage) {
      fetchSafaris();
    }
  }, [authLoading, canManage]);

  const fetchSafaris = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("safari_bookings")
        .select(`
          id, safari_name, safari_date, number_of_persons, rate_per_person,
          total_amount, paid_amount, due_amount,
          booking:bookings(id, booking_number, customer_name)
        `)
        .gt("due_amount", 0)
        .order("safari_date", { ascending: false });

      if (error) throw error;
      setSafaris(data || []);
    } catch (error) {
      console.error("Error fetching safaris:", error);
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
        <AdminHeader title="View Safari Due" />
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
      <AdminHeader title="View Safari Due" />
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
            <CardTitle className="text-base">Safari Due Amount - Total: ₹{totalDue.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by safari, booking or customer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredSafaris.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No safari dues found.</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Safari</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Persons</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Due</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((safari) => (
                      <TableRow key={safari.id}>
                        <TableCell className="font-medium">{safari.booking?.booking_number || "-"}</TableCell>
                        <TableCell>{safari.booking?.customer_name || "-"}</TableCell>
                        <TableCell>{safari.safari_name}</TableCell>
                        <TableCell>{format(new Date(safari.safari_date), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{safari.number_of_persons || 0}</TableCell>
                        <TableCell className="text-right">₹{(safari.total_amount || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right">₹{(safari.paid_amount || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-medium text-destructive">₹{(safari.due_amount || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => safari.booking && navigate(`/bookings/${safari.booking.id}`)}
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
