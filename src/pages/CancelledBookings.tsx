import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { usePagination } from "@/hooks/usePagination";
import { Header } from "@/components/layout/Header";
import { LegacyDatePicker } from "@/components/ui/LegacyDatePicker";
import { formatDisplayDate } from "@/utils/dateFormat";

export default function CancelledBookings() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const [bookings, setBookings] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  const today = new Date().toISOString().slice(0, 10);
  const [filters, setFilters] = useState({
    from: today,
    to: today,
    searchWithDate: false,
    type: "",
    agentId: "",
    reference: "",
    hotelId: "",
    roomType: "",
    customer: "",
    packageType: "",
    ticketNo: "",
  });

  useEffect(() => {
    fetchCancelledBookings();
    fetchAgents();
    fetchHotels();
    fetchRooms();
  }, []);

  const fetchCancelledBookings = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*, agents(name), cancellations(*), hotel_bookings(*, own_hotels(name), another_hotels(name))")
      .eq("status", "cancelled")
      .order("updated_at", { ascending: false });
    if (error) toast.error("Failed to load cancelled bookings");
    else setBookings(data || []);
  };

  const fetchAgents = async () => {
    const { data } = await supabase.from("agents").select("id, name").order("name");
    setAgents(data || []);
  };
  const fetchHotels = async () => {
    const { data } = await supabase.from("own_hotels").select("id, name").order("name");
    setHotels(data || []);
  };
  const fetchRooms = async () => {
    const { data } = await supabase.from("rooms").select("room_type").order("room_type");
    const unique = Array.from(new Set((data || []).map((r: any) => r.room_type).filter(Boolean)));
    setRooms(unique.map((r) => ({ room_type: r })));
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (filters.customer && !b.customer_name?.toLowerCase().includes(filters.customer.toLowerCase())) return false;
      if (filters.reference && !(b.reference || "").toLowerCase().includes(filters.reference.toLowerCase())) return false;
      if (filters.ticketNo && !(b.booking_number || "").toLowerCase().includes(filters.ticketNo.toLowerCase())) return false;
      if (filters.agentId && b.agent_id !== filters.agentId) return false;
      if (filters.type === "Direct" && b.agent_id) return false;
      if (filters.type === "Agent" && !b.agent_id) return false;
      if (filters.hotelId) {
        const hb = b.hotel_bookings || [];
        if (!hb.some((h: any) => h.own_hotel_id === filters.hotelId)) return false;
      }
      if (filters.roomType) {
        const hb = b.hotel_bookings || [];
        if (!hb.some((h: any) => h.room_type === filters.roomType)) return false;
      }
      if (filters.searchWithDate && filters.from && filters.to) {
        const d = (b.updated_at || b.check_in_date || "").slice(0, 10);
        if (!d) return false;
        if (d < filters.from || d > filters.to) return false;
      }
      return true;
    });
  }, [bookings, filters]);

  const pagination = usePagination(filteredBookings);
  useEffect(() => { pagination.resetPage(); }, [filters]);

  const getTypeLabel = (b: any) =>
    b.agent_id ? `Agent (${b.agents?.name || ""})` : "Direct";

  const getHotelName = (b: any) => {
    const hb = b.hotel_bookings?.[0];
    return hb?.own_hotels?.name || hb?.another_hotels?.name || "";
  };
  const getRoomName = (b: any) => b.hotel_bookings?.[0]?.room_type || "";
  const getRoomsCount = (b: any) =>
    (b.hotel_bookings || []).reduce((s: number, h: any) => s + (h.number_of_rooms || 0), 0);

  const filterCellStyle = { backgroundColor: "#F5E6E0" };
  const smallSelect = "border border-gray-400 bg-white h-[22px] text-[12px] px-1 leading-none";
  const smallInput = "border border-gray-400 bg-white h-[22px] text-[12px] px-1 leading-none";
  const labelStyle = "text-[12px] text-gray-800 whitespace-nowrap";

  const content = (
    <main className="p-4">
      <div className="border border-gray-300">
        {/* Blue Header */}
        <div className="flex justify-between items-center px-4 py-2" style={{ backgroundColor: "#1e6e99" }}>
          <span className="text-white font-semibold text-[14px]">View Cancel Booking</span>
          <button
            onClick={() => navigate(isAdminRoute ? "/admin/bookings" : "/bookings")}
            className="text-white hover:underline text-[14px] bg-transparent border-0 cursor-pointer font-semibold"
          >
            View All Records
          </button>
        </div>

        {/* Filter Panel */}
        <div className="p-3 space-y-2" style={filterCellStyle}>
          {/* Row 1 */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            <div className="flex items-center gap-2">
              <span className={labelStyle}>From :</span>
              <LegacyDatePicker value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <span className={labelStyle}>To :</span>
              <LegacyDatePicker value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <span className={labelStyle}>Search with Date :</span>
              <label className="flex items-center gap-1 text-[12px]">
                <input type="radio" checked={filters.searchWithDate} onChange={() => setFilters({ ...filters, searchWithDate: true })} /> YES
              </label>
              <label className="flex items-center gap-1 text-[12px]">
                <input type="radio" checked={!filters.searchWithDate} onChange={() => setFilters({ ...filters, searchWithDate: false })} /> NO
              </label>
            </div>
          </div>

          {/* Row 2 */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            <div className="flex items-center gap-2">
              <span className={labelStyle}>Type :</span>
              <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className={`${smallSelect} min-w-[110px]`}>
                <option value="">--Select--</option>
                <option value="Direct">Direct</option>
                <option value="Agent">Agent</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className={labelStyle}>Agent Name :</span>
              <select value={filters.agentId} onChange={(e) => setFilters({ ...filters, agentId: e.target.value })} className={`${smallSelect} min-w-[180px]`}>
                <option value="">--Select--</option>
                {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className={labelStyle}>Reference :</span>
              <input value={filters.reference} onChange={(e) => setFilters({ ...filters, reference: e.target.value })} className={`${smallInput} w-[220px]`} />
            </div>
          </div>

          {/* Row 3 */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            <div className="flex items-center gap-2">
              <span className={labelStyle}>Hotel :</span>
              <select value={filters.hotelId} onChange={(e) => setFilters({ ...filters, hotelId: e.target.value })} className={`${smallSelect} min-w-[180px]`}>
                <option value="">--Select--</option>
                {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className={labelStyle}>Room :</span>
              <select value={filters.roomType} onChange={(e) => setFilters({ ...filters, roomType: e.target.value })} className={`${smallSelect} min-w-[180px]`}>
                <option value="">--Select--</option>
                {rooms.map((r, i) => <option key={i} value={r.room_type}>{r.room_type}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className={labelStyle}>Customer :</span>
              <input value={filters.customer} onChange={(e) => setFilters({ ...filters, customer: e.target.value })} className={`${smallInput} w-[220px]`} />
            </div>
          </div>

          {/* Row 4 */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            <div className="flex items-center gap-2">
              <span className={labelStyle}>Package :</span>
              <select value={filters.packageType} onChange={(e) => setFilters({ ...filters, packageType: e.target.value })} className={`${smallSelect} min-w-[200px]`}>
                <option value="">--Select--</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className={labelStyle}>Ticket No :</span>
              <input value={filters.ticketNo} onChange={(e) => setFilters({ ...filters, ticketNo: e.target.value })} className={`${smallInput} w-[240px]`} />
            </div>
            <button
              type="button"
              onClick={() => { /* filters are reactive; no-op but keeps UX */ }}
              className="ml-auto border border-gray-500 bg-gray-200 hover:bg-gray-300 px-4 py-1 text-[12px] font-semibold rounded"
            >
              Search
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] border-collapse">
            <thead>
              <tr style={{ backgroundColor: "#D4A59A" }} className="text-left">
                <th className="p-2 border-b border-gray-400 w-[50px]">S.No.</th>
                <th className="p-2 border-b border-gray-400 w-[130px]">Type</th>
                <th className="p-2 border-b border-gray-400">Customer Name</th>
                <th className="p-2 border-b border-gray-400">Booking</th>
                <th className="p-2 border-b border-gray-400">Package</th>
                <th className="p-2 border-b border-gray-400 w-[110px]">Date</th>
                <th className="p-2 border-b border-gray-400 w-[140px]"></th>
              </tr>
            </thead>
            <tbody>
              {pagination.paginatedItems.length === 0 ? (
                <tr style={filterCellStyle}>
                  <td colSpan={7} className="text-center py-8 text-gray-600">No cancelled bookings found</td>
                </tr>
              ) : (
                pagination.paginatedItems.map((b, idx) => {
                  const hb = b.hotel_bookings?.[0];
                  const checkIn = hb?.check_in_date || b.check_in_date;
                  const checkOut = hb?.check_out_date || b.check_out_date;
                  const adults = (b.hotel_bookings || []).reduce((s: number, h: any) => s + (h.adults || 0), 0);
                  const children = (b.hotel_bookings || []).reduce((s: number, h: any) => s + (h.children || 0), 0);
                  const dateShown = b.cancellations?.[0]?.cancellation_date || b.updated_at;
                  return (
                    <tr key={b.id} style={filterCellStyle} className="align-top">
                      <td className="p-2 border-b border-gray-300">{pagination.startIndex + idx}</td>
                      <td className="p-2 border-b border-gray-300">{getTypeLabel(b)}</td>
                      <td className="p-2 border-b border-gray-300">
                        <div>{b.customer_name || "-"}</div>
                        {b.cancellations?.[0]?.cancellation_reason && (
                          <div className="text-gray-700">{b.cancellations[0].cancellation_reason}</div>
                        )}
                        <div>Contact No.: {b.contact_no || ""}</div>
                      </td>
                      <td className="p-2 border-b border-gray-300">
                        <div><span className="font-semibold">Booking:</span></div>
                        <div>{formatDisplayDate(checkIn)} - {formatDisplayDate(checkOut)}</div>
                        <div><span className="font-semibold">No. of Rooms:</span> {getRoomsCount(b)}</div>
                        <div>{adults} Adult {children} Children</div>
                        <div><span className="font-semibold">Price:</span> Rs. {(b.total_amount || 0).toLocaleString()}/-</div>
                      </td>
                      <td className="p-2 border-b border-gray-300">
                        <div>Hotel : {getHotelName(b)}</div>
                        <div>Room : {getRoomName(b)}</div>
                      </td>
                      <td className="p-2 border-b border-gray-300">{formatDisplayDate(dateShown)}</td>
                      <td className="p-2 border-b border-gray-300">
                        <div className="flex flex-col gap-1 text-[#7a3b2e]">
                          <button
                            onClick={() => navigate(isAdminRoute ? `/admin/bookings?id=${b.id}` : `/bookings?id=${b.id}`)}
                            className="text-left hover:underline"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => navigate(isAdminRoute ? `/admin/bookings?rebook=${b.id}` : `/bookings?rebook=${b.id}`)}
                            className="text-left hover:underline"
                          >
                            ReBooking
                          </button>
                          <button
                            onClick={() => navigate(isAdminRoute ? `/admin/refund-payments?id=${b.id}` : `/refunds?id=${b.id}`)}
                            className="text-left hover:underline"
                          >
                            View Cancel Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-between items-center px-3 py-2 text-[12px] border-t border-gray-300 bg-white">
            <span>
              Showing {pagination.startIndex + 1}-{pagination.endIndex} of {pagination.totalItems}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => pagination.goToPage(Math.max(1, pagination.currentPage - 1))}
                disabled={pagination.currentPage === 1}
                className="border border-gray-400 px-2 py-0.5 disabled:opacity-50"
              >
                Prev
              </button>
              <span className="px-2 py-0.5">
                Page {pagination.currentPage} / {pagination.totalPages}
              </span>
              <button
                onClick={() => pagination.goToPage(Math.min(pagination.totalPages, pagination.currentPage + 1))}
                disabled={pagination.currentPage === pagination.totalPages}
                className="border border-gray-400 px-2 py-0.5 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );

  if (!isAdminRoute) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Cancelled Bookings" />
        {content}
      </div>
    );
  }
  return content;
}
