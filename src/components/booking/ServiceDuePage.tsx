import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { BookingDetailsDialog } from "@/components/booking/BookingDetailsDialog";
import { PartsDatePicker } from "@/components/ui/PartsDatePicker";
import { usePaymentDialog } from "@/hooks/usePaymentDialog";
import { PaymentDialogs } from "@/components/payment/PaymentDialogs";
import { useAuth } from "@/hooks/useAuth";
import { useProfilesMap } from "@/hooks/useProfilesMap";

export interface ServiceDuePageConfig {
  table: string;
  serviceType: "safari" | "vehicle" | "hotel" | "volvo_dm" | "volvo_md" | "visa" | "cruise";
  nameField: string;
  dateField: string;
  title: string;
  label: string;
  allRecordsPath: string;
}

export function ServiceDuePage({ config }: { config: ServiceDuePageConfig }) {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { getUserName } = useProfilesMap();
  const [rows, setRows] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showViewDetailDialog, setShowViewDetailDialog] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const paymentDialog = usePaymentDialog(() => fetchRows());

  const [filters, setFilters] = useState({
    fromMonth: "", fromDay: "", fromYear: "",
    toMonth: "", toDay: "", toYear: "",
    type: "", agentName: "", user: "", customer: "", contactNo: "", email: "", reference: "",
    searchWithDate: false,
  });

  useEffect(() => {
    fetchRows();
    (async () => {
      const [a, p] = await Promise.all([
        supabase.from("agents").select("id, name").order("name"),
        supabase.from("profiles").select("id, username, first_name, last_name").order("username"),
      ]);
      setAgents(a.data || []);
      setUsers(p.data || []);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.table]);

  const fetchRows = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from(config.table)
      .select("*, bookings(id, booking_number, customer_name, email, status, contact_no, address, booking_type, adults, children, check_in_date, check_out_date, notes, reference, created_at, created_by, agent_id, agents(name))")
      .gt("due_amount", 0)
      .order(config.dateField, { ascending: true });
    if (error) toast.error(`Failed to load ${config.label} due amounts`);
    setRows(data || []);
    setLoading(false);
  };

  const filtered = rows.filter((r) => {
    const b = r.bookings;
    if (filters.type && (b?.booking_type || "direct") !== filters.type) return false;
    if (filters.agentName && b?.agent_id !== filters.agentName) return false;
    if (filters.user && b?.created_by !== filters.user) return false;
    if (filters.customer && !String(b?.customer_name || "").toLowerCase().includes(filters.customer.toLowerCase())) return false;
    if (filters.contactNo && !String(b?.contact_no || "").toLowerCase().includes(filters.contactNo.toLowerCase())) return false;
    if (filters.email && !String(b?.email || "").toLowerCase().includes(filters.email.toLowerCase())) return false;
    if (filters.reference && !String(b?.reference || "").toLowerCase().includes(filters.reference.toLowerCase())) return false;
    if (filters.searchWithDate && filters.fromYear && filters.fromMonth && filters.fromDay) {
      const from = new Date(`${filters.fromYear}-${filters.fromMonth.padStart(2, "0")}-${filters.fromDay.padStart(2, "0")}`);
      const d = new Date(r[config.dateField]);
      if (d < from) return false;
      if (filters.toYear && filters.toMonth && filters.toDay) {
        const to = new Date(`${filters.toYear}-${filters.toMonth.padStart(2, "0")}-${filters.toDay.padStart(2, "0")}`);
        if (d > to) return false;
      }
    }
    return true;
  });

  const totalBookingPrice = filtered.reduce((s, r) => s + (Number(r.rate_per_person) || 0), 0);
  const totalSellingPrice = filtered.reduce((s, r) => s + (Number(r.total_amount) || 0), 0);
  const netProfit = totalSellingPrice - totalBookingPrice;
  const totalReceivedPayment = filtered.reduce((s, r) => s + (Number(r.paid_amount) || 0), 0);
  const totalDuePayment = filtered.reduce((s, r) => s + (Number(r.due_amount) || 0), 0);

  const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-GB") : "-");

  return (
    <div className="min-h-screen bg-background">
      <Header title={config.title} />
      <main className="p-4">
        <div className="flex justify-between items-center px-4 py-2 mb-3" style={{ backgroundColor: "#1e6e99" }}>
          <span className="text-white font-semibold text-sm">{config.title}</span>
          <Button variant="link" className="text-white p-0 h-auto text-sm hover:text-white/80" onClick={() => navigate(config.allRecordsPath)}>
            View All Records
          </Button>
        </div>

        <div className="mb-3 border border-border bg-muted/50">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-2 py-1.5 border-b border-border">
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground">From :</span>
              <PartsDatePicker month={filters.fromMonth} day={filters.fromDay} year={filters.fromYear} onChange={(p) => setFilters({ ...filters, fromMonth: p.month, fromDay: p.day, fromYear: p.year })} />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground">To :</span>
              <PartsDatePicker month={filters.toMonth} day={filters.toDay} year={filters.toYear} onChange={(p) => setFilters({ ...filters, toMonth: p.month, toDay: p.day, toYear: p.year })} />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground">Search with Date :</span>
              <label className="flex items-center gap-0.5 text-[11px]"><input type="radio" name="searchWithDate" checked={filters.searchWithDate} onChange={() => setFilters({ ...filters, searchWithDate: true })} className="w-3 h-3" />YES</label>
              <label className="flex items-center gap-0.5 text-[11px]"><input type="radio" name="searchWithDate" checked={!filters.searchWithDate} onChange={() => setFilters({ ...filters, searchWithDate: false })} className="w-3 h-3" />NO</label>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-2 py-1.5 border-b border-border">
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground">Type :</span>
              <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className="h-5 text-[11px] border border-input bg-background px-1 rounded-sm">
                <option value="">--Select--</option>
                <option value="agent">Agent</option>
                <option value="direct">Direct</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground">Agent Name :</span>
              <select value={filters.agentName} onChange={(e) => setFilters({ ...filters, agentName: e.target.value })} className="h-5 text-[11px] border border-input bg-background px-1 min-w-[120px] rounded-sm">
                <option value="">--Select--</option>
                {agents.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground">Reference :</span>
              <input value={filters.reference} onChange={(e) => setFilters({ ...filters, reference: e.target.value })} className="h-5 w-28 text-[11px] border border-input bg-background px-1 rounded-sm" />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-2 py-1.5">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-muted-foreground">User :</span>
                <select value={filters.user} onChange={(e) => setFilters({ ...filters, user: e.target.value })} className="h-5 text-[11px] border border-input bg-background px-1 min-w-[100px] rounded-sm">
                  <option value="">--Select--</option>
                  {users.map((u) => (<option key={u.id} value={u.id}>{u.username || `${u.first_name || ""} ${u.last_name || ""}`.trim() || "Unknown"}</option>))}
                </select>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-muted-foreground">Customer :</span>
                <input value={filters.customer} onChange={(e) => setFilters({ ...filters, customer: e.target.value })} className="h-5 w-28 text-[11px] border border-input bg-background px-1 rounded-sm" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-muted-foreground">Contact No :</span>
                <input value={filters.contactNo} onChange={(e) => setFilters({ ...filters, contactNo: e.target.value })} className="h-5 w-28 text-[11px] border border-input bg-background px-1 rounded-sm" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-muted-foreground">Email :</span>
                <input value={filters.email} onChange={(e) => setFilters({ ...filters, email: e.target.value })} className="h-5 w-32 text-[11px] border border-input bg-background px-1 rounded-sm" />
              </div>
            </div>
            <button onClick={fetchRows} className="h-6 px-4 text-[11px] bg-primary text-primary-foreground border border-primary/80 hover:bg-primary/90 rounded-sm">Search</button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ backgroundColor: "#D4A59A" }}>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">S.No.</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Type</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">User</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Customer Details</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">{config.label} Details</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Date</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="border border-[#c99] px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={7} className="border border-[#c99] px-4 py-8 text-center text-muted-foreground">No {config.label.toLowerCase()} due amounts found</td></tr>
                  ) : (
                    filtered.map((r, index) => {
                      const b = r.bookings;
                      const isOwner = !!b && (b.created_by === user?.id || isAdmin());
                      return (
                        <tr key={r.id} style={{ backgroundColor: "#F5E6E0" }}>
                          <td className="border border-[#c99] px-3 py-2 text-xs align-top">{index + 1}</td>
                          <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                            <div className="capitalize">{b?.booking_type || "Direct"}</div>
                            <div className="text-muted-foreground">{b?.agents?.name || ""}</div>
                          </td>
                          <td className="border border-[#c99] px-3 py-2 text-xs align-top">{getUserName(b?.created_by)}</td>
                          <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                            <div className="font-medium">{b?.customer_name || "-"}</div>
                            {b?.address && <div className="text-muted-foreground">{b.address}</div>}
                            <div className="text-muted-foreground">Contact No.: {b?.contact_no || ""}</div>
                          </td>
                          <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                            <div><strong>{config.label} Name :</strong> {r[config.nameField] || "-"}</div>
                            <div><strong>No of Persons :</strong> {r.number_of_persons || 1}</div>
                            <div><strong>Booking Price :</strong> Rs. {(r.rate_per_person || 0).toLocaleString("en-IN")}/-</div>
                            <div><strong>Selling Price :</strong> Rs. {(r.total_amount || 0).toLocaleString("en-IN")}/-</div>
                            <div><strong>Total Received Payment :</strong> Rs. {(r.paid_amount || 0).toLocaleString("en-IN")}/-</div>
                            <div className="text-destructive"><strong>Due Payment :</strong> Rs. {(r.due_amount || 0).toLocaleString("en-IN")}/-</div>
                          </td>
                          <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                            <div><strong>Booking Date :</strong> {fmt(b?.created_at)}</div>
                            <div><strong>{config.label} Date :</strong> {fmt(r[config.dateField])}</div>
                          </td>
                          <td className="border border-[#c99] px-3 py-2 align-top">
                            <div className="flex flex-col gap-0.5">
                              <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => { setSelectedRow(r); setShowViewDetailDialog(true); }}>View Details</Button>
                              {isOwner && (
                                <>
                                  <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => navigate(`/bookings/${b.id}`)}>Print Booking</Button>
                                  <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => navigate(`/bookings?edit=${b.id}`)}>Edit Booking</Button>
                                  <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => paymentDialog.handleAddPayment(b, { type: config.serviceType, id: r.id })}>Add Payment</Button>
                                  <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => paymentDialog.handleViewPayment(b, { type: config.serviceType, id: r.id })}>View Payment</Button>
                                </>
                              )}
                              <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => b && navigate(`/refunds?id=${b.id}`)}>Refund Payment</Button>
                              <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => b && paymentDialog.handleViewPayment(b)}>View Refund Payment</Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t" style={{ backgroundColor: "#fff", borderColor: "#ccc", fontSize: 11 }}>
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
          </CardContent>
        </Card>

        <BookingDetailsDialog
          open={showViewDetailDialog}
          onOpenChange={setShowViewDetailDialog}
          booking={selectedRow?.bookings}
          serviceType={config.serviceType}
          serviceData={selectedRow}
        />

        <PaymentDialogs
          showViewPaymentDialog={paymentDialog.showViewPaymentDialog}
          setShowViewPaymentDialog={paymentDialog.setShowViewPaymentDialog}
          showPaymentDialog={paymentDialog.showPaymentDialog}
          setShowPaymentDialog={paymentDialog.setShowPaymentDialog}
          selectedBooking={paymentDialog.selectedBooking}
          serviceTotals={paymentDialog.serviceTotals}
          bookingPayments={paymentDialog.bookingPayments}
          paymentAmount={paymentDialog.paymentAmount}
          setPaymentAmount={paymentDialog.setPaymentAmount}
          paymentMode={paymentDialog.paymentMode}
          setPaymentMode={paymentDialog.setPaymentMode}
          paymentReference={paymentDialog.paymentReference}
          setPaymentReference={paymentDialog.setPaymentReference}
          paymentCityId={paymentDialog.paymentCityId}
          setPaymentCityId={paymentDialog.setPaymentCityId}
          cities={paymentDialog.cities}
          isSubmittingPayment={paymentDialog.isSubmittingPayment}
          onSubmitPayment={paymentDialog.submitPayment}
        />
      </main>
    </div>
  );
}
