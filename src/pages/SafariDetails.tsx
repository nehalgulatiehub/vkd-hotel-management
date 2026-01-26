import { Header } from "@/components/layout/Header";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { DetailPageFilters, getDefaultFilters, FilterValues } from "@/components/ui/DetailPageFilters";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/TablePagination";
import { usePaymentDialog } from "@/hooks/usePaymentDialog";
import { PaymentDialogs } from "@/components/payment/PaymentDialogs";
import { BookingDetailsDialog } from "@/components/booking/BookingDetailsDialog";

export default function SafariDetails() {
  const [safariBookings, setSafariBookings] = useState<any[]>([]);
  const [filters, setFilters] = useState<FilterValues>(getDefaultFilters());
  const [loading, setLoading] = useState(true);
  const paymentDialog = usePaymentDialog(() => fetchSafariBookings());
  
  // View Details Dialog State
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedServiceData, setSelectedServiceData] = useState<any>(null);
  const [selectedBookingData, setSelectedBookingData] = useState<any>(null);

  useEffect(() => {
    fetchSafariBookings();
  }, []);

  const fetchSafariBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("safari_bookings")
      .select(`
        *,
        bookings(id, booking_number, customer_name, email, status, contact_no, booking_type, created_at, notes, agent_id, created_by, total_amount, paid_amount, due_amount),
        transporters(name)
      `)
      .order("safari_date", { ascending: false });
    
    if (error) {
      toast.error("Failed to load safari bookings");
    } else {
      setSafariBookings(data || []);
    }
    setLoading(false);
  };

  const handleSearch = () => {
    fetchSafariBookings();
  };

  const handleViewDetails = (booking: any) => {
    setSelectedBookingData(booking.bookings);
    setSelectedServiceData(booking);
    setShowDetailsDialog(true);
  };

  const filteredBookings = safariBookings.filter(booking => {
    if (filters.searchWithDate) {
      const safariDate = new Date(booking.safari_date);
      const fromDate = new Date(`${filters.fromYear}-${filters.fromMonth}-${filters.fromDay}`);
      const toDate = new Date(`${filters.toYear}-${filters.toMonth}-${filters.toDay}`);
      if (safariDate < fromDate || safariDate > toDate) return false;
    }
    if (filters.type) {
      const bookingType = booking.bookings?.booking_type || "direct";
      if (filters.type !== bookingType) return false;
    }
    if (filters.customer) {
      if (!booking.bookings?.customer_name?.toLowerCase().includes(filters.customer.toLowerCase())) return false;
    }
    if (filters.transporterId) {
      if (booking.transporter_id !== filters.transporterId) return false;
    }
    if (filters.reference) {
      if (!booking.bookings?.notes?.toLowerCase().includes(filters.reference.toLowerCase())) return false;
    }
    return true;
  });

  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filteredBookings);

  return (
    <div className="min-h-screen bg-background">
      <Header title="Safari Details" />
      <main className="p-2">
        <div className="flex justify-between items-center mb-2 px-3 py-2" style={{ backgroundColor: "#1e6e99" }}>
          <h2 className="text-white font-semibold text-sm">View Safari Details</h2>
          <button className="text-white text-sm hover:underline">View All Records</button>
        </div>

        <DetailPageFilters
          options={{ showType: true, showAgent: true, showUser: true, showCustomer: true, showReference: true, showTransporter: true, showNoOfSafari: true }}
          filters={filters}
          onFilterChange={setFilters}
          onSearch={handleSearch}
        />

        <div className="mt-2 overflow-x-auto">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr style={{ backgroundColor: "#D4A59A" }}>
                  <th className="border border-[#c99] px-2 py-1.5 text-left font-semibold">S.No.</th>
                  <th className="border border-[#c99] px-2 py-1.5 text-left font-semibold">Type</th>
                  <th className="border border-[#c99] px-2 py-1.5 text-left font-semibold">User</th>
                  <th className="border border-[#c99] px-2 py-1.5 text-left font-semibold">Customer Details</th>
                  <th className="border border-[#c99] px-2 py-1.5 text-left font-semibold">Safari Detail</th>
                  <th className="border border-[#c99] px-2 py-1.5 text-left font-semibold">Date</th>
                  <th className="border border-[#c99] px-2 py-1.5 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((booking, idx) => (
                  <tr key={booking.id} style={{ backgroundColor: "#F5E6E0" }}>
                    <td className="border border-[#c99] px-2 py-2 align-top">{startIndex + idx + 1}</td>
                    <td className="border border-[#c99] px-2 py-2 align-top">
                      {booking.bookings?.booking_type === "agent" ? (
                        <div><div>Agent</div><div className="text-[10px]">{booking.bookings?.agent?.name || ""}</div></div>
                      ) : "Direct"}
                    </td>
                    <td className="border border-[#c99] px-2 py-2 align-top">{booking.bookings?.created_by ? "User" : "-"}</td>
                    <td className="border border-[#c99] px-2 py-2 align-top">
                      <div className="font-medium">{booking.bookings?.customer_name || "-"}</div>
                      <div className="text-[10px]">Contact No.: {booking.bookings?.contact_no || ""}</div>
                    </td>
                    <td className="border border-[#c99] px-2 py-2 align-top">
                      <div><strong>No of Safari :</strong> {booking.number_of_persons || 0}</div>
                      <div><strong>Transporter :</strong> {booking.transporters?.name || "-"}</div>
                      <div><strong>Booking Price :</strong> Rs. {(booking.rate_per_person || 0).toLocaleString('en-IN')} /-</div>
                      <div><strong>Selling Price :</strong> Rs. {(booking.total_amount || 0).toLocaleString('en-IN')} /-</div>
                      <div><strong>Total Received Payment :</strong> Rs. {(booking.paid_amount || 0).toLocaleString('en-IN')}/-</div>
                      <div><strong>Due Payment :</strong> Rs. {(booking.due_amount || 0).toLocaleString('en-IN')} /-</div>
                    </td>
                    <td className="border border-[#c99] px-2 py-2 align-top">
                      <div><strong>Journey Date</strong></div>
                      <div>:{booking.safari_date ? format(new Date(booking.safari_date), "dd/MM/yyyy") : "-"}</div>
                      <div><strong>Booking Date</strong></div>
                      <div>:{booking.bookings?.created_at ? format(new Date(booking.bookings.created_at), "dd/MM/yyyy") : "-"}</div>
                    </td>
                    <td className="border border-[#c99] px-2 py-2 align-top">
                      <div className="flex flex-col gap-0.5 text-[#c00] text-[10px]">
                        <button className="hover:underline text-left" onClick={() => handleViewDetails(booking)}>View Details</button>
                        <button className="hover:underline text-left">Refund Payment</button>
                        <button className="hover:underline text-left" onClick={() => booking.bookings && paymentDialog.handleViewPayment(booking.bookings)}>View Refund Payment</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && filteredBookings.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No safari bookings found</div>
          )}
        </div>

        <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} totalItems={totalItems} startIndex={startIndex} endIndex={endIndex} />
      </main>

      <BookingDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        booking={selectedBookingData}
        serviceType="safari"
        serviceData={selectedServiceData}
      />

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
