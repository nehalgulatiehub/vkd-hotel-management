import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow } from "@/components/admin/AdminPageShell";

export default function ViewReceivePayment() {
  const { isAdmin, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCustomer, setSearchCustomer] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => { if (!authLoading && isAdmin()) fetchPayments(); }, [authLoading]);

  const fetchPayments = async () => {
    setLoading(true);
    const { data } = await supabase.from("payments").select(`id, amount, payment_mode, payment_date, payment_type, reference_number, approval_status, created_at, created_by, booking:bookings(id, booking_number, customer_name)`).order("created_at", { ascending: false });
    const creatorIds = [...new Set((data || []).map(p => p.created_by).filter(Boolean))];
    let profilesMap: Record<string, any> = {};
    if (creatorIds.length > 0) { const { data: profiles } = await supabase.from("profiles").select("id, username, first_name").in("id", creatorIds); profilesMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {}); }
    setPayments((data || []).map(p => ({ ...p, profile: p.created_by ? profilesMap[p.created_by] : null })));
    setLoading(false);
  };

  const filteredPayments = payments.filter(p => {
    const matchesCustomer = !searchCustomer || p.booking?.customer_name?.toLowerCase().includes(searchCustomer.toLowerCase()) || p.booking?.booking_number?.toLowerCase().includes(searchCustomer.toLowerCase());
    const matchesStatus = !filterStatus || p.approval_status?.toLowerCase() === filterStatus.toLowerCase();
    return matchesCustomer && matchesStatus;
  });

  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filteredPayments);
  const totalReceived = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  if (authLoading) return <div className="p-6 text-center text-muted-foreground">Loading...</div>;
  if (!isAdmin()) return <div className="p-6 text-center">Admin access required.</div>;

  const filterSection = (
    <div className="flex flex-wrap items-center gap-4 text-xs">
      <div className="flex items-center gap-1"><span>Customer :</span><input value={searchCustomer} onChange={(e) => setSearchCustomer(e.target.value)} className="border px-1 py-0.5 text-xs min-w-[200px]" placeholder="Search..." /></div>
      <div className="flex items-center gap-1"><span>Status :</span>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border px-1 py-0.5 text-xs">
          <option value="">All Status</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
        </select>
      </div>
      <div className="ml-auto text-xs font-medium">Total: Rs. {totalReceived.toLocaleString()}/-</div>
    </div>
  );

  return (
    <AdminPageShell title="View Receive Payment" filterSection={filterSection} pagination={{ currentPage, totalPages, onPageChange: goToPage, totalItems, startIndex, endIndex }}>
      {loading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> : (
        <ThemedTable>
          <ThemedTHead><ThemedTH>S.No</ThemedTH><ThemedTH>Booking</ThemedTH><ThemedTH>Customer</ThemedTH><ThemedTH>Date</ThemedTH><ThemedTH>Amount</ThemedTH><ThemedTH>Mode</ThemedTH><ThemedTH>Received By</ThemedTH><ThemedTH>Status</ThemedTH><ThemedTH>Action</ThemedTH></ThemedTHead>
          <tbody>
            {paginatedItems.length === 0 ? <ThemedEmptyRow colSpan={9} message="No payments found" /> : paginatedItems.map((payment, index) => (
              <ThemedTR key={payment.id} index={index}>
                <ThemedTD>{startIndex + index + 1}</ThemedTD>
                <ThemedTD>{payment.booking?.booking_number || "N/A"}</ThemedTD>
                <ThemedTD>{payment.booking?.customer_name || "N/A"}</ThemedTD>
                <ThemedTD>{payment.created_at ? format(new Date(payment.created_at), "dd-MMM-yyyy") : "N/A"}</ThemedTD>
                <ThemedTD>Rs. {payment.amount?.toLocaleString() || 0}/-</ThemedTD>
                <ThemedTD>{payment.payment_mode || "N/A"}</ThemedTD>
                <ThemedTD>{payment.profile?.username || payment.profile?.first_name || "N/A"}</ThemedTD>
                <ThemedTD>{payment.approval_status || "Pending"}</ThemedTD>
                <ThemedTD>
                  <div className="flex flex-col gap-0.5 text-[#c00] text-[10px]">
                    <button className="hover:underline text-left" onClick={() => navigate(`/admin/bookings/${payment.booking?.id}`)}>View Booking</button>
                    <button className="hover:underline text-left" onClick={() => navigate(`/admin/booking-payments?id=${payment.booking?.id}`)}>View Payments</button>
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
