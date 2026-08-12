import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { BookingReceipt } from "@/components/booking/BookingReceipt";
import { useAuth } from "@/hooks/useAuth";
import { ZoomableTable } from "@/components/ui/ZoomableTable";

const MAROON_LIGHT = "#c47a7e";
const ROW_ALT = "#f6f0f0";
const thStyle: React.CSSProperties = { border: "1px solid #a88", padding: "5px 8px", textAlign: "left", fontWeight: "bold", fontSize: 11, color: "#fff", backgroundColor: MAROON_LIGHT };
const tdStyle: React.CSSProperties = { border: "1px solid #ddd", padding: "5px 8px", fontSize: 11, color: "#606060", verticalAlign: "top" };
const actionStyle: React.CSSProperties = { color: "#c00", cursor: "pointer", fontSize: 10, display: "block", background: "none", border: "none", padding: 0, textAlign: "left", fontFamily: "Arial, Helvetica, sans-serif" };

export interface ServiceModuleConfig {
  /** Supabase table name, e.g. "visa_bookings" */
  table: string;
  /** Column holding the service name, e.g. "visa_name" */
  nameField: string;
  /** Column holding the service date, e.g. "visa_date" */
  dateField: string;
  /** Page title, e.g. "View Visa Details" */
  title: string;
  /** Label used inside the row, e.g. "Visa" */
  label: string;
  /** payment_type used when adding payments, e.g. "visa" */
  paymentType: "visa" | "cruise";
  /** serviceType for the details dialog */
  detailsServiceType: "visa" | "cruise";
}

