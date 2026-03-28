import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfilesMap } from "@/hooks/useProfilesMap";
import { toast } from "sonner";
import { format } from "date-fns";
import { DetailPageFilters, getDefaultFilters, FilterValues } from "@/components/ui/DetailPageFilters";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/TablePagination";
import { usePaymentDialog } from "@/hooks/usePaymentDialog";
import { PaymentDialogs } from "@/components/payment/PaymentDialogs";
import { BookingDetailsDialog } from "@/components/booking/BookingDetailsDialog";

const MAROON = "#b44a50";
const MAROON_LIGHT = "#c47a7e";
const ROW_ALT = "#f6f0f0";
const thStyle: React.CSSProperties = { border: "1px solid #a88", padding: "5px 8px", textAlign: "left", fontWeight: "bold", fontSize: 11, color: "#fff", backgroundColor: MAROON_LIGHT };
const tdStyle: React.CSSProperties = { border: "1px solid #ddd", padding: "5px 8px", fontSize: 11, color: "#606060", verticalAlign: "top" };
const actionStyle: React.CSSProperties = { color: "#c00", cursor: "pointer", fontSize: 10, display: "block", background: "none", border: "none", padding: 0, textAlign: "left", fontFamily: "Arial, Helvetica, sans-serif" };

export default function SafariDetails() {
  const [safariBookings, setSafariBookings] = useState<any[]>([]);
  const [filters, setFilters] = useState<FilterValues>(getDefaultFilters());
  const [loading, setLoading] = useState(true);
  const { getUserName } = useProfilesMap();
  const paymentDialog = usePaymentDialog(() => fetchSafariBookings());
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedServiceData, setSelectedServiceData] = useState<any>(null);
  const [selectedBookingData, setSelectedBookingData] = useState<any>(null);

  useEffect(() => { fetchSafariBookings(); }, []);

  const fetchSafariBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("safari_bookings").select(`*, bookings(id, booking_number, customer_name, email, status, contact_no, booking_type, created_at, notes, agent_id, created_by, total_amount, paid_amount, due_amount, agents(name))`).order("safari_date", { ascending: false });
    if (error) { toast.error("Failed to load safari bookings"); } else { setSafariBookings(data || []); }
    setLoading(false);
  };

  const handleViewDetails = (booking: any) => { setSelectedBookingData(booking.bookings); setSelectedServiceData(booking); setShowDetailsDialog(true); };

  const filteredBookings = safariBookings.filter(booking => {
    if (filters.searchWithDate) { const d = new Date(booking.safari_date); const f = new Date(`${filters.fromYear}-${filters.fromMonth}-${filters.fromDay}`); const t = new Date(`${filters.toYear}-${filters.toMonth}-${filters.toDay}`); if (d < f || d > t) return false; }
    if (filters.type && (booking.bookings?.booking_type || "direct") !== filters.type) return false;
    if (filters.customer && !booking.bookings?.customer_name?.toLowerCase().includes(filters.customer.toLowerCase())) return false;
    if (filters.transporterId && booking.transporter_id !== filters.transporterId) return false;
    if (filters.reference && !booking.bookings?.notes?.toLowerCase().includes(filters.reference.toLowerCase())) return false;
    return true;
  });

  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filteredBookings);
  const totalBookingPrice = filteredBookings.reduce((s, b) => s + (b.rate_per_person || 0), 0);
  const totalSellingPrice = filteredBookings.reduce((s, b) => s + (b.total_amount || 0), 0);
  const netProfit = totalSellingPrice - totalBookingPrice;
  const totalReceivedPayment = filteredBookings.reduce((s, b) => s + (b.paid_amount || 0), 0);
  const totalDuePayment = filteredBookings.reduce((s, b) => s + (b.due_amount || 0), 0);

  return (
    <div style={{ padding: 12, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 }}>
      <div style={{ fontSize: 13, fontWeight: "bold", marginBottom: 8, color: "#333" }}>📋 View Safari Details</div>

      <DetailPageFilters options={{ showType: true, showAgent: true, showUser: true, showCustomer: true, showReference: true, showTransporter: true, showNoOfSafari: true }} filters={filters} onFilterChange={setFilters} onSearch={fetchSafariBookings} />

      <div style={{ border: "1px solid #ccc", borderTop: "none", overflowX: "auto" }}>
        {loading ? <div style={{ textAlign: "center", padding: 32, color: "#999" }}>Loading...</div> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif" }}>
            <thead><tr style={{ backgroundColor: MAROON_LIGHT, color: "#fff", fontWeight: "bold" }}>
              <th style={thStyle}>S.No.</th><th style={thStyle}>Type</th><th style={thStyle}>User</th><th style={thStyle}>Customer Details</th><th style={thStyle}>Safari Detail</th><th style={thStyle}>Date</th><th style={thStyle}>Actions</th>
            </tr></thead>
            <tbody>
              {paginatedItems.length === 0 ? (
                <tr><td colSpan={7} style={{ ...tdStyle, textAlign: "center", padding: 20, color: "#999" }}>No safari bookings found</td></tr>
              ) : paginatedItems.map((booking, idx) => (
                <tr key={booking.id} style={{ backgroundColor: idx % 2 === 0 ? "#fff" : ROW_ALT }}>
                  <td style={tdStyle}>{startIndex + idx + 1}</td>
                  <td style={tdStyle}>{booking.bookings?.booking_type === "agent" ? <><div>Agent</div><div style={{ fontSize: 10 }}>{booking.bookings?.agents?.name || ""}</div></> : "Direct"}</td>
                  <td style={tdStyle}>{getUserName(booking.bookings?.created_by)}</td>
                  <td style={tdStyle}><div style={{ fontWeight: "bold" }}>{booking.bookings?.customer_name || "-"}</div><div style={{ fontSize: 10 }}>Contact No.: {booking.bookings?.contact_no || ""}</div></td>
                  <td style={tdStyle}>
                    <div><strong>No of Persons :</strong> {booking.number_of_persons || 0}</div>
                    <div><strong>Safari Name :</strong> {booking.safari_name || "-"}</div>
                    <div><strong>Booking Price :</strong> Rs. {(booking.rate_per_person || 0).toLocaleString('en-IN')} /-</div>
                    <div><strong>Selling Price :</strong> Rs. {(booking.total_amount || 0).toLocaleString('en-IN')} /-</div>
                    <div><strong>Total Received Payment :</strong> Rs. {(booking.paid_amount || 0).toLocaleString('en-IN')} /-</div>
                    <div><strong>Due Payment :</strong> Rs. {(booking.due_amount || 0).toLocaleString('en-IN')} /-</div>
                  </td>
                  <td style={tdStyle}>
                    <div><strong>Journey Date</strong></div><div>:{booking.safari_date ? format(new Date(booking.safari_date), "dd/MM/yyyy") : "-"}</div>
                    <div><strong>Booking Date</strong></div><div>:{booking.bookings?.created_at ? format(new Date(booking.bookings.created_at), "dd/MM/yyyy") : "-"}</div>
                  </td>
                  <td style={tdStyle}>
                    <button style={actionStyle} onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"} onMouseLeave={e => e.currentTarget.style.textDecoration = "none"} onClick={() => handleViewDetails(booking)}>View Details</button>
                    <button style={actionStyle} onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"} onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}>Refund Payment</button>
                    <button style={actionStyle} onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"} onMouseLeave={e => e.currentTarget.style.textDecoration = "none"} onClick={() => booking.bookings && paymentDialog.handleViewPayment(booking.bookings)}>View Refund Payment</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary Footer */}
      <div style={{ padding: "8px 10px", border: "1px solid #ccc", borderTop: "none", backgroundColor: "#fff", fontSize: 11 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 32px" }}>
          <span><strong>Total Booking Price :</strong> Rs. {totalBookingPrice.toLocaleString("en-IN")} /-</span>
          <span><strong>Total Selling Price :</strong> Rs. {totalSellingPrice.toLocaleString("en-IN")} /-</span>
          <span><strong>Net Profit :</strong> Rs. {netProfit.toLocaleString("en-IN")} /-</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 32px", marginTop: 2 }}>
          <span><strong>Total Received Payment :</strong> Rs. {totalReceivedPayment.toLocaleString("en-IN")} /-</span>
          <span><strong>Total Due Payment :</strong> Rs. {totalDuePayment.toLocaleString("en-IN")} /-</span>
        </div>
      </div>

      <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} totalItems={totalItems} startIndex={startIndex} endIndex={endIndex} />

      <BookingDetailsDialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog} booking={selectedBookingData} serviceType="safari" serviceData={selectedServiceData} />
      <PaymentDialogs showViewPaymentDialog={paymentDialog.showViewPaymentDialog} setShowViewPaymentDialog={paymentDialog.setShowViewPaymentDialog} showPaymentDialog={paymentDialog.showPaymentDialog} setShowPaymentDialog={paymentDialog.setShowPaymentDialog} selectedBooking={paymentDialog.selectedBooking} bookingPayments={paymentDialog.bookingPayments} paymentAmount={paymentDialog.paymentAmount} setPaymentAmount={paymentDialog.setPaymentAmount} paymentMode={paymentDialog.paymentMode} setPaymentMode={paymentDialog.setPaymentMode} paymentReference={paymentDialog.paymentReference} setPaymentReference={paymentDialog.setPaymentReference} isSubmittingPayment={paymentDialog.isSubmittingPayment} onSubmitPayment={paymentDialog.submitPayment} />
    </div>
  );
}
