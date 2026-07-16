import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow, ThemedActionLink, filterInputStyle } from "@/components/admin/AdminPageShell";
import { formatDisplayDate } from "@/utils/dateFormat";

export default function ViewReferenceList() {
  const { isAdmin, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchReference, setSearchReference] = useState("");

  useEffect(() => { if (!authLoading && isAdmin()) fetchBookings(); }, [authLoading]);

  const fetchBookings = async () => {
    setLoading(true);
    const { data } = await supabase.from("bookings").select(`id, booking_number, reference, reference_email, customer_name, contact_no, check_in_date, check_out_date, total_amount, paid_amount, due_amount, booking_type, created_by, created_at, agent:agents(name, company_name)`).not("reference", "is", null).order("created_at", { ascending: false });
    const creatorIds = [...new Set((data || []).map(b => b.created_by).filter(Boolean))];
    let profilesMap: Record<string, any> = {};
    if (creatorIds.length > 0) { const { data: profiles } = await supabase.from("profiles").select("id, username, first_name").in("id", creatorIds); profilesMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {}); }
    setBookings((data || []).map(b => ({ ...b, profile: b.created_by ? profilesMap[b.created_by] : null })));
    setLoading(false);
  };

  const filteredBookings = bookings.filter(b => !searchReference || b.reference?.toLowerCase().includes(searchReference.toLowerCase()) || b.booking_number?.toLowerCase().includes(searchReference.toLowerCase()));
  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filteredBookings);

  if (authLoading) return <div style={{ padding: 24, textAlign: "center", color: "#999", fontSize: 11 }}>Loading...</div>;
  if (!isAdmin()) return <div style={{ padding: 24, textAlign: "center", fontSize: 11 }}>Admin access required.</div>;

  const filterSection = (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif" }}>
      <span>Search :</span>
      <input value={searchReference} onChange={(e) => setSearchReference(e.target.value)} style={{ ...filterInputStyle, minWidth: 200 }} placeholder="Search reference or booking..." />
    </div>
  );

  return (
    <AdminPageShell title="View Reference List" filterSection={filterSection} pagination={{ currentPage, totalPages, onPageChange: goToPage, totalItems, startIndex, endIndex }}>
      {loading ? <div style={{ textAlign: "center", padding: 32, color: "#999", fontSize: 11 }}>Loading...</div> : (
        <ThemedTable>
          <ThemedTHead><ThemedTH>S.No</ThemedTH><ThemedTH>Booking</ThemedTH><ThemedTH>Type</ThemedTH><ThemedTH>Customer Name</ThemedTH><ThemedTH>Reference</ThemedTH><ThemedTH>Price</ThemedTH><ThemedTH>User</ThemedTH><ThemedTH>Action</ThemedTH></ThemedTHead>
          <tbody>
            {paginatedItems.length === 0 ? <ThemedEmptyRow colSpan={8} message="No bookings with references found" /> : paginatedItems.map((booking, index) => (
              <ThemedTR key={booking.id} index={index}>
                <ThemedTD>{startIndex + index + 1}</ThemedTD>
                <ThemedTD><div>{booking.booking_number}</div><div>{formatDisplayDate(booking.check_in_date)} - {formatDisplayDate(booking.check_out_date)}</div></ThemedTD>
                <ThemedTD>{booking.booking_type || "Agent"}</ThemedTD>
                <ThemedTD><div>{booking.customer_name || "N/A"}</div><div>Contact: {booking.contact_no || "N/A"}</div></ThemedTD>
                <ThemedTD><div>{booking.reference || "N/A"}</div>{booking.reference_email && <div>{booking.reference_email}</div>}</ThemedTD>
                <ThemedTD><div>Booking: Rs. {booking.total_amount?.toLocaleString() || 0}/-</div><div>Received: Rs. {booking.paid_amount?.toLocaleString() || 0}/-</div><div>Due: Rs. {booking.due_amount?.toLocaleString() || 0}/-</div></ThemedTD>
                <ThemedTD>{booking.profile?.username || booking.profile?.first_name || "N/A"}</ThemedTD>
                <ThemedTD>
                  <ThemedActionLink onClick={() => navigate(`/admin/bookings/${booking.id}`)}>View Booking</ThemedActionLink>
                  <ThemedActionLink onClick={() => navigate(`/admin/booking-payments?id=${booking.id}`)}>View Payments</ThemedActionLink>
                </ThemedTD>
              </ThemedTR>
            ))}
          </tbody>
        </ThemedTable>
      )}
    </AdminPageShell>
  );
}