export function ServiceModuleDetails({ config }: { config: ServiceModuleConfig }) {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [filters, setFilters] = useState<FilterValues>(getDefaultFilters());
  const [loading, setLoading] = useState(true);
  const { getUserName } = useProfilesMap();
  const paymentDialog = usePaymentDialog(() => fetchRows());
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedServiceData, setSelectedServiceData] = useState<any>(null);
  const [selectedBookingData, setSelectedBookingData] = useState<any>(null);
  const [printBookingId, setPrintBookingId] = useState<string | null>(null);

  const handlePrintBooking = (bookingId: string) => { setPrintBookingId(bookingId); setTimeout(() => window.print(), 800); };

  useEffect(() => { fetchRows(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [config.table]);

  const fetchRows = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from(config.table)
      .select(`*, bookings(id, booking_number, customer_name, email, status, contact_no, booking_type, created_at, notes, agent_id, created_by, total_amount, paid_amount, due_amount, agents(name))`)
      .order(config.dateField, { ascending: false });
    if (error) { toast.error(`Failed to load ${config.label.toLowerCase()} bookings`); } else { setRows(data || []); }
    setLoading(false);
  };

  const handleViewDetails = (row: any) => { setSelectedBookingData(row.bookings); setSelectedServiceData(row); setShowDetailsDialog(true); };

  const filteredRows = rows.filter(row => {
    if (filters.searchWithDate) {
      const d = new Date(row[config.dateField]);
      const f = new Date(`${filters.fromYear}-${filters.fromMonth}-${filters.fromDay}`);
      const t = new Date(`${filters.toYear}-${filters.toMonth}-${filters.toDay}`);
      if (d < f || d > t) return false;
    }
    if (filters.type && (row.bookings?.booking_type || "direct") !== filters.type) return false;
    if (filters.customer && !row.bookings?.customer_name?.toLowerCase().includes(filters.customer.toLowerCase())) return false;
    if (filters.reference && !row.bookings?.notes?.toLowerCase().includes(filters.reference.toLowerCase())) return false;
    if (filters.contact && !row.bookings?.contact_no?.toLowerCase().includes(filters.contact.toLowerCase())) return false;
    if (filters.email && !row.bookings?.email?.toLowerCase().includes(filters.email.toLowerCase())) return false;
    if (filters.user && row.bookings?.created_by !== filters.user) return false;
    if (filters.agentId && row.bookings?.agent_id !== filters.agentId) return false;
    return true;
  });

  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filteredRows);
  const totalBookingPrice = filteredRows.reduce((s, b) => s + (b.rate_per_person || 0), 0);
  const totalSellingPrice = filteredRows.reduce((s, b) => s + (b.total_amount || 0), 0);
  const netProfit = totalSellingPrice - totalBookingPrice;
  const totalReceivedPayment = filteredRows.reduce((s, b) => s + (b.paid_amount || 0), 0);
  const totalDuePayment = filteredRows.reduce((s, b) => s + (b.due_amount || 0), 0);

  return (
    <div style={{ padding: 12, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 }}>
      <div style={{ fontSize: 13, fontWeight: "bold", marginBottom: 8, color: "#333" }}>📋 {config.title}</div>

      <DetailPageFilters
        options={{ showType: true, showAgent: true, showUser: true, showCustomer: true, showReference: true, showContactEmail: true }}
        filters={filters}
        onFilterChange={setFilters}
        onSearch={fetchRows}
      />

      <ZoomableTable style={{ border: "1px solid #ccc", borderTop: "none" }}>
        {loading ? <div style={{ textAlign: "center", padding: 32, color: "#999" }}>Loading...</div> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif" }}>
            <thead><tr style={{ backgroundColor: MAROON_LIGHT, color: "#fff", fontWeight: "bold" }}>
              <th style={thStyle}>S.No.</th><th style={thStyle}>Type</th><th style={thStyle}>User</th><th style={thStyle}>Customer Details</th><th style={thStyle}>{config.label} Detail</th><th style={thStyle}>Date</th><th style={thStyle}>Actions</th>
            </tr></thead>
            <tbody>
              {paginatedItems.length === 0 ? (
                <tr><td colSpan={7} style={{ ...tdStyle, textAlign: "center", padding: 20, color: "#999" }}>No {config.label.toLowerCase()} bookings found</td></tr>
              ) : paginatedItems.map((row, idx) => (
                <tr key={row.id} style={{ backgroundColor: idx % 2 === 0 ? "#fff" : ROW_ALT }}>
                  <td style={tdStyle}>{startIndex + idx}</td>
                  <td style={tdStyle}>{row.bookings?.booking_type === "agent" ? <><div>Agent</div><div style={{ fontSize: 10 }}>{row.bookings?.agents?.name || ""}</div></> : "Direct"}</td>
                  <td style={tdStyle}>{getUserName(row.bookings?.created_by)}</td>
                  <td style={tdStyle}><div style={{ fontWeight: "bold" }}>{row.bookings?.customer_name || "-"}</div><div style={{ fontSize: 10 }}>Contact No.: {row.bookings?.contact_no || ""}</div></td>
                  <td style={tdStyle}>
                    <div><strong>No of Persons :</strong> {row.number_of_persons || 0}</div>
                    <div><strong>{config.label} Name :</strong> {row[config.nameField] || "-"}</div>
                    <div><strong>Booking Price :</strong> Rs. {(row.rate_per_person || 0).toLocaleString('en-IN')} /-</div>
                    <div><strong>Selling Price :</strong> Rs. {(row.total_amount || 0).toLocaleString('en-IN')} /-</div>
                    <div><strong>Total Received Payment :</strong> Rs. {(row.paid_amount || 0).toLocaleString('en-IN')} /-</div>
                    <div><strong>Due Payment :</strong> Rs. {(row.due_amount || 0).toLocaleString('en-IN')} /-</div>
                  </td>
                  <td style={tdStyle}>
                    <div><strong>Journey Date</strong></div><div>:{row[config.dateField] ? format(new Date(row[config.dateField]), "dd/MM/yyyy") : "-"}</div>
                    <div><strong>Booking Date</strong></div><div>:{row.bookings?.created_at ? format(new Date(row.bookings.created_at), "dd/MM/yyyy") : "-"}</div>
                  </td>
                  <td style={tdStyle}>
                    {(() => {
                      const b = row.bookings;
                      const isOwner = !!b && (b.created_by === user?.id || isAdmin());
                      const actions: { label: string; fn: () => void }[] = [
                        { label: "View Details", fn: () => handleViewDetails(row) },
                      ];
                      if (isOwner) {
                        actions.push(
                          { label: "Print Booking", fn: () => handlePrintBooking(b.id) },
                          { label: "Edit Booking", fn: () => navigate(`/bookings?edit=${b.id}`) },
                          { label: "Add Payment", fn: () => paymentDialog.handleAddPayment(b, { type: config.paymentType, id: row.id }) },
                          { label: "View Payment", fn: () => paymentDialog.handleViewPayment(b, { type: config.paymentType, id: row.id }) },
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

      <BookingDetailsDialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog} booking={selectedBookingData} serviceType={config.detailsServiceType} serviceData={selectedServiceData} />
      <PaymentDialogs showViewPaymentDialog={paymentDialog.showViewPaymentDialog} setShowViewPaymentDialog={paymentDialog.setShowViewPaymentDialog} showPaymentDialog={paymentDialog.showPaymentDialog} setShowPaymentDialog={paymentDialog.setShowPaymentDialog} selectedBooking={paymentDialog.selectedBooking} serviceTotals={paymentDialog.serviceTotals} bookingPayments={paymentDialog.bookingPayments} paymentAmount={paymentDialog.paymentAmount} setPaymentAmount={paymentDialog.setPaymentAmount} paymentMode={paymentDialog.paymentMode} setPaymentMode={paymentDialog.setPaymentMode} paymentReference={paymentDialog.paymentReference} setPaymentReference={paymentDialog.setPaymentReference} paymentCityId={paymentDialog.paymentCityId} setPaymentCityId={paymentDialog.setPaymentCityId} cities={paymentDialog.cities} isSubmittingPayment={paymentDialog.isSubmittingPayment} onSubmitPayment={paymentDialog.submitPayment} />
      {printBookingId && <BookingReceipt bookingId={printBookingId} />}
    </div>
  );
}
