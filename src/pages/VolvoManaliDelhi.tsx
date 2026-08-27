import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { DetailPageFilters, getDefaultFilters, FilterValues } from "@/components/ui/DetailPageFilters";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/TablePagination";
import { usePaymentDialog } from "@/hooks/usePaymentDialog";
import { PaymentDialogs } from "@/components/payment/PaymentDialogs";
import { BookingDetailsDialog } from "@/components/booking/BookingDetailsDialog";
import { BookingReceipt } from "@/components/booking/BookingReceipt";
import { useAuth } from "@/hooks/useAuth";
import { useProfilesMap } from "@/hooks/useProfilesMap";
import { ZoomableTable } from "@/components/ui/ZoomableTable";
import { LegacyPanelHeader } from "@/components/legacy/LegacyPanelHeader";
import { Button } from "@/components/ui/button";

const MAROON_LIGHT = "#D6A7A1";
const thStyle: React.CSSProperties = { padding: "2px 6px", textAlign: "left", fontWeight: "normal", fontSize: 13, color: "#000", backgroundColor: MAROON_LIGHT };
const tdStyle: React.CSSProperties = { padding: "2px 6px", fontSize: 13, color: "#7D7D7E", verticalAlign: "top" };
const actionStyle: React.CSSProperties = { color: "#996666", cursor: "pointer", fontSize: 12, fontWeight: "bold", display: "block", background: "none", border: "none", padding: 0, paddingLeft: 4, textAlign: "left", fontFamily: "Arial, Helvetica, sans-serif" };

