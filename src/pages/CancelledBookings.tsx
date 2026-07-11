import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow, ThemedActionLink, filterInputStyle } from "@/components/admin/AdminPageShell";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";

export default function CancelledBookings() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const [bookings, setBookings] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);

  const [filters, setFilters] = useState({
    fromMonth: "",
    fromDay: "",
    fromYear: "",
    toMonth: "",
    toDay: "",
    toYear: "",
    searchWithDate: false,
    customer: "",
    bookingNo: "",
    agentId: "",
    reason: "",
  });

  const months = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  useEffect(() => {
    fetchCancelledBookings();
    fetchAgents();
  }, []);

  const fetchCancelledBookings = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*, agents(name), cancellations(*)")
      .eq("status", "cancelled")
      .order("updated_at", { ascending: false });
    if (error) { toast.error("Failed to load cancelled bookings"); } else { setBookings(data || []); }
  };

  const fetchAgents = async () => {
    const { data } = await supabase.from("agents").select("id, name").order("name");
    setAgents(data || []);
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (filters.customer && !b.customer_name?.toLowerCase().includes(filters.customer.toLowerCase())) return false;
      if (filters.bookingNo && !b.booking_number?.toLowerCase().includes(filters.bookingNo.toLowerCase())) return false;
      if (filters.agentId && b.agent_id !== filters.agentId) return false;
      if (filters.reason) {
        const r = b.cancellations?.[0]?.cancellation_reason?.toLowerCase() || "";
        if (!r.includes(filters.reason.toLowerCase())) return false;
      }
      if (filters.searchWithDate) {
        const dStr = b.updated_at || b.check_in_date;
        if (!dStr) return false;
        const d = new Date(dStr);
        if (filters.fromYear || filters.fromMonth || filters.fromDay) {
          const fy = parseInt(filters.fromYear) || d.getFullYear();
          const fm = filters.fromMonth ? parseInt(filters.fromMonth) - 1 : 0;
          const fd = filters.fromDay ? parseInt(filters.fromDay) : 1;
          if (d < new Date(fy, fm, fd)) return false;
        }
        if (filters.toYear || filters.toMonth || filters.toDay) {
          const ty = parseInt(filters.toYear) || d.getFullYear();
          const tm = filters.toMonth ? parseInt(filters.toMonth) - 1 : 11;
          const td = filters.toDay ? parseInt(filters.toDay) : 31;
          if (d > new Date(ty, tm, td, 23, 59, 59)) return false;
        }
      }
      return true;
    });
  }, [bookings, filters]);

  const pagination = usePagination(filteredBookings);

  useEffect(() => { pagination.resetPage(); }, [filters]);

  const resetFilters = () => setFilters({
    fromMonth: "", fromDay: "", fromYear: "", toMonth: "", toDay: "", toYear: "",
    searchWithDate: false, customer: "", bookingNo: "", agentId: "", reason: "",
  });

  const selectClass = "h-5 text-[11px] border border-input bg-background px-1 rounded-sm";
  const inputClass = "h-5 text-[11px] border border-input bg-background px-1 rounded-sm";

  const renderTable = () => (
    <AdminPageShell
      title="Cancelled Bookings"
      pagination={{
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
        onPageChange: pagination.goToPage,
        totalItems: pagination.totalItems,
        startIndex: pagination.startIndex,
        endIndex: pagination.endIndex,
      }}
    >
      <ThemedTable>
        <ThemedTHead>
          <ThemedTH>S.No</ThemedTH>
          <ThemedTH>Booking No</ThemedTH>
          <ThemedTH>Customer</ThemedTH>
          <ThemedTH>Contact</ThemedTH>
          <ThemedTH>Agent</ThemedTH>
          <ThemedTH>Check-in</ThemedTH>
          <ThemedTH>Check-out</ThemedTH>
          <ThemedTH>Total</ThemedTH>
          <ThemedTH>Paid</ThemedTH>
          <ThemedTH>Reason</ThemedTH>
          <ThemedTH>Action</ThemedTH>
        </ThemedTHead>
        <tbody>
          {pagination.paginatedItems.length === 0 ? (
            <ThemedEmptyRow colSpan={11} message="No cancelled bookings found" />
          ) : (
            pagination.paginatedItems.map((booking, index) => (
              <ThemedTR key={booking.id} index={index}>
                <ThemedTD>{pagination.startIndex + index}</ThemedTD>
                <ThemedTD>{booking.booking_number}</ThemedTD>
                <ThemedTD>{booking.customer_name || "-"}</ThemedTD>
                <ThemedTD>{booking.contact_no || "-"}</ThemedTD>
                <ThemedTD>{booking.agents?.name || "Direct"}</ThemedTD>
                <ThemedTD>{booking.check_in_date ? new Date(booking.check_in_date).toLocaleDateString() : "-"}</ThemedTD>
                <ThemedTD>{booking.check_out_date ? new Date(booking.check_out_date).toLocaleDateString() : "-"}</ThemedTD>
                <ThemedTD>Rs. {booking.total_amount?.toLocaleString() || 0}/-</ThemedTD>
                <ThemedTD>Rs. {booking.paid_amount?.toLocaleString() || 0}/-</ThemedTD>
                <ThemedTD>{booking.cancellations?.[0]?.cancellation_reason || "-"}</ThemedTD>
                <ThemedTD>
                  {booking.paid_amount > 0 && (
                    <ThemedActionLink onClick={() => navigate(isAdminRoute ? `/admin/refund-payments?id=${booking.id}` : `/refunds?id=${booking.id}`)}>
                      Process Refund
                    </ThemedActionLink>
                  )}
                </ThemedTD>
              </ThemedTR>
            ))
          )}
        </tbody>
      </ThemedTable>
    </AdminPageShell>
  );

  const filterPanel = (
    <div className="mb-3 border border-border bg-muted/50">
      {/* Row 1: Dates */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-2 py-1.5 border-b border-border">
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-muted-foreground">From :</span>
          <select value={filters.fromMonth} onChange={(e) => setFilters({ ...filters, fromMonth: e.target.value })} className={selectClass}>
            <option value="">Month</option>
            {months.map((m) => <option key={m} value={m}>{monthNames[parseInt(m) - 1]}</option>)}
          </select>
          <select value={filters.fromDay} onChange={(e) => setFilters({ ...filters, fromDay: e.target.value })} className={selectClass}>
            <option value="">Day</option>
            {days.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <input type="text" placeholder="Year" value={filters.fromYear} onChange={(e) => setFilters({ ...filters, fromYear: e.target.value })} className={`${inputClass} w-14`} />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-muted-foreground">To :</span>
          <select value={filters.toMonth} onChange={(e) => setFilters({ ...filters, toMonth: e.target.value })} className={selectClass}>
            <option value="">Month</option>
            {months.map((m) => <option key={m} value={m}>{monthNames[parseInt(m) - 1]}</option>)}
          </select>
          <select value={filters.toDay} onChange={(e) => setFilters({ ...filters, toDay: e.target.value })} className={selectClass}>
            <option value="">Day</option>
            {days.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <input type="text" placeholder="Year" value={filters.toYear} onChange={(e) => setFilters({ ...filters, toYear: e.target.value })} className={`${inputClass} w-14`} />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-muted-foreground">Search with Date :</span>
          <label className="flex items-center gap-0.5 text-[11px]">
            <input type="radio" name="cbSearchWithDate" checked={filters.searchWithDate} onChange={() => setFilters({ ...filters, searchWithDate: true })} className="w-3 h-3" />
            YES
          </label>
          <label className="flex items-center gap-0.5 text-[11px]">
            <input type="radio" name="cbSearchWithDate" checked={!filters.searchWithDate} onChange={() => setFilters({ ...filters, searchWithDate: false })} className="w-3 h-3" />
            NO
          </label>
        </div>
      </div>

      {/* Row 2: Booking / Customer / Agent / Reason */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-2 py-1.5 border-b border-border">
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-muted-foreground">Booking No :</span>
          <input value={filters.bookingNo} onChange={(e) => setFilters({ ...filters, bookingNo: e.target.value })} className={`${inputClass} w-32`} />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-muted-foreground">Customer :</span>
          <input value={filters.customer} onChange={(e) => setFilters({ ...filters, customer: e.target.value })} className={`${inputClass} w-32`} />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-muted-foreground">Agent :</span>
          <select value={filters.agentId} onChange={(e) => setFilters({ ...filters, agentId: e.target.value })} className={`${selectClass} min-w-[120px]`}>
            <option value="">--Select--</option>
            {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-muted-foreground">Reason :</span>
          <input value={filters.reason} onChange={(e) => setFilters({ ...filters, reason: e.target.value })} className={`${inputClass} w-32`} />
        </div>
      </div>

      {/* Row 3: Actions + totals */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-2 py-1.5">
        <Button variant="outline" size="sm" className="h-6 text-[11px] px-3" onClick={resetFilters}>Reset</Button>
        <span className="text-[11px] text-muted-foreground ml-auto font-semibold">
          Total Cancelled: {filteredBookings.length}
        </span>
      </div>
    </div>
  );

  const body = (
    <main className="p-4">
      {/* Blue Header Bar */}
      <div className="flex justify-between items-center px-4 py-2 mb-3" style={{ backgroundColor: "#1e6e99" }}>
        <span className="text-white font-semibold text-sm">Cancelled Bookings</span>
        <button
          onClick={() => navigate(isAdminRoute ? "/admin/bookings" : "/bookings")}
          className="text-white hover:underline text-sm bg-transparent border-0 cursor-pointer"
        >
          View All Records
        </button>
      </div>
      {filterPanel}
      {renderTable()}
    </main>
  );

  if (!isAdminRoute) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Cancelled Bookings" />
        {body}
      </div>
    );
  }

  return body;
}
