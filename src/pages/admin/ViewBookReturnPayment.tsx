import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow } from "@/components/admin/AdminPageShell";

export default function ViewBookReturnPayment() {
  const { isAdmin, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchBooking, setSearchBooking] = useState("");

  useEffect(() => { if (!authLoading && isAdmin()) fetchRefunds(); }, [authLoading]);

  const fetchRefunds = async () => {
    setLoading(true);
    const { data } = await supabase.from("refunds").select(`id, refund_date, refund_amount, refund_mode, reference_number, approval_status, booking:bookings(id, booking_number, customer_name, total_amount)`).order("refund_date", { ascending: false });
    setRefunds(data || []);
    setLoading(false);
  };

  const filteredRefunds = refunds.filter(r => !searchBooking || r.booking?.booking_number?.toLowerCase().includes(searchBooking.toLowerCase()) || r.booking?.customer_name?.toLowerCase().includes(searchBooking.toLowerCase()));
  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filteredRefunds);
  const totalRefunds = filteredRefunds.reduce((sum, r) => sum + (r.refund_amount || 0), 0);

  if (authLoading) return <div className="p-6 text-center text-muted-foreground">Loading...</div>;
  if (!isAdmin()) return <div className="p-6 text-center">Admin access required.</div>;

  const filterSection = (
    <div className="flex flex-wrap items-center gap-4 text-xs">
      <div className="flex items-center gap-1"><span>Search :</span><input value={searchBooking} onChange={(e) => setSearchBooking(e.target.value)} className="border px-1 py-0.5 text-xs min-w-[200px]" placeholder="Search booking or customer..." /></div>
      <div className="ml-auto text-xs font-medium">Total Refunds: Rs. {totalRefunds.toLocaleString()}/-</div>
    </div>
  );

  return (
    <AdminPageShell title="View Book Return Payment" filterSection={filterSection} pagination={{ currentPage, totalPages, onPageChange: goToPage, totalItems, startIndex, endIndex }}>
      {loading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> : (
        <ThemedTable>
          <ThemedTHead><ThemedTH>S.No</ThemedTH><ThemedTH>Booking</ThemedTH><ThemedTH>Customer</ThemedTH><ThemedTH>Refund Date</ThemedTH><ThemedTH>Booking Amount</ThemedTH><ThemedTH>Refund Amount</ThemedTH><ThemedTH>Mode</ThemedTH><ThemedTH>Reference</ThemedTH><ThemedTH>Status</ThemedTH><ThemedTH>Action</ThemedTH></ThemedTHead>
          <tbody>
            {paginatedItems.length === 0 ? <ThemedEmptyRow colSpan={10} message="No refunds found" /> : paginatedItems.map((refund, index) => (
              <ThemedTR key={refund.id} index={index}>
                <ThemedTD>{startIndex + index + 1}</ThemedTD>
                <ThemedTD>{refund.booking?.booking_number || "N/A"}</ThemedTD>
                <ThemedTD>{refund.booking?.customer_name || "N/A"}</ThemedTD>
                <ThemedTD>{refund.refund_date ? format(new Date(refund.refund_date), "dd-MMM-yyyy") : "N/A"}</ThemedTD>
                <ThemedTD>Rs. {refund.booking?.total_amount?.toLocaleString() || 0}/-</ThemedTD>
                <ThemedTD>Rs. {refund.refund_amount?.toLocaleString() || 0}/-</ThemedTD>
                <ThemedTD>{refund.refund_mode || "N/A"}</ThemedTD>
                <ThemedTD>{refund.reference_number || "N/A"}</ThemedTD>
                <ThemedTD>{refund.approval_status || "Pending"}</ThemedTD>
                <ThemedTD>
                  <div className="flex flex-col gap-0.5 text-[#c00] text-[10px]">
                    <button className="hover:underline text-left" onClick={() => navigate(`/admin/bookings/${refund.booking?.id}`)}>View Booking</button>
                    <button className="hover:underline text-left" onClick={() => navigate(`/admin/booking-payments?id=${refund.booking?.id}`)}>View Payments</button>
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
