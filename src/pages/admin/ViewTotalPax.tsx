import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow } from "@/components/admin/AdminPageShell";

export default function ViewTotalPax() {
  const { isAdmin, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCustomer, setSearchCustomer] = useState("");

  useEffect(() => { if (!authLoading && isAdmin()) fetchBookings(); }, [authLoading]);

  const fetchBookings = async () => {
    setLoading(true);
    const { data } = await supabase.from("bookings").select(`id, booking_number, customer_name, check_in_date, check_out_date, adults, children, agent:agents(name)`).in("status", ["confirmed", "completed"]).order("check_in_date", { ascending: false });
    setBookings(data || []);
    setLoading(false);
  };

  const filteredBookings = bookings.filter(b => !searchCustomer || b.customer_name?.toLowerCase().includes(searchCustomer.toLowerCase()) || b.booking_number?.toLowerCase().includes(searchCustomer.toLowerCase()));
  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filteredBookings);
  const totalAdults = filteredBookings.reduce((sum, b) => sum + (b.adults || 0), 0);
  const totalChildren = filteredBookings.reduce((sum, b) => sum + (b.children || 0), 0);

  if (authLoading) return <div className="p-6 text-center text-muted-foreground">Loading...</div>;
  if (!isAdmin()) return <div className="p-6 text-center">Admin access required.</div>;

  const filterSection = (
    <div className="flex flex-wrap items-center gap-4 text-xs">
      <div className="flex items-center gap-1"><span>Search :</span><input value={searchCustomer} onChange={(e) => setSearchCustomer(e.target.value)} className="border px-1 py-0.5 text-xs min-w-[200px]" placeholder="Search customer or booking..." /></div>
      <div className="ml-auto text-xs font-medium">Total Pax: {totalAdults + totalChildren} (Adults: {totalAdults}, Children: {totalChildren})</div>
    </div>
  );

  return (
    <AdminPageShell title="Total Pax" filterSection={filterSection} pagination={{ currentPage, totalPages, onPageChange: goToPage, totalItems, startIndex, endIndex }}>
      {loading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> : (
        <ThemedTable>
          <ThemedTHead><ThemedTH>S.No</ThemedTH><ThemedTH>Booking</ThemedTH><ThemedTH>Customer Name</ThemedTH><ThemedTH>Agent</ThemedTH><ThemedTH>Check In</ThemedTH><ThemedTH>Check Out</ThemedTH><ThemedTH>Adults</ThemedTH><ThemedTH>Children</ThemedTH><ThemedTH>Total Pax</ThemedTH><ThemedTH>Action</ThemedTH></ThemedTHead>
          <tbody>
            {paginatedItems.length === 0 ? <ThemedEmptyRow colSpan={10} message="No bookings found" /> : paginatedItems.map((booking, index) => (
              <ThemedTR key={booking.id} index={index}>
                <ThemedTD>{startIndex + index + 1}</ThemedTD>
                <ThemedTD>{booking.booking_number}</ThemedTD>
                <ThemedTD>{booking.customer_name || "N/A"}</ThemedTD>
                <ThemedTD>{booking.agent?.name || "Direct"}</ThemedTD>
                <ThemedTD>{booking.check_in_date}</ThemedTD>
                <ThemedTD>{booking.check_out_date}</ThemedTD>
                <ThemedTD>{booking.adults || 0}</ThemedTD>
                <ThemedTD>{booking.children || 0}</ThemedTD>
                <ThemedTD className="font-medium">{(booking.adults || 0) + (booking.children || 0)}</ThemedTD>
                <ThemedTD>
                  <div className="flex flex-col gap-0.5 text-[#c00] text-[10px]">
                    <button className="hover:underline text-left" onClick={() => navigate(`/admin/bookings/${booking.id}`)}>View Booking</button>
                    <button className="hover:underline text-left" onClick={() => navigate(`/admin/booking-payments?id=${booking.id}`)}>View Payments</button>
                  </div>
                </ThemedTD>
              </ThemedTR>
            ))}
          </tbody>
        </ThemedTable>
      )}
    </AdminPageShell>
  );
}
