import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow, ThemedActionLink, filterInputStyle, filterSelectStyle } from "@/components/admin/AdminPageShell";

export default function ViewPaidPayment() {
  const { isAdmin, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCustomer, setSearchCustomer] = useState("");
  const [filterPaymentMode, setFilterPaymentMode] = useState("");

  useEffect(() => { if (!authLoading && isAdmin()) fetchPayments(); }, [authLoading]);

  const fetchPayments = async () => {
    setLoading(true);
    const { data } = await supabase.from("payments").select(`id, amount, payment_mode, payment_date, payment_type, reference_number, approval_status, booking:bookings(id, booking_number, customer_name)`).eq("approval_status", "approved").order("payment_date", { ascending: false });
    setPayments(data || []);
    setLoading(false);
  };

  const filteredPayments = payments.filter(p => {
    const matchesCustomer = !searchCustomer || p.booking?.customer_name?.toLowerCase().includes(searchCustomer.toLowerCase()) || p.booking?.booking_number?.toLowerCase().includes(searchCustomer.toLowerCase());
    const matchesMode = !filterPaymentMode || p.payment_mode?.toLowerCase() === filterPaymentMode.toLowerCase();
    return matchesCustomer && matchesMode;
  });

  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filteredPayments);
  const totalPaid = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  if (authLoading) return <div style={{ padding: 24, textAlign: "center", color: "#999", fontSize: 11 }}>Loading...</div>;
  if (!isAdmin()) return <div style={{ padding: 24, textAlign: "center", fontSize: 11 }}>Admin access required.</div>;

  const filterSection = (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span>Customer :</span>
        <input value={searchCustomer} onChange={(e) => setSearchCustomer(e.target.value)} style={{ ...filterInputStyle, minWidth: 200 }} placeholder="Search..." />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span>Mode :</span>
        <select value={filterPaymentMode} onChange={(e) => setFilterPaymentMode(e.target.value)} style={filterSelectStyle}>
          <option value="">All Modes</option><option value="cash">Cash</option><option value="upi">UPI</option><option value="net banking">Net Banking</option><option value="card">Card</option><option value="cheque">Cheque</option>
        </select>
      </div>
      <div style={{ marginLeft: "auto", fontWeight: "bold", fontSize: 11 }}>Total Paid: Rs. {totalPaid.toLocaleString()}/-</div>
    </div>
  );

  return (
    <AdminPageShell title="View Paid Payment" filterSection={filterSection} pagination={{ currentPage, totalPages, onPageChange: goToPage, totalItems, startIndex, endIndex }}>
      {loading ? <div style={{ textAlign: "center", padding: 32, color: "#999", fontSize: 11 }}>Loading...</div> : (
        <ThemedTable>
          <ThemedTHead><ThemedTH>S.No</ThemedTH><ThemedTH>Booking</ThemedTH><ThemedTH>Customer</ThemedTH><ThemedTH>Payment Date</ThemedTH><ThemedTH>Amount</ThemedTH><ThemedTH>Mode</ThemedTH><ThemedTH>Type</ThemedTH><ThemedTH>Reference</ThemedTH><ThemedTH>Action</ThemedTH></ThemedTHead>
          <tbody>
            {paginatedItems.length === 0 ? <ThemedEmptyRow colSpan={9} message="No paid payments found" /> : paginatedItems.map((payment, index) => (
              <ThemedTR key={payment.id} index={index}>
                <ThemedTD>{startIndex + index + 1}</ThemedTD>
                <ThemedTD>{payment.booking?.booking_number || "N/A"}</ThemedTD>
                <ThemedTD>{payment.booking?.customer_name || "N/A"}</ThemedTD>
                <ThemedTD>{payment.payment_date ? format(new Date(payment.payment_date), "dd-MMM-yyyy") : "N/A"}</ThemedTD>
                <ThemedTD>Rs. {payment.amount?.toLocaleString() || 0}/-</ThemedTD>
                <ThemedTD>{payment.payment_mode || "N/A"}</ThemedTD>
                <ThemedTD>{payment.payment_type || "N/A"}</ThemedTD>
                <ThemedTD>{payment.reference_number || "N/A"}</ThemedTD>
                <ThemedTD>
                  <ThemedActionLink onClick={() => navigate(`/admin/bookings/${payment.booking?.id}`)}>View Booking</ThemedActionLink>
                  <ThemedActionLink onClick={() => navigate(`/admin/booking-payments?id=${payment.booking?.id}`)}>View Payments</ThemedActionLink>
                </ThemedTD>
              </ThemedTR>
            ))}
          </tbody>
        </ThemedTable>
      )}
    </AdminPageShell>
  );
}
