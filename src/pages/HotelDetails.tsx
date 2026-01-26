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

export default function HotelDetails() {
  const [hotelBookings, setHotelBookings] = useState<any[]>([]);
  const [filters, setFilters] = useState<FilterValues>(getDefaultFilters());
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<any[]>([]);
  const paymentDialog = usePaymentDialog(() => fetchHotelBookings());

  useEffect(() => {
    fetchHotelBookings();
    fetchCities();
  }, []);

  const fetchHotelBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("hotel_bookings")
      .select(`
        *,
        bookings(id, booking_number, customer_name, status, contact_no, booking_type, created_at, notes, agent_id, created_by, total_amount, paid_amount, due_amount, agents(name)),
        another_hotels:hotel_id(id, name, city_id, cities(name))
      `)
      .not("hotel_id", "is", null)
      .order("check_in_date", { ascending: false });
    
    if (error) {
      toast.error("Failed to load hotel bookings");
    } else {
      setHotelBookings(data || []);
    }
    setLoading(false);
  };

  const fetchCities = async () => {
    const { data } = await supabase.from("cities").select("id, name").order("name");
    setCities(data || []);
  };

  const handleSearch = () => {
    fetchHotelBookings();
  };

  const filteredBookings = hotelBookings.filter(booking => {
    // Date filter
    if (filters.searchWithDate) {
      const checkInDate = new Date(booking.check_in_date);
      const fromDate = new Date(`${filters.fromYear}-${filters.fromMonth}-${filters.fromDay}`);
      const toDate = new Date(`${filters.toYear}-${filters.toMonth}-${filters.toDay}`);
      if (checkInDate < fromDate || checkInDate > toDate) return false;
    }

    // Type filter
    if (filters.type) {
      const bookingType = booking.bookings?.booking_type || "direct";
      if (filters.type !== bookingType) return false;
    }

    // Customer filter
    if (filters.customer) {
      if (!booking.bookings?.customer_name?.toLowerCase().includes(filters.customer.toLowerCase())) return false;
    }

    // Hotel filter
    if (filters.hotelId) {
      if (booking.hotel_id !== filters.hotelId) return false;
    }

    // City filter
    if (filters.cityId) {
      if (booking.another_hotels?.city_id !== filters.cityId) return false;
    }

    // Reference filter
    if (filters.reference) {
      if (!booking.bookings?.notes?.toLowerCase().includes(filters.reference.toLowerCase())) return false;
    }

    return true;
  });

  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filteredBookings);

  return (
    <div className="min-h-screen bg-background">
      <Header title="Another Hotel Details" />
      <main className="p-2">
        {/* Header Bar */}
        <div className="flex justify-between items-center mb-2 px-3 py-2" style={{ backgroundColor: "#1e6e99" }}>
          <h2 className="text-white font-semibold text-sm">View Another Hotel Detail</h2>
          <button className="text-white text-sm hover:underline">View All Records</button>
        </div>

        {/* Filters */}
        <DetailPageFilters
          options={{
            showType: true,
            showAgent: true,
            showUser: true,
            showCustomer: true,
            showReference: true,
            showHotel: true,
            showCity: true
          }}
          filters={filters}
          onFilterChange={setFilters}
          onSearch={handleSearch}
        />

        {/* Data Table */}
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
                  <th className="border border-[#c99] px-2 py-1.5 text-left font-semibold">Hotel Detail</th>
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
                        <div>
                          <div>Agent</div>
                          <div className="text-[10px]">{booking.bookings?.agents?.name || ""}</div>
                        </div>
                      ) : "Direct"}
                    </td>
                    <td className="border border-[#c99] px-2 py-2 align-top">
                      {booking.bookings?.created_by ? "User" : "-"}
                    </td>
                    <td className="border border-[#c99] px-2 py-2 align-top">
                      <div className="font-medium">{booking.bookings?.customer_name || "-"}</div>
                      <div className="text-[10px]">Contact No.: {booking.bookings?.contact_no || ""}</div>
                    </td>
                    <td className="border border-[#c99] px-2 py-2 align-top">
                      <div><strong>Hotel Name :</strong> {booking.another_hotels?.name || "-"}</div>
                      <div><strong>City :</strong> <span className="text-red-600 font-bold">{booking.another_hotels?.cities?.name?.toUpperCase() || "-"}</span></div>
                      <div><strong>No of Rooms :</strong> {booking.number_of_rooms || 0}</div>
                      <div><strong>Room Type :</strong> {booking.room_type || "-"}</div>
                      <div><strong>Booking Price :</strong> Rs. {(booking.room_rate || 0).toLocaleString('en-IN')} /-</div>
                      <div><strong>Selling Price :</strong> Rs. {(booking.total_amount || 0).toLocaleString('en-IN')} /-</div>
                      <div><strong>Total Received Payment :</strong> Rs. {(booking.paid_amount || 0).toLocaleString('en-IN')} /-</div>
                      <div><strong>Due Payment :</strong> Rs. {(booking.due_amount || 0).toLocaleString('en-IN')} /-</div>
                    </td>
                    <td className="border border-[#c99] px-2 py-2 align-top">
                      <div><strong>Date :</strong>{booking.check_in_date ? format(new Date(booking.check_in_date), "dd/MM/yyyy") : "-"}</div>
                      <div><strong>Booking From</strong></div>
                      <div>:{booking.check_in_date ? format(new Date(booking.check_in_date), "dd/MM/yyyy") : "-"}</div>
                      <div><strong>Booking To</strong></div>
                      <div>:{booking.check_out_date ? format(new Date(booking.check_out_date), "dd/MM/yyyy") : "-"}</div>
                      <div><strong>Note :</strong> {booking.bookings?.notes || ""}</div>
                    </td>
                    <td className="border border-[#c99] px-2 py-2 align-top">
                      <div className="flex flex-col gap-0.5 text-[#c00] text-[10px]">
                        <button 
                          className="hover:underline text-left"
                          onClick={() => booking.bookings && paymentDialog.handleViewPayment(booking.bookings)}
                        >
                          View Details
                        </button>
                        <button className="hover:underline text-left">
                          Refund Payment
                        </button>
                        <button 
                          className="hover:underline text-left"
                          onClick={() => booking.bookings && paymentDialog.handleViewPayment(booking.bookings)}
                        >
                          View Refund Payment
                        </button>
                        <button className="hover:underline text-left">
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && filteredBookings.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No hotel bookings found</div>
          )}
        </div>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
          totalItems={totalItems}
          startIndex={startIndex}
          endIndex={endIndex}
        />
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
