import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Edit, DollarSign, Eye, Search } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/TablePagination";
import { DateRangeFilter } from "@/components/ui/DateRangeFilter";
import { format } from "date-fns";
import { usePaymentDialog } from "@/hooks/usePaymentDialog";
import { PaymentDialogs } from "@/components/payment/PaymentDialogs";

interface VehicleWithBooking {
  id: string;
  vehicle_type: string | null;
  vehicle_number: string | null;
  from_location: string | null;
  to_location: string | null;
  pickup_date: string | null;
  total_amount: number | null;
  paid_amount: number | null;
  due_amount: number | null;
  booking: {
    id: string;
    booking_number: string;
    customer_name: string | null;
    total_amount: number | null;
    paid_amount: number | null;
    due_amount: number | null;
  } | null;
}

export default function ViewVehicleDue() {
  const navigate = useNavigate();
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [vehicles, setVehicles] = useState<VehicleWithBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterActive, setFilterActive] = useState(false);

  const paymentDialog = usePaymentDialog(() => fetchVehicles());

  const canManage = isAdmin() || isAccount();

  const filteredVehicles = vehicles.filter(vehicle => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      vehicle.booking?.booking_number.toLowerCase().includes(searchLower) ||
      vehicle.booking?.customer_name?.toLowerCase().includes(searchLower) ||
      vehicle.vehicle_number?.toLowerCase().includes(searchLower);

    let matchesDate = true;
    if (filterActive && fromDate && toDate && vehicle.pickup_date) {
      const pickupDate = new Date(vehicle.pickup_date);
      matchesDate = pickupDate >= new Date(fromDate) && pickupDate <= new Date(toDate);
    }

    return matchesSearch && matchesDate && (vehicle.due_amount || 0) > 0;
  });

  const totalDue = filteredVehicles.reduce((sum, v) => sum + (v.due_amount || 0), 0);
  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filteredVehicles);

  useEffect(() => {
    if (!authLoading && canManage) {
      fetchVehicles();
    }
  }, [authLoading, canManage]);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("vehicle_bookings")
        .select(`
          id, vehicle_type, vehicle_number, from_location, to_location, pickup_date,
          total_amount, paid_amount, due_amount,
          booking:bookings(id, booking_number, customer_name, total_amount, paid_amount, due_amount)
        `)
        .gt("due_amount", 0)
        .order("pickup_date", { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
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
        <AdminHeader title="View Vehicle Due" />
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
      <AdminHeader title="View Vehicle Due" />
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
            <CardTitle className="text-base">Vehicle Due Amount - Total: ₹{totalDue.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by vehicle, booking or customer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredVehicles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No vehicle dues found.</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Pickup Date</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Due</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((vehicle) => (
                      <TableRow key={vehicle.id}>
                        <TableCell className="font-medium">{vehicle.booking?.booking_number || "-"}</TableCell>
                        <TableCell>{vehicle.booking?.customer_name || "-"}</TableCell>
                        <TableCell>{vehicle.from_location} → {vehicle.to_location}</TableCell>
                        <TableCell>{vehicle.pickup_date ? format(new Date(vehicle.pickup_date), "dd/MM/yyyy") : "-"}</TableCell>
                        <TableCell className="text-right">₹{(vehicle.total_amount || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right">₹{(vehicle.paid_amount || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-medium text-destructive">₹{(vehicle.due_amount || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => vehicle.booking && navigate(`/bookings?edit=${vehicle.booking.id}`)}
                              title="Edit Booking"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => vehicle.booking && paymentDialog.handleViewPayment(vehicle.booking)} title="View Payment">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => vehicle.booking && paymentDialog.handleAddPayment(vehicle.booking)} title="Add Payment">
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          </div>
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

      <PaymentDialogs
        showViewPaymentDialog={paymentDialog.showViewPaymentDialog}
        setShowViewPaymentDialog={paymentDialog.setShowViewPaymentDialog}
        showPaymentDialog={paymentDialog.showPaymentDialog}
        setShowPaymentDialog={paymentDialog.setShowPaymentDialog}
        selectedBooking={paymentDialog.selectedBooking}
        bookingPayments={paymentDialog.bookingPayments}
        paymentAmount={paymentDialog.paymentAmount}
        setPaymentAmount={paymentDialog.setPaymentAmount}
        paymentMode={paymentDialog.paymentMode}
        setPaymentMode={paymentDialog.setPaymentMode}
        paymentReference={paymentDialog.paymentReference}
        setPaymentReference={paymentDialog.setPaymentReference}
        isSubmittingPayment={paymentDialog.isSubmittingPayment}
        onSubmitPayment={paymentDialog.submitPayment}
      />
    </div>
  );
}