export default function VolvoManaliDelhi() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { getUserName } = useProfilesMap();
  const [volvoBookings, setVolvoBookings] = useState<any[]>([]);
  const [transporters, setTransporters] = useState<any[]>([]);
  const [filters, setFilters] = useState<FilterValues>(getDefaultFilters());
  const [loading, setLoading] = useState(true);
  const paymentDialog = usePaymentDialog(() => fetchVolvoBookings());
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedServiceData, setSelectedServiceData] = useState<any>(null);
  const [selectedBookingData, setSelectedBookingData] = useState<any>(null);
  const [printBookingId, setPrintBookingId] = useState<string | null>(null);

  const handlePrintBooking = (bookingId: string) => { setPrintBookingId(bookingId); setTimeout(() => window.print(), 800); };

  useEffect(() => { fetchTransporters(); fetchVolvoBookings(); }, []);

  const fetchTransporters = async () => { const { data } = await supabase.from("transporters").select("id, name").order("name"); setTransporters(data || []); };
  const getTransporterName = (id: string | null) => { if (!id) return "-"; return transporters.find(t => t.id === id)?.name || "-"; };

  const fetchVolvoBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("volvo_bookings").select(`*, bookings(id, booking_number, customer_name, email, status, contact_no, booking_type, created_at, notes, agent_id, created_by, total_amount, paid_amount, due_amount, agents(name))`).eq("route", "manali_delhi").order("travel_date", { ascending: false });
    if (error) { toast.error("Failed to load Manali-Delhi volvo bookings"); } else { setVolvoBookings(data || []); }
    setLoading(false);
  };

  const handleViewDetails = (booking: any) => { setSelectedBookingData(booking.bookings); setSelectedServiceData(booking); setShowDetailsDialog(true); };

  const filteredBookings = volvoBookings.filter(booking => {
    if (filters.searchWithDate) { const d = new Date(booking.travel_date); const f = new Date(`${filters.fromYear}-${filters.fromMonth}-${filters.fromDay}`); const t = new Date(`${filters.toYear}-${filters.toMonth}-${filters.toDay}`); if (d < f || d > t) return false; }
    if (filters.type && (booking.bookings?.booking_type || "direct") !== filters.type) return false;
    if (filters.customer && !booking.bookings?.customer_name?.toLowerCase().includes(filters.customer.toLowerCase())) return false;
    if (filters.transporterId && booking.transporter_id !== filters.transporterId) return false;
    if (filters.ticketNo && !booking.ticket_number?.toLowerCase().includes(filters.ticketNo.toLowerCase())) return false;
    if (filters.reference && !booking.bookings?.notes?.toLowerCase().includes(filters.reference.toLowerCase())) return false;
    if (filters.contact && !booking.bookings?.contact_no?.toLowerCase().includes(filters.contact.toLowerCase())) return false;
    if (filters.email && !booking.bookings?.email?.toLowerCase().includes(filters.email.toLowerCase())) return false;
    if (filters.user && booking.bookings?.created_by !== filters.user) return false;
    return true;
  });

  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filteredBookings);
  const totalBookingPrice = filteredBookings.reduce((s, b) => s + (Number(b.rate_per_seat) || 0), 0);
  const totalSellingPrice = filteredBookings.reduce((s, b) => s + (Number(b.total_amount) || 0), 0);
  const netProfit = totalSellingPrice - totalBookingPrice;
  const totalReceivedPayment = filteredBookings.reduce((s, b) => s + (Number(b.paid_amount) || 0), 0);
  const totalDuePayment = filteredBookings.reduce((s, b) => s + (Number(b.due_amount) || 0), 0);

  return (
    <div style={{ padding: 12, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 }}>
      <LegacyPanelHeader
        title="Volvo Manali - Delhi Detail"
        className="mb-2"
        right={
          <Button
            variant="link"
            className="text-white p-0 h-auto text-sm hover:text-white/80"
            onClick={() => { setFilters(getDefaultFilters()); fetchVolvoBookings(); }}
          >
            View All Records
          </Button>
        }
      />

      <DetailPageFilters options={{ showType: true, showAgent: true, showUser: true, showCustomer: true, showReference: true, showTransporter: true, showTicketNo: true }} filters={filters} onFilterChange={setFilters} onSearch={fetchVolvoBookings} />

      <ZoomableTable style={{ border: "1px solid #ccc", borderTop: "none" }}>
        {loading ? <div style={{ textAlign: "center", padding: 32, color: "#999" }}>Loading...</div> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif" }}>
            <thead><tr style={{ backgroundColor: MAROON_LIGHT, color: "#000", fontWeight: "normal" }}>
              <th style={thStyle}>S.No.</th><th style={thStyle}>Type</th><th style={thStyle}>User</th><th style={thStyle}>Customer Details</th><th style={thStyle}>M - D Volvo Detail</th><th style={thStyle}>Date</th><th style={thStyle}>Actions</th>
            </tr></thead>
            <tbody>
              {paginatedItems.length === 0 ? (
                <tr><td colSpan={7} style={{ ...tdStyle, textAlign: "center", padding: 20, color: "#999" }}>No Manali-Delhi volvo bookings found</td></tr>
              ) : paginatedItems.map((booking, idx) => (
                <tr key={booking.id}>
                  <td style={tdStyle}>{startIndex + idx}</td>
                  <td style={tdStyle}>{booking.bookings?.booking_type === "agent" ? <><div>Agent</div><div style={{ fontSize: 10 }}>{booking.bookings?.agents?.name || ""}</div></> : "Direct"}</td>
                  <td style={tdStyle}>{getUserName(booking.bookings?.created_by)}</td>
                  <td style={tdStyle}><div style={{ fontWeight: "bold" }}>{booking.bookings?.customer_name || "-"}</div><div style={{ fontSize: 10 }}>Contact No.: {booking.bookings?.contact_no || ""}</div></td>
                  <td style={tdStyle}>
                    <div><strong>No of tickets :</strong> {booking.number_of_seats || 0}</div>
                    <div><strong>Ticket no :</strong> {booking.ticket_number || "-"}</div>
                    <div><strong>Seat no :</strong> {booking.seat_numbers || "-"}</div>
                    <div><strong>Transporter :</strong> {getTransporterName(booking.transporter_id)}</div>
                    <div><strong>Booking Price :</strong> Rs. {(booking.rate_per_seat || 0).toLocaleString('en-IN')} /-</div>
                    <div><strong>Selling Price :</strong> Rs. {(booking.total_amount || 0).toLocaleString('en-IN')} /-</div>
                    <div><strong>Total Received Payment :</strong> Rs. {(booking.paid_amount || 0).toLocaleString('en-IN')} /-</div>
                    <div><strong>Due Payment :</strong> Rs. {(booking.due_amount || 0).toLocaleString('en-IN')} /-</div>
                  </td>
                  <td style={tdStyle}>
                    <div><strong>Journey Date :</strong> {booking.travel_date ? format(new Date(booking.travel_date), "dd/MM/yyyy") : "-"}</div>
                    <div><strong>Booking Date :</strong> {booking.bookings?.created_at ? format(new Date(booking.bookings.created_at), "dd/MM/yyyy") : "-"}</div>
                  </td>
                  <td style={tdStyle}>
                    {(() => {
                      const b = booking.bookings;
                      const isOwner = !!b && (b.created_by === user?.id || isAdmin());
                      const actions: { label: string; fn: () => void }[] = [
                        { label: "View Details", fn: () => handleViewDetails(booking) },
                      ];
                      if (isOwner) {
                        actions.push(
                          { label: "Print Booking", fn: () => handlePrintBooking(b.id) },
                          { label: "Edit Booking", fn: () => navigate(`/bookings?edit=${b.id}`) },
                          { label: "Add Payment", fn: () => paymentDialog.handleAddPayment(b, { type: "volvo_md", id: booking.id }) },
                          { label: "View Payment", fn: () => paymentDialog.handleViewPayment(b, { type: "volvo_md", id: booking.id }) },
                        );
                      }
                      actions.push(
                        { label: "Refund Payment", fn: () => b && navigate(`/refunds?id=${b.id}`) },
                        { label: "View Refund Payment", fn: () => b && paymentDialog.handleViewPayment(b) },
                      );
                      return actions.map((a, i) => (
                        <button key={i} style={actionStyle} onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"} onMouseLeave={e => e.currentTarget.style.textDecoration = "none"} onClick={a.fn}>{a.label}</button>
                      ));
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ZoomableTable>


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

      <BookingDetailsDialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog} booking={selectedBookingData} serviceType="volvo_md" serviceData={selectedServiceData} />
      <PaymentDialogs showViewPaymentDialog={paymentDialog.showViewPaymentDialog} setShowViewPaymentDialog={paymentDialog.setShowViewPaymentDialog} showPaymentDialog={paymentDialog.showPaymentDialog} setShowPaymentDialog={paymentDialog.setShowPaymentDialog} selectedBooking={paymentDialog.selectedBooking} serviceTotals={paymentDialog.serviceTotals} bookingPayments={paymentDialog.bookingPayments} paymentAmount={paymentDialog.paymentAmount} setPaymentAmount={paymentDialog.setPaymentAmount} paymentMode={paymentDialog.paymentMode} setPaymentMode={paymentDialog.setPaymentMode} paymentReference={paymentDialog.paymentReference} setPaymentReference={paymentDialog.setPaymentReference} paymentCityId={paymentDialog.paymentCityId} setPaymentCityId={paymentDialog.setPaymentCityId} cities={paymentDialog.cities} isSubmittingPayment={paymentDialog.isSubmittingPayment} onSubmitPayment={paymentDialog.submitPayment} />
      {printBookingId && <BookingReceipt bookingId={printBookingId} />}
    </div>
  );
}
