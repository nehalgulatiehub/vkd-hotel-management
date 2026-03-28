import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow, ThemedActionLink, filterInputStyle } from "@/components/admin/AdminPageShell";
import { Header } from "@/components/layout/Header";

export default function CancelledBookings() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const [bookings, setBookings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => { fetchCancelledBookings(); }, []);

  const fetchCancelledBookings = async () => {
    const { data, error } = await supabase.from("bookings").select("*, agents(name), cancellations(*)").eq("status", "cancelled").order("updated_at", { ascending: false });
    if (error) { toast.error("Failed to load cancelled bookings"); } else { setBookings(data || []); }
  };

  const filteredBookings = bookings.filter(booking =>
    booking.booking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pagination = usePagination(filteredBookings);

  useEffect(() => { pagination.resetPage(); }, [searchTerm]);

  const filterSection = (
    <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif" }}>
      <span>Search :</span>
      <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ ...filterInputStyle, flex: 1 }} placeholder="Search by booking number or customer..." />
      <span style={{ marginLeft: "auto", fontWeight: "bold" }}>Total Cancelled: {filteredBookings.length}</span>
    </div>
  );

  const content = (
    <AdminPageShell title="Cancelled Bookings" filterSection={filterSection} pagination={{ currentPage: pagination.currentPage, totalPages: pagination.totalPages, onPageChange: pagination.goToPage, totalItems: pagination.totalItems, startIndex: pagination.startIndex, endIndex: pagination.endIndex }}>
      <ThemedTable>
        <ThemedTHead><ThemedTH>S.No</ThemedTH><ThemedTH>Booking No</ThemedTH><ThemedTH>Customer</ThemedTH><ThemedTH>Contact</ThemedTH><ThemedTH>Check-in</ThemedTH><ThemedTH>Check-out</ThemedTH><ThemedTH>Total</ThemedTH><ThemedTH>Paid</ThemedTH><ThemedTH>Reason</ThemedTH><ThemedTH>Action</ThemedTH></ThemedTHead>
        <tbody>
          {pagination.paginatedItems.length === 0 ? <ThemedEmptyRow colSpan={10} message="No cancelled bookings found" /> : pagination.paginatedItems.map((booking, index) => (
            <ThemedTR key={booking.id} index={index}>
              <ThemedTD>{pagination.startIndex + index + 1}</ThemedTD>
              <ThemedTD>{booking.booking_number}</ThemedTD>
              <ThemedTD>{booking.customer_name || "-"}</ThemedTD>
              <ThemedTD>{booking.contact_no || "-"}</ThemedTD>
              <ThemedTD>{booking.check_in_date ? new Date(booking.check_in_date).toLocaleDateString() : "-"}</ThemedTD>
              <ThemedTD>{booking.check_out_date ? new Date(booking.check_out_date).toLocaleDateString() : "-"}</ThemedTD>
              <ThemedTD>Rs. {booking.total_amount?.toLocaleString() || 0}/-</ThemedTD>
              <ThemedTD>Rs. {booking.paid_amount?.toLocaleString() || 0}/-</ThemedTD>
              <ThemedTD>{booking.cancellations?.[0]?.cancellation_reason || "-"}</ThemedTD>
              <ThemedTD>
                {booking.paid_amount > 0 && (
                  <ThemedActionLink onClick={() => navigate(isAdminRoute ? `/admin/refund-payments?id=${booking.id}` : `/refunds?id=${booking.id}`)}>
                    Process Refund
                  </ThemedActionLink>
                )}
              </ThemedTD>
            </ThemedTR>
          ))}
        </tbody>
      </ThemedTable>
    </AdminPageShell>
  );

  if (!isAdminRoute) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Cancelled Bookings" />
        <main className="p-6">{content}</main>
      </div>
    );
  }

  return content;
}
