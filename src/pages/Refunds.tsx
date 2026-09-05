import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { usePagination } from "@/hooks/usePagination";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { TablePagination } from "@/components/ui/TablePagination";
import { LegacyPanelHeader } from "@/components/legacy/LegacyPanelHeader";
import { LegacyFormPanel } from "@/components/legacy/LegacyFormPanel";
import { LegacyFormRow } from "@/components/legacy/LegacyFormRow";

export default function Refunds() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const bookingId = searchParams.get("id");

  const [bookings, setBookings] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ booking_id: "", cancellation_id: "", refund_amount: "", refund_mode: "", reference_number: "", notes: "" });

  useEffect(() => { fetchBookings(); fetchRefunds(); if (bookingId) fetchBookingById(bookingId); }, [bookingId]);

  const fetchBookings = async () => { const { data } = await supabase.from("bookings").select("*, agents(name)").eq("status", "cancelled").order("created_at", { ascending: false }); setBookings(data || []); };
  const fetchRefunds = async () => { const { data } = await supabase.from("refunds").select("*, bookings(booking_number, customer_name), cancellations(cancellation_reason)").order("created_at", { ascending: false }); setRefunds(data || []); };

  const fetchBookingById = async (id: string) => {
    const { data } = await supabase.from("bookings").select("*, agents(name)").eq("id", id).single();
    if (data) {
      setSelectedBooking(data);
      const { data: cancelData } = await supabase.from("cancellations").select("*").eq("booking_id", id).single();
      setFormData({ booking_id: id, cancellation_id: cancelData?.id || "", refund_amount: data.paid_amount?.toString() || "", refund_mode: "", reference_number: "", notes: "" });
      setShowForm(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("refunds").insert({ booking_id: formData.booking_id, cancellation_id: formData.cancellation_id || null, refund_amount: parseFloat(formData.refund_amount), refund_mode: formData.refund_mode, reference_number: formData.reference_number, notes: formData.notes, refund_date: new Date().toISOString().split('T')[0], processed_by: user?.id ?? null });
      if (error) throw error;
      toast.success("Refund processed successfully");
      setShowForm(false); setSelectedBooking(null); fetchRefunds();
      setFormData({ booking_id: "", cancellation_id: "", refund_amount: "", refund_mode: "", reference_number: "", notes: "" });
    } catch (error: any) { console.error("Error processing refund:", error); toast.error(error?.message || "Failed to process refund"); }
  };


  const closeForm = () => {
    setShowForm(false);
    setSelectedBooking(null);
    navigate(isAdminRoute ? "/admin/refund-payments" : "/refunds");
  };

  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(refunds);

  const formContent = showForm ? (
    <LegacyFormPanel
      title="Refund Form"
      rightSlot={
        <Button variant="link" className="text-white p-0 h-auto text-sm hover:text-white/80" onClick={closeForm}>
          View Refunds
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!bookingId && (
          <LegacyFormRow label="Cancelled Booking" htmlFor="booking_id">
            <select
              id="booking_id"
              value={formData.booking_id}
              onChange={(e) => {
                const b = bookings.find((x) => x.id === e.target.value);
                setSelectedBooking(b);
                setFormData({ ...formData, booking_id: e.target.value, refund_amount: b?.paid_amount?.toString() || "" });
              }}
              className="flex h-7 w-full rounded border border-input bg-white px-2 py-1 text-xs"
            >
              <option value="">--Select Booking--</option>
              {bookings.map((b) => (
                <option key={b.id} value={b.id}>{b.booking_number} - {b.customer_name}</option>
              ))}
            </select>
          </LegacyFormRow>
        )}
        {selectedBooking && (
          <>
            <div className="border border-[#c99] bg-white/60 p-3 text-sm space-y-1">
              <div><strong>Booking:</strong> {selectedBooking.booking_number}</div>
              <div><strong>Customer:</strong> {selectedBooking.customer_name}</div>
              <div><strong>Total Paid:</strong> Rs. {selectedBooking.paid_amount || 0}/-</div>
            </div>
            <LegacyFormRow label="Refund Amount" htmlFor="refund_amount" required>
              <Input
                id="refund_amount"
                type="number"
                step="0.01"
                required
                value={formData.refund_amount}
                onChange={(e) => setFormData({ ...formData, refund_amount: e.target.value })}
                className="bg-white"
              />
            </LegacyFormRow>
            <LegacyFormRow label="Refund Mode" htmlFor="refund_mode" required>
              <select
                id="refund_mode"
                required
                value={formData.refund_mode}
                onChange={(e) => setFormData({ ...formData, refund_mode: e.target.value })}
                className="flex h-7 w-full rounded border border-input bg-white px-2 py-1 text-xs"
              >
                <option value="">--Select--</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
              </select>
            </LegacyFormRow>
            <LegacyFormRow label="Reference No." htmlFor="reference_number">
              <Input
                id="reference_number"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                placeholder="Transaction/Cheque number"
                className="bg-white"
              />
            </LegacyFormRow>
            <LegacyFormRow label="Notes" htmlFor="notes">
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="bg-white text-xs"
              />
            </LegacyFormRow>
            <div className="flex justify-center gap-4 pt-2">
              <Button type="submit" className="px-8">Process Refund</Button>
              <Button type="button" variant="outline" onClick={closeForm} className="px-8">Cancel</Button>
            </div>
          </>
        )}
      </form>
    </LegacyFormPanel>
  ) : null;

  const tableContent = !showForm ? (
    <>
      <LegacyPanelHeader
        title="View Refunds"
        className="mb-3"
        right={
          <Button variant="link" className="text-white p-0 h-auto text-sm hover:text-white/80" onClick={() => setShowForm(true)}>
            Process Refund
          </Button>
        }
      />
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ backgroundColor: "#D4A59A" }}>
                  <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">S.No</th>
                  <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Date</th>
                  <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Booking No</th>
                  <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Customer</th>
                  <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Refund Amount</th>
                  <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Mode</th>
                  <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Reference</th>
                  <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="border border-[#c99] px-4 py-8 text-center text-muted-foreground">
                      No refunds found
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((refund, index) => (
                    <tr key={refund.id} style={{ backgroundColor: "#F5E6E0" }}>
                      <td className="border border-[#c99] px-3 py-2 text-xs align-top">{startIndex + index}</td>
                      <td className="border border-[#c99] px-3 py-2 text-xs align-top">{refund.refund_date ? new Date(refund.refund_date).toLocaleDateString() : "-"}</td>
                      <td className="border border-[#c99] px-3 py-2 text-xs align-top">{refund.bookings?.booking_number || "-"}</td>
                      <td className="border border-[#c99] px-3 py-2 text-xs align-top">{refund.bookings?.customer_name || "-"}</td>
                      <td className="border border-[#c99] px-3 py-2 text-xs align-top">Rs. {refund.refund_amount?.toFixed(2) || "0.00"}/-</td>
                      <td className="border border-[#c99] px-3 py-2 text-xs align-top">{refund.refund_mode || "-"}</td>
                      <td className="border border-[#c99] px-3 py-2 text-xs align-top">{refund.reference_number || "-"}</td>
                      <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                        <span style={{ color: "green", fontWeight: "bold" }}>Processed</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            totalItems={totalItems}
            startIndex={startIndex}
            endIndex={endIndex}
          />
        </CardContent>
      </Card>
    </>
  ) : null;

  if (!isAdminRoute) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Refunds Management" />
        <main className="p-4">{formContent || tableContent}</main>
      </div>
    );
  }

  return <>{formContent || tableContent}</>;
}
