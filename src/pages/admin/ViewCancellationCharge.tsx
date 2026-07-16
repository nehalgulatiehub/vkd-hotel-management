import { DateInput } from "@/components/ui/DateInput";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow, ThemedActionLink, filterInputStyle } from "@/components/admin/AdminPageShell";

interface CancellationWithDetails {
  id: string;
  cancellation_date: string | null;
  cancellation_charges: number | null;
  refund_amount: number | null;
  cancellation_reason: string | null;
  booking: { id: string; booking_number: string; customer_name: string | null; total_amount: number | null; } | null;
}

export default function ViewCancellationCharge() {
  const { isAdmin, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [cancellations, setCancellations] = useState<CancellationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchBooking, setSearchBooking] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredCancellations = cancellations.filter(c => {
    const matchesSearch = !searchBooking || c.booking?.booking_number?.toLowerCase().includes(searchBooking.toLowerCase()) || c.booking?.customer_name?.toLowerCase().includes(searchBooking.toLowerCase());
    let matchesDate = true;
    if (fromDate || toDate) {
      const cancelDate = c.cancellation_date ? new Date(c.cancellation_date) : null;
      if (cancelDate) {
        if (fromDate) matchesDate = matchesDate && cancelDate >= new Date(fromDate);
        if (toDate) matchesDate = matchesDate && cancelDate <= new Date(toDate);
      } else { matchesDate = false; }
    }
    return matchesSearch && matchesDate;
  });

  const pagination = usePagination(filteredCancellations, { itemsPerPage: 10 });
  const totalCharges = filteredCancellations.reduce((sum, c) => sum + (c.cancellation_charges || 0), 0);

  useEffect(() => { if (!authLoading && isAdmin()) fetchCancellations(); }, [authLoading]);

  const fetchCancellations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("cancellations").select(`id, cancellation_date, cancellation_charges, refund_amount, cancellation_reason, booking:bookings(id, booking_number, customer_name, total_amount)`).order("cancellation_date", { ascending: false });
      if (error) throw error;
      setCancellations((data || []) as CancellationWithDetails[]);
    } catch (error) { console.error("Error fetching cancellations:", error); }
    finally { setLoading(false); }
  };

  if (authLoading || loading) return <div style={{ padding: 24, textAlign: "center", color: "#999", fontSize: 11 }}>Loading...</div>;
  if (!isAdmin()) return <div style={{ padding: 24, textAlign: "center", fontSize: 11 }}>Access Denied</div>;

  const filterSection = (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span>Search :</span>
        <input value={searchBooking} onChange={(e) => setSearchBooking(e.target.value)} style={{ ...filterInputStyle, minWidth: 180 }} placeholder="Booking or customer..." />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span>From :</span>
        <DateInput value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={filterInputStyle} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span>To :</span>
        <DateInput value={toDate} onChange={(e) => setToDate(e.target.value)} style={filterInputStyle} />
      </div>
      <div style={{ marginLeft: "auto", fontWeight: "bold", fontSize: 11 }}>Total Charges: Rs. {totalCharges.toLocaleString()}/-</div>
    </div>
  );

  return (
    <AdminPageShell title="View Cancellation Charge" filterSection={filterSection} pagination={{ currentPage: pagination.currentPage, totalPages: pagination.totalPages, onPageChange: pagination.goToPage, totalItems: pagination.totalItems, startIndex: pagination.startIndex, endIndex: pagination.endIndex }}>
      <ThemedTable>
        <ThemedTHead>
          <ThemedTH>S.No</ThemedTH><ThemedTH>Booking</ThemedTH><ThemedTH>Customer</ThemedTH><ThemedTH>Cancellation Date</ThemedTH><ThemedTH>Booking Amount</ThemedTH><ThemedTH>Cancellation Charges</ThemedTH><ThemedTH>Refund Amount</ThemedTH><ThemedTH>Reason</ThemedTH><ThemedTH>Action</ThemedTH>
        </ThemedTHead>
        <tbody>
          {pagination.paginatedItems.map((c, index) => (
            <ThemedTR key={c.id} index={index}>
              <ThemedTD>{pagination.startIndex + index + 1}</ThemedTD>
              <ThemedTD>{c.booking?.booking_number || "N/A"}</ThemedTD>
              <ThemedTD>{c.booking?.customer_name || "N/A"}</ThemedTD>
              <ThemedTD>{c.cancellation_date ? format(new Date(c.cancellation_date), "dd/MM/yyyy") : "N/A"}</ThemedTD>
              <ThemedTD>Rs. {c.booking?.total_amount?.toLocaleString() || 0}/-</ThemedTD>
              <ThemedTD>Rs. {c.cancellation_charges?.toLocaleString() || 0}/-</ThemedTD>
              <ThemedTD>Rs. {c.refund_amount?.toLocaleString() || 0}/-</ThemedTD>
              <ThemedTD>{c.cancellation_reason || "N/A"}</ThemedTD>
              <ThemedTD>
                <ThemedActionLink onClick={() => navigate(`/admin/bookings/${c.booking?.id}`)}>Booking</ThemedActionLink>
                <ThemedActionLink onClick={() => navigate(`/admin/booking-payments?id=${c.booking?.id}`)}>Payments</ThemedActionLink>
              </ThemedTD>
            </ThemedTR>
          ))}
          {filteredCancellations.length === 0 && <ThemedEmptyRow colSpan={9} message="No cancellations found" />}
        </tbody>
      </ThemedTable>
    </AdminPageShell>
  );
}
