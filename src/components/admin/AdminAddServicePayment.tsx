import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { filterInputStyle, filterSelectStyle, filterButtonStyle } from "@/components/admin/AdminPageShell";

interface Props {
  /** e.g. "visa" | "cruise" */
  serviceType: string;
  /** Section title, e.g. "Add Visa Payment" */
  title: string;
  /** service bookings table, e.g. "visa_bookings" */
  table: "visa_bookings" | "cruise_bookings";
  /** name column, e.g. "visa_name" */
  nameField: string;
}

export default function AdminAddServicePayment({ serviceType, title, table, nameField }: Props) {
  const { isAdmin, isAccount, user, loading: authLoading } = useAuthContext();
  const [records, setRecords] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState("");
  const [payment, setPayment] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [chequeNo, setChequeNo] = useState("");
  const [paymentDetail, setPaymentDetail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManage = isAdmin() || isAccount();

  useEffect(() => {
    if (!authLoading && canManage) fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  const fetchRecords = async () => {
    const { data } = await supabase
      .from(table)
      .select(`id, booking_id, ${nameField}, bookings(booking_number, customer_name)`)
      .order("created_at", { ascending: false });
    setRecords(data || []);
  };

  const handleReset = () => {
    setSelectedBooking(""); setPayment(""); setPaymentMode(""); setChequeNo(""); setPaymentDetail("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment || !paymentMode || !selectedBooking) { toast.error("Please fill in required fields"); return; }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("payments").insert({
        booking_id: selectedBooking,
        amount: parseFloat(payment),
        payment_mode: paymentMode,
        reference_number: chequeNo || null,
        notes: paymentDetail || null,
        payment_type: serviceType,
        payment_date: new Date().toISOString().split("T")[0],
        created_by: user?.id,
        approval_status: "pending",
      });
      if (error) throw error;
      toast.success(`${title} added successfully`);
      handleReset();
    } catch (error) {
      console.error("Error adding payment:", error);
      toast.error("Failed to add payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) return <div style={{ padding: 24, textAlign: "center", color: "#999", fontSize: 11 }}>Loading...</div>;
  if (!canManage) return <div style={{ padding: 24, textAlign: "center", fontSize: 11 }}>Admin access required.</div>;

  const labelStyle: React.CSSProperties = { width: 140, textAlign: "right", fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif" };
  const inputStyle: React.CSSProperties = { ...filterInputStyle, border: "1px solid #999", padding: "2px 4px", width: 250 };

  return (
    <div style={{ padding: 12, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 }}>
      <div style={{ fontSize: 13, fontWeight: "bold", marginBottom: 8, color: "#333" }}>📋 {title}</div>
      <div style={{ border: "1px solid #ccc" }}>
        <div style={{ backgroundColor: "#b44a50", color: "#fff", padding: "4px 10px", fontSize: 11, fontWeight: "bold" }}>{title}</div>
        <form onSubmit={handleSubmit} style={{ padding: 16, backgroundColor: "#fff" }}>
          <div style={{ textAlign: "right", fontSize: 10, color: "red", marginBottom: 12 }}>* - Required Fields</div>
          <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <label style={labelStyle}>Payment :</label>
            <input type="number" value={payment} onChange={e => setPayment(e.target.value)} style={inputStyle} required />
            <span style={{ color: "red" }}>*</span>
          </div>
          <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <label style={labelStyle}>Payment Mode :</label>
            <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} style={{ ...filterSelectStyle, border: "1px solid #999" }} required>
              <option value="">---Select Mode---</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="net banking">Net Banking</option>
              <option value="credit card">Credit Card</option>
              <option value="cheque">Cheque</option>
            </select>
            <span style={{ color: "red" }}>*</span>
          </div>
          <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <label style={labelStyle}>Cheque No. :</label>
            <input type="text" value={chequeNo} onChange={e => setChequeNo(e.target.value)} style={{ ...inputStyle, width: 150 }} />
          </div>
          <div style={{ marginBottom: 8, display: "flex", alignItems: "flex-start", gap: 8 }}>
            <label style={{ ...labelStyle, paddingTop: 4 }}>Payment Detail :</label>
            <textarea value={paymentDetail} onChange={e => setPaymentDetail(e.target.value)} rows={4} style={{ ...inputStyle, width: 300, fontFamily: "Arial", fontSize: 11 }} />
          </div>
          <div style={{ backgroundColor: "#e8e8e8", padding: "6px 10px", margin: "8px -16px", display: "flex", alignItems: "center", gap: 8 }}>
            <label style={labelStyle}>Booking :</label>
            <select value={selectedBooking} onChange={e => setSelectedBooking(e.target.value)} style={{ ...filterSelectStyle, border: "1px solid #999", flex: 1, maxWidth: 500 }} required>
              <option value="">---Select---</option>
              {records.map(r => (
                <option key={r.id} value={r.booking_id}>
                  {r.bookings?.booking_number} - {r.bookings?.customer_name} ({r[nameField]})
                </option>
              ))}
            </select>
            <span style={{ color: "red" }}>*</span>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
            <button type="submit" disabled={isSubmitting} style={filterButtonStyle}>Submit</button>
            <button type="button" onClick={handleReset} style={filterButtonStyle}>Reset</button>
          </div>
        </form>
      </div>
    </div>
  );
}
