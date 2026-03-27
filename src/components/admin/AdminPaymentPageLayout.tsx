import { useState, useEffect, ReactNode } from "react";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { TablePagination } from "@/components/ui/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { toast } from "sonner";
import { AdminViewPaymentDialog } from "@/components/admin/AdminViewPaymentDialog";
import { BookingDetailsDialog } from "@/components/booking/BookingDetailsDialog";
import { syncServiceTableOnApproval } from "@/utils/paymentSync";
import { reversePaymentOnRejection } from "@/utils/paymentSync";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export interface PaymentWithDetails {
  id: string;
  amount: number;
  payment_mode: string | null;
  payment_date: string | null;
  reference_number: string | null;
  approval_status: string | null;
  approved_at: string | null;
  created_at: string | null;
  booking: {
    id: string;
    booking_number: string;
    check_in_date: string;
    check_out_date: string;
    customer_name: string | null;
    contact_no: string | null;
    total_amount: number | null;
    adults: number | null;
    children: number | null;
    address: string | null;
    agent?: { name: string; company_name: string | null } | null;
  } | null;
  hotel_info?: { hotel_name: string | null; room_type: string | null; number_of_rooms?: number | null };
  created_by_profile?: { username: string | null; first_name: string | null; last_name: string | null } | null;
  city_info?: { name: string } | null;
}

interface AdminPaymentPageLayoutProps {
  title: string;
  paymentType?: string;
  approvalStatus: "pending" | "approved";
  serviceLabel?: string; // e.g. "Hotel" for the Hotel filter label, "Another Hotel" etc.
}

export default function AdminPaymentPageLayout({ title, paymentType, approvalStatus, serviceLabel }: AdminPaymentPageLayoutProps) {
  const { isAdmin, isAccount, user, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchWithDate, setSearchWithDate] = useState<"yes" | "no">("no");
  const [fromMonth, setFromMonth] = useState(String(new Date().getMonth() + 1));
  const [fromDay, setFromDay] = useState(String(new Date().getDate()));
  const [fromYear, setFromYear] = useState(String(new Date().getFullYear()));
  const [toMonth, setToMonth] = useState(String(new Date().getMonth() + 1));
  const [toDay, setToDay] = useState(String(new Date().getDate()));
  const [toYear, setToYear] = useState(String(new Date().getFullYear()));
  const [filterType, setFilterType] = useState("all");
  const [filterAgent, setFilterAgent] = useState("all");
  const [filterReference, setFilterReference] = useState("");
  const [filterHotel, setFilterHotel] = useState("all");
  const [filterRoom, setFilterRoom] = useState("all");
  const [filterUser, setFilterUser] = useState("all");
  const [filterPackage, setFilterPackage] = useState("all");
  const [searchCustomer, setSearchCustomer] = useState("");
  const [filterPaymentPlace, setFilterPaymentPlace] = useState("all");
  const [filterPaymentMode, setFilterPaymentMode] = useState("all");
  const [filterNFTCode, setFilterNFTCode] = useState("");

  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const [hotels, setHotels] = useState<{ id: string; name: string }[]>([]);
  const [rooms, setRooms] = useState<{ id: string; name: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [rejectingPaymentId, setRejectingPaymentId] = useState<string | null>(null);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [appliedFilter, setAppliedFilter] = useState(false);

  // View Booking Details dialog state
  const [showBookingDetailsDialog, setShowBookingDetailsDialog] = useState(false);
  const [detailBooking, setDetailBooking] = useState<any>(null);
  const [detailServiceType, setDetailServiceType] = useState<"safari" | "vehicle" | "hotel" | "volvo_dm" | "volvo_md">("safari");
  const [detailServiceData, setDetailServiceData] = useState<any>(null);
  const [showFullDetailsDialog, setShowFullDetailsDialog] = useState(false);
  const [fullDetailsData, setFullDetailsData] = useState<{ ownHotels: any[]; anotherHotels: any[]; safaris: any[]; vehicles: any[]; volvoDM: any[]; volvoMD: any[] }>({ ownHotels: [], anotherHotels: [], safaris: [], vehicles: [], volvoDM: [], volvoMD: [] });

  const canManage = isAdmin() || isAccount();

  const handleViewPayment = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setShowPaymentDialog(true);
  };

  const handleViewBooking = async (bookingId: string) => {
    if (!bookingId) return;
    try {
      const { data: bookingData } = await supabase
        .from("bookings")
        .select("*, agents(name, company_name)")
        .eq("id", bookingId)
        .maybeSingle();
      if (!bookingData) { toast.error("Booking not found"); return; }

      const [hotelRes, safariRes, vehicleRes, volvoRes] = await Promise.all([
        supabase.from("hotel_bookings").select("*, own_hotels(name), another_hotels(name, cities(name))").eq("booking_id", bookingId),
        supabase.from("safari_bookings").select("*").eq("booking_id", bookingId),
        supabase.from("vehicle_bookings").select("*, transporters(name)").eq("booking_id", bookingId),
        supabase.from("volvo_bookings").select("*, transporters(name)").eq("booking_id", bookingId),
      ]);

      const ownHotels = (hotelRes.data || []).filter((h: any) => h.own_hotel_id);
      const anotherHotels = (hotelRes.data || []).filter((h: any) => h.hotel_id);
      const safaris = safariRes.data || [];
      const vehicles = vehicleRes.data || [];
      const normalize = (s: string) => s?.replace(/[-_ ]/g, "").toLowerCase() || "";
      const volvoDM = (volvoRes.data || []).filter((v: any) => normalize(v.route).includes("delhimanali"));
      const volvoMD = (volvoRes.data || []).filter((v: any) => normalize(v.route).includes("manalidelhi"));

      setDetailBooking(bookingData);
      setFullDetailsData({ ownHotels, anotherHotels, safaris, vehicles, volvoDM, volvoMD });
      setShowFullDetailsDialog(true);
    } catch (error) {
      console.error("Error fetching booking details:", error);
      toast.error("Failed to load booking details");
    }
  };

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  const filteredPayments = payments.filter(payment => {
    const matchesCustomer = !searchCustomer ||
      payment.booking?.customer_name?.toLowerCase().includes(searchCustomer.toLowerCase()) ||
      payment.booking?.booking_number?.toLowerCase().includes(searchCustomer.toLowerCase());
    const matchesMode = filterPaymentMode === "all" || payment.payment_mode?.toLowerCase() === filterPaymentMode.toLowerCase();
    const matchesUser = filterUser === "all" || payment.created_by_profile?.username === filterUser || payment.created_by_profile?.first_name === filterUser;
    const matchesAgent = filterAgent === "all" || payment.booking?.agent?.name === filterAgent;
    const matchesHotel = filterHotel === "all" || payment.hotel_info?.hotel_name === filterHotel;
    const matchesRoom = filterRoom === "all" || payment.hotel_info?.room_type === filterRoom;
    const matchesPlace = filterPaymentPlace === "all" || payment.city_info?.name === filterPaymentPlace;
    const matchesReference = !filterReference || payment.reference_number?.toLowerCase().includes(filterReference.toLowerCase());
    const matchesNFT = !filterNFTCode || payment.reference_number?.toLowerCase().includes(filterNFTCode.toLowerCase());
    const matchesType = filterType === "all" ||
      (filterType === "agent" && payment.booking?.agent) ||
      (filterType === "direct" && !payment.booking?.agent);

    let matchesDate = true;
    if (appliedFilter && searchWithDate === "yes") {
      const dateField = approvalStatus === "approved" ? payment.approved_at : payment.payment_date;
      const payDate = dateField ? new Date(dateField) : null;
      if (payDate) {
        const from = new Date(parseInt(fromYear), parseInt(fromMonth) - 1, parseInt(fromDay));
        const to = new Date(parseInt(toYear), parseInt(toMonth) - 1, parseInt(toDay), 23, 59, 59);
        matchesDate = payDate >= from && payDate <= to;
      } else {
        matchesDate = false;
      }
    }

    return matchesCustomer && matchesMode && matchesDate && matchesUser && matchesAgent && matchesHotel && matchesRoom && matchesPlace && matchesReference && matchesNFT && matchesType;
  });

  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filteredPayments, { itemsPerPage: 15 });
  const totalPaymentAmount = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  useEffect(() => {
    if (!authLoading && canManage) {
      fetchPayments();
      fetchFilters();
    }
  }, [authLoading]);

  const fetchFilters = async () => {
    const [agentsRes, hotelsRes, profilesRes, citiesRes, roomsRes] = await Promise.all([
      supabase.from("agents").select("id, name").order("name"),
      supabase.from("own_hotels").select("id, name").order("name"),
      supabase.from("profiles").select("id, username, first_name").order("username"),
      supabase.from("cities").select("id, name").order("name"),
      supabase.from("rooms").select("id, room_type, room_number").order("room_type"),
    ]);
    if (agentsRes.data) setAgents(agentsRes.data);
    if (hotelsRes.data) setHotels(hotelsRes.data);
    if (profilesRes.data) setUsers(profilesRes.data.map(p => ({ id: p.id, name: p.username || p.first_name || "Unknown" })));
    if (citiesRes.data) setCities(citiesRes.data);
    if (roomsRes.data) setRooms(roomsRes.data.map(r => ({ id: r.id, name: r.room_type || r.room_number })));
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("payments")
        .select(`id, amount, payment_mode, payment_date, reference_number, approval_status, approved_at, created_at, created_by, city_id, booking:bookings(id, booking_number, check_in_date, check_out_date, customer_name, contact_no, total_amount, adults, children, address, agent:agents(name, company_name))`);
      
      if (paymentType) {
        query = query.eq("payment_type", paymentType);
      }
      
      const { data, error } = await query
        .eq("approval_status", approvalStatus)
        .order(approvalStatus === "approved" ? "approved_at" : "created_at", { ascending: false });

      if (error) throw error;

      const bookingIds = (data || []).map((p: any) => p.booking?.id).filter(Boolean);
      let hotelBookingsMap: Record<string, any> = {};
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (bookingIds.length > 0) {
        const { data: hotelBookings } = await supabase
          .from("hotel_bookings")
          .select(`booking_id, room_type, number_of_rooms, hotel:another_hotels(name), own_hotel:own_hotels(name)`)
          .in("booking_id", bookingIds);

        const roomIds = [...new Set((hotelBookings || []).map((hb: any) => hb.room_type).filter((rt: any) => rt && uuidRegex.test(rt)))];
        let roomsMap: Record<string, string> = {};
        if (roomIds.length > 0) {
          const { data: rooms } = await supabase.from("rooms").select("id, room_type, room_number").in("id", roomIds);
          roomsMap = (rooms || []).reduce((acc: Record<string, string>, r: any) => ({ ...acc, [r.id]: r.room_type || r.room_number }), {});
        }

        hotelBookings?.forEach((hb: any) => {
          const isUuid = hb.room_type && uuidRegex.test(hb.room_type);
          hotelBookingsMap[hb.booking_id] = {
            hotel_name: hb.hotel?.name || hb.own_hotel?.name || null,
            room_type: isUuid ? (roomsMap[hb.room_type] || hb.room_type) : hb.room_type || null,
            number_of_rooms: hb.number_of_rooms
          };
        });
      }

      const creatorIds = [...new Set((data || []).map((p: any) => p.created_by).filter(Boolean))];
      let profilesMap: Record<string, any> = {};
      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, username, first_name, last_name").in("id", creatorIds);
        profilesMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
      }

      const cityIds = [...new Set((data || []).map((p: any) => p.city_id).filter(Boolean))];
      let citiesMap: Record<string, { name: string }> = {};
      if (cityIds.length > 0) {
        const { data: citiesData } = await supabase.from("cities").select("id, name").in("id", cityIds);
        citiesMap = (citiesData || []).reduce((acc, c) => ({ ...acc, [c.id]: { name: c.name } }), {});
      }

      const paymentsWithDetails = (data || []).map((p: any) => ({
        ...p,
        hotel_info: hotelBookingsMap[p.booking?.id] || null,
        created_by_profile: p.created_by ? profilesMap[p.created_by] : null,
        city_info: p.city_id ? citiesMap[p.city_id] : null,
      }));

      setPayments(paymentsWithDetails as PaymentWithDetails[]);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => { setAppliedFilter(true); };
  const handleViewAll = () => {
    setSearchWithDate("no");
    setFilterType("all");
    setFilterAgent("all");
    setFilterReference("");
    setFilterHotel("all");
    setFilterRoom("all");
    setFilterUser("all");
    setFilterPackage("all");
    setSearchCustomer("");
    setFilterPaymentPlace("all");
    setFilterPaymentMode("all");
    setFilterNFTCode("");
    setAppliedFilter(false);
  };

  const handleSelectPayment = (paymentId: string, checked: boolean) => {
    setSelectedPayments(prev => { const newSet = new Set(prev); checked ? newSet.add(paymentId) : newSet.delete(paymentId); return newSet; });
  };
  const handleSelectAll = (checked: boolean) => { setSelectedPayments(checked ? new Set(paginatedItems.map(p => p.id)) : new Set()); };

  const handleBulkApproval = async (status: "approved" | "rejected") => {
    if (selectedPayments.size === 0) { toast.error("Please select at least one payment"); return; }
    try {
      const { data: paymentDetails } = await supabase
        .from("payments")
        .select("id, amount, booking_id, payment_type")
        .in("id", Array.from(selectedPayments));

      const { error } = await supabase.from("payments").update({ approval_status: status, approved_by: user?.id, approved_at: new Date().toISOString() }).in("id", Array.from(selectedPayments));
      if (error) throw error;

      if (status === "approved" && paymentDetails) {
        await syncServiceTableOnApproval(paymentDetails as any);
      }

      toast.success(`${selectedPayments.size} payment(s) ${status} successfully`);
      setSelectedPayments(new Set());
      fetchPayments();
    } catch (error) { toast.error("Failed to update payments"); }
  };

  const handleBulkReject = async () => {
    if (selectedPayments.size === 0) { toast.error("Please select at least one payment"); return; }
    try {
      const { data: paymentDetails } = await supabase
        .from("payments")
        .select("id, amount, booking_id, payment_type")
        .in("id", Array.from(selectedPayments));

      const { error } = await supabase.from("payments").update({ approval_status: "pending", approved_at: null, approved_by: null }).in("id", Array.from(selectedPayments));
      if (error) throw error;

      if (paymentDetails) {
        await reversePaymentOnRejection(paymentDetails);
      }

      toast.success(`${selectedPayments.size} payment(s) rejected and reverted to pending`);
      setSelectedPayments(new Set());
      fetchPayments();
    } catch (error) { toast.error("Failed to reject payments"); }
  };

  const handleRejectPayment = async () => {
    if (!rejectingPaymentId) return;
    setRejectLoading(true);
    try {
      const { data: paymentData } = await supabase
        .from("payments")
        .select("id, amount, booking_id, payment_type")
        .eq("id", rejectingPaymentId)
        .single();

      const { error } = await supabase.from("payments").update({ approval_status: "pending", approved_at: null, approved_by: null }).eq("id", rejectingPaymentId);
      if (error) throw error;

      if (paymentData) {
        await reversePaymentOnRejection([paymentData]);
      }

      toast.success("Payment reverted to pending status");
      fetchPayments();
    } catch (error) { toast.error("Failed to reject payment"); } finally { setRejectLoading(false); setRejectingPaymentId(null); }
  };

  if (authLoading) return <div className="min-h-screen"><AdminHeader title={title} /><main className="p-4"><div className="py-8 text-center text-muted-foreground">Loading...</div></main></div>;
  if (!canManage) return <div className="min-h-screen"><AdminHeader title={title} /><main className="p-4"><div className="py-8 text-center text-muted-foreground">Access denied.</div></main></div>;

  const dateColumnLabel = approvalStatus === "approved" ? "Approve Date" : "Payment Date";
  const statusLabel = approvalStatus === "approved" ? "Approved" : "Pending";
  const hotelFilterLabel = serviceLabel || "Hotel";

  return (
    <div className="p-4">
      {/* Blue Header */}
      <div className="bg-[#b44a50] text-white px-4 py-2 flex items-center justify-between mb-0">
        <span className="text-sm font-medium">{title}</span>
        <button onClick={handleViewAll} className="bg-white text-[#c00] hover:bg-gray-100 h-7 text-xs px-3 rounded">View All Records</button>
      </div>
      {/* Maroon Search Header */}
      <div className="bg-[#b44a50] text-white px-4 py-1"><span className="text-xs font-medium">Search</span></div>
      <div className="border border-t-0 border-gray-300 bg-white p-3 space-y-2">
            {/* Row 1: From/To dates, Search with Date */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5" style={{ fontSize: "11px" }}>
              <div className="flex items-center gap-1">
                <span>From :</span>
                <select value={fromMonth} onChange={e => setFromMonth(e.target.value)} className="border rounded px-1 py-0.5 text-xs">
                  {months.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
                </select>
                <select value={fromDay} onChange={e => setFromDay(e.target.value)} className="border rounded px-1 py-0.5 text-xs">
                  {days.map(d => <option key={d} value={String(d)}>{d}</option>)}
                </select>
                <input type="text" value={fromYear} onChange={e => setFromYear(e.target.value)} className="border rounded px-1 py-0.5 text-xs w-14" />
              </div>
              <div className="flex items-center gap-1">
                <span>To :</span>
                <select value={toMonth} onChange={e => setToMonth(e.target.value)} className="border rounded px-1 py-0.5 text-xs">
                  {months.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
                </select>
                <select value={toDay} onChange={e => setToDay(e.target.value)} className="border rounded px-1 py-0.5 text-xs">
                  {days.map(d => <option key={d} value={String(d)}>{d}</option>)}
                </select>
                <input type="text" value={toYear} onChange={e => setToYear(e.target.value)} className="border rounded px-1 py-0.5 text-xs w-14" />
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <span>Search with Date :</span>
                <label className="flex items-center gap-0.5"><input type="radio" name="searchDate" checked={searchWithDate === "yes"} onChange={() => setSearchWithDate("yes")} /> YES</label>
                <label className="flex items-center gap-0.5"><input type="radio" name="searchDate" checked={searchWithDate === "no"} onChange={() => setSearchWithDate("no")} /> NO</label>
              </div>
            </div>

            {/* Row 2: Type, Agent, Hotel, Room, Reference, User */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5" style={{ fontSize: "11px" }}>
              <div className="flex items-center gap-1">
                <span>Type :</span>
                <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border rounded px-1 py-0.5 text-xs">
                  <option value="all">--Select--</option>
                  <option value="agent">Agent</option>
                  <option value="direct">Direct</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <span>Agent Name :</span>
                <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)} className="border rounded px-1 py-0.5 text-xs">
                  <option value="all">--Select--</option>
                  {agents.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-1 ml-auto">
                <span>Reference :</span>
                <input type="text" value={filterReference} onChange={e => setFilterReference(e.target.value)} className="border rounded px-1 py-0.5 text-xs w-28" />
              </div>
            </div>

            {/* Row 3: Hotel, Room, User, Payment Place */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5" style={{ fontSize: "11px" }}>
              <div className="flex items-center gap-1">
                <span>{hotelFilterLabel} :</span>
                <select value={filterHotel} onChange={e => setFilterHotel(e.target.value)} className="border rounded px-1 py-0.5 text-xs min-w-[120px]">
                  <option value="all">--Select--</option>
                  {hotels.map(h => <option key={h.id} value={h.name}>{h.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-1">
                <span>Room :</span>
                <select value={filterRoom} onChange={e => setFilterRoom(e.target.value)} className="border rounded px-1 py-0.5 text-xs">
                  <option value="all">--Select--</option>
                  {rooms.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-1 ml-auto">
                <span>User :</span>
                <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className="border rounded px-1 py-0.5 text-xs">
                  <option value="all">--Select--</option>
                  {users.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                </select>
              </div>
            </div>

            {/* Row 4: Package, Customer, Payment Place */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5" style={{ fontSize: "11px" }}>
              <div className="flex items-center gap-1">
                <span>Package :</span>
                <select value={filterPackage} onChange={e => setFilterPackage(e.target.value)} className="border rounded px-1 py-0.5 text-xs min-w-[120px]">
                  <option value="all">--Select--</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <span>Customer :</span>
                <input type="text" value={searchCustomer} onChange={e => setSearchCustomer(e.target.value)} className="border rounded px-1 py-0.5 text-xs w-28" />
              </div>
              <div className="flex items-center gap-1 ml-auto">
                <span>Payment Place :</span>
                <select value={filterPaymentPlace} onChange={e => setFilterPaymentPlace(e.target.value)} className="border rounded px-1 py-0.5 text-xs">
                  <option value="all">Select Place</option>
                  {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>

            {/* Row 5: Payment Mode, NFT Code, Search button */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5" style={{ fontSize: "11px" }}>
              <div className="flex items-center gap-1">
                <span>Payment Mode</span>
                <select value={filterPaymentMode} onChange={e => setFilterPaymentMode(e.target.value)} className="border rounded px-1 py-0.5 text-xs">
                  <option value="all">---Select Mode---</option>
                  <option value="cash">Cash</option>
                  <option value="cash in hand">Cash In Hand</option>
                  <option value="upi">UPI</option>
                  <option value="net banking">Net Banking</option>
                  <option value="credit card">Credit Card</option>
                  <option value="cheque">Cheque</option>
                </select>
                <span className="text-red-500">*</span>
              </div>
              <div className="flex items-center gap-1">
                <span>NFT Code :</span>
                <input type="text" value={filterNFTCode} onChange={e => setFilterNFTCode(e.target.value)} className="border rounded px-1 py-0.5 text-xs w-28" />
              </div>
              <div className="ml-auto">
                <button onClick={handleSearch} className="border rounded px-4 py-1 text-xs font-bold bg-background hover:bg-muted">Search</button>
              </div>
            </div>
          </div>

        {/* Table Section */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : paginatedItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No {statusLabel.toLowerCase()} payments found.</div>
        ) : (
          <div className="border border-[#ddd] rounded overflow-x-auto">
            <table className="w-full border-collapse" style={{ fontSize: "11px" }}>
              <thead>
                <tr style={{ backgroundColor: "#c47a7e", color: "#fff" }}>
                  <th className="border border-[#ddd] px-2 py-1.5 text-left font-bold text-xs">S.No.</th>
                  <th className="border border-[#ddd] px-2 py-1.5 text-left font-bold text-xs">Booking</th>
                  <th className="border border-[#ddd] px-2 py-1.5 text-left font-bold text-xs">Customer Name↕</th>
                  <th className="border border-[#ddd] px-2 py-1.5 text-left font-bold text-xs">Package↕</th>
                  <th className="border border-[#ddd] px-2 py-1.5 text-left font-bold text-xs">Payment</th>
                  <th className="border border-[#ddd] px-2 py-1.5 text-left font-bold text-xs">Payment Mode</th>
                  <th className="border border-[#ddd] px-2 py-1.5 text-left font-bold text-xs">{dateColumnLabel}</th>
                  <th className="border border-[#ddd] px-2 py-1.5 text-left font-bold text-xs">User↕</th>
                  <th className="border border-[#ddd] px-2 py-1.5 text-left font-bold text-xs">Status</th>
                  <th className="border border-[#ddd] px-2 py-1.5 text-center font-bold text-xs">
                    <input type="checkbox" checked={paginatedItems.length > 0 && selectedPayments.size === paginatedItems.length} onChange={e => handleSelectAll(e.target.checked)} />
                  </th>
                  <th className="border border-[#ddd] px-2 py-1.5 text-left font-bold text-xs">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((payment, index) => (
                  <tr key={payment.id} style={{ backgroundColor: "#f6f0f0" }}>
                    <td className="border border-[#ddd] px-2 py-2 text-xs align-top">{startIndex + index + 1}</td>
                    <td className="border border-[#ddd] px-2 py-2 text-xs align-top">
                      <div>Booking:</div>
                      <div>{payment.booking?.check_in_date ? format(new Date(payment.booking.check_in_date), "dd/MM/yyyy") : ""}</div>
                      <div>No. of Rooms: {payment.hotel_info?.number_of_rooms || 0}</div>
                      <div>{payment.booking?.adults || 0} Adult Children</div>
                      <div>Price: Rs. {payment.booking?.total_amount?.toLocaleString("en-IN") || 0}/-</div>
                    </td>
                    <td className="border border-[#ddd] px-2 py-2 text-xs align-top">
                      <div className="font-semibold">{payment.booking?.customer_name || "N/A"}</div>
                      <div>Contact No.: {payment.booking?.contact_no || ""}</div>
                      <div>Place : {payment.city_info?.name || payment.booking?.address || ""}</div>
                    </td>
                    <td className="border border-[#ddd] px-2 py-2 text-xs align-top">
                      <div>Agent :{payment.booking?.agent?.name || ""}</div>
                      <div>Hotel : {payment.hotel_info?.hotel_name || ""}</div>
                      <div>Room : {payment.hotel_info?.room_type || ""}</div>
                    </td>
                    <td className="border border-[#ddd] px-2 py-2 text-xs align-top font-medium">Rs. {payment.amount?.toLocaleString("en-IN") || 0}/-</td>
                    <td className="border border-[#ddd] px-2 py-2 text-xs align-top">
                      <div>{payment.payment_mode || "N/A"}</div>
                      {payment.reference_number && <div>Code={payment.reference_number}</div>}
                    </td>
                    <td className="border border-[#ddd] px-2 py-2 text-xs align-top">
                      {approvalStatus === "approved"
                        ? (payment.approved_at ? format(new Date(payment.approved_at), "yyyy-MM-dd") : "N/A")
                        : (payment.payment_date ? format(new Date(payment.payment_date), "dd-MMM-yyyy") : "N/A")
                      }
                    </td>
                    <td className="border border-[#ddd] px-2 py-2 text-xs align-top">{payment.created_by_profile?.username || payment.created_by_profile?.first_name || "N/A"}</td>
                    <td className="border border-[#ddd] px-2 py-2 text-xs align-top">{statusLabel}</td>
                    <td className="border border-[#ddd] px-2 py-2 text-xs align-top text-center">
                      <input type="checkbox" checked={selectedPayments.has(payment.id)} onChange={e => handleSelectPayment(payment.id, e.target.checked)} />
                    </td>
                    <td className="border border-[#ddd] px-2 py-2 text-xs align-top">
                      <div className="flex flex-col gap-0.5">
                        <button className="text-[#c00] hover:underline text-left" onClick={() => payment.booking?.id && handleViewBooking(payment.booking.id)}>View Booking</button>
                        {approvalStatus === "pending" && (
                          <button className="text-[#c00] hover:underline text-left" onClick={async () => {
                            if (payment.id) {
                              try {
                                const { data: paymentDetails } = await supabase.from("payments").select("id, amount, booking_id, payment_type").eq("id", payment.id);
                                const { error } = await supabase.from("payments").update({ approval_status: "approved", approved_by: user?.id, approved_at: new Date().toISOString() }).eq("id", payment.id);
                                if (error) throw error;
                                if (paymentDetails) await syncServiceTableOnApproval(paymentDetails as any);
                                toast.success("Payment approved successfully");
                                fetchPayments();
                              } catch { toast.error("Failed to approve payment"); }
                            }
                          }}>Approved</button>
                        )}
                        <button className="text-[#c00] hover:underline text-left" onClick={() => payment.booking?.id && handleViewPayment(payment.booking.id)}>View Payment</button>
                        <button className="text-[#c00] hover:underline text-left" onClick={() => navigate(`/admin/refund-payments?id=${payment.booking?.id}`)}>View Refund Payment</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between p-3 border-t border-[#ddd]">
              <div className="text-xs font-medium">Total Payment: Rs. {totalPaymentAmount.toLocaleString("en-IN")}/-</div>
              <div className="flex items-center gap-3">
                <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} totalItems={totalItems} startIndex={startIndex} endIndex={endIndex} />
                {approvalStatus === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => handleBulkApproval("approved")} disabled={selectedPayments.size === 0} className="border rounded px-3 py-1 text-xs bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">Approved ({selectedPayments.size})</button>
                    <button onClick={() => handleBulkApproval("rejected")} disabled={selectedPayments.size === 0} className="border rounded px-3 py-1 text-xs bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Reject ({selectedPayments.size})</button>
                  </div>
                )}
                {approvalStatus === "approved" && (
                  <div className="flex gap-2">
                    <button onClick={handleBulkReject} disabled={selectedPayments.size === 0} className="border rounded px-3 py-1 text-xs bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Reject ({selectedPayments.size})</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      <AdminViewPaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        bookingId={selectedBookingId}
      />

      {/* Full Booking Details Dialog */}
      <Dialog open={showFullDetailsDialog} onOpenChange={setShowFullDetailsDialog}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-auto p-0 rounded-lg">
          <DialogHeader className="px-4 py-3" style={{ backgroundColor: "#1e6e99" }}>
            <DialogTitle className="text-white text-sm font-semibold">View Booking Details</DialogTitle>
          </DialogHeader>
          {detailBooking && (
            <div className="p-4">
              <div className="border border-gray-400 rounded" style={{ backgroundColor: "#f6f0f0" }}>
                <div className="p-4 text-[12px]">
                  <table className="w-full">
                    <tbody>
                      <tr><td className="pr-4 py-0.5" style={{ width: "45%" }}>Type :</td><td className="py-0.5">{detailBooking.booking_type === "agent" ? "Agent" : "Direct"}</td></tr>
                      <tr><td className="pr-4 py-0.5">Reference :</td><td className="py-0.5">{detailBooking.reference || detailBooking.notes || "-"}</td></tr>
                      <tr><td className="pr-4 py-0.5">Email-Id :</td><td className="py-0.5">{detailBooking.email || "-"}</td></tr>
                      <tr><td className="pr-4 py-0.5">Customer Name :</td><td className="py-0.5">{detailBooking.customer_name || "-"}</td></tr>
                      <tr><td className="pr-4 py-0.5">Contact No :</td><td className="py-0.5">{detailBooking.contact_no || "-"}</td></tr>
                      <tr><td className="pr-4 py-0.5">No. of People :</td><td className="py-0.5">{detailBooking.adults || 0} Adult {detailBooking.children || 0} Children</td></tr>
                      <tr><td className="pr-4 py-0.5">Booking From :</td><td className="py-0.5">{detailBooking.check_in_date ? format(new Date(detailBooking.check_in_date), "dd/MM/yyyy") : "-"}</td></tr>
                      <tr><td className="pr-4 py-0.5">Booking To :</td><td className="py-0.5">{detailBooking.check_out_date ? format(new Date(detailBooking.check_out_date), "dd/MM/yyyy") : "-"}</td></tr>

                      {fullDetailsData.ownHotels.map((h: any, i: number) => (
                        <BookingServiceRows key={`own-${i}`} label="Hotel" data={[
                          ["Hotel Name :", h.own_hotels?.name],
                          ["Number of Rooms :", h.number_of_rooms],
                          ["Room Name :", h.room_type],
                          ["Hotel Check In :", h.check_in_date ? format(new Date(h.check_in_date), "dd/MM/yyyy") : "-"],
                          ["Hotel Check Out :", h.check_out_date ? format(new Date(h.check_out_date), "dd/MM/yyyy") : "-"],
                          ["Room Selling Price :", `Rs. ${(h.total_amount || 0).toLocaleString("en-IN")}/-`],
                        ]} />
                      ))}
                      {fullDetailsData.anotherHotels.map((h: any, i: number) => (
                        <BookingServiceRows key={`another-${i}`} label="Another Hotel" data={[
                          ["Another Hotel Name :", h.another_hotels?.name],
                          ["Number of Rooms :", h.number_of_rooms],
                          ["Room Type :", h.room_type],
                          ["Hotel Check In :", h.check_in_date ? format(new Date(h.check_in_date), "dd/MM/yyyy") : "-"],
                          ["Hotel Check Out :", h.check_out_date ? format(new Date(h.check_out_date), "dd/MM/yyyy") : "-"],
                          ["Room Booking Price :", `Rs. ${(h.room_rate || 0).toLocaleString("en-IN")}/-`],
                          ["Room Selling Price :", `Rs. ${(h.total_amount || 0).toLocaleString("en-IN")}/-`],
                        ]} />
                      ))}
                      {fullDetailsData.safaris.map((s: any, i: number) => (
                        <BookingServiceRows key={`safari-${i}`} label="Safari" data={[
                          ["Safari Name :", s.safari_name],
                          ["Safari Date :", s.safari_date ? format(new Date(s.safari_date), "dd/MM/yyyy") : "-"],
                          ["No of Persons :", s.number_of_persons],
                          ["Safari Booking Price :", `Rs. ${(s.rate_per_person || 0).toLocaleString("en-IN")}/-`],
                          ["Safari Selling Price :", `Rs. ${(s.total_amount || 0).toLocaleString("en-IN")}/-`],
                        ]} />
                      ))}
                      {fullDetailsData.vehicles.map((v: any, i: number) => (
                        <BookingServiceRows key={`vehicle-${i}`} label="Another Vehicle" data={[
                          ["Vehicle Details :", v.vehicle_type],
                          ["Vehicle Selling Price :", `Rs. ${(v.total_amount || 0).toLocaleString("en-IN")}/-`],
                          ["Vehicle Booking Price :", `Rs. ${(v.rate || 0).toLocaleString("en-IN")}/-`],
                          ["Transporter :", v.transporters?.name],
                          ["Vehicle Journey Date :", v.pickup_date ? format(new Date(v.pickup_date), "dd/MM/yyyy") : "-"],
                        ]} />
                      ))}
                      {fullDetailsData.volvoDM.map((v: any, i: number) => (
                        <BookingServiceRows key={`dm-${i}`} label="Delhi - Manali" data={[
                          ["No. of Tickets :", v.number_of_seats],
                          ["Ticket No. :", v.ticket_number],
                          ["Seat No. :", v.seat_numbers],
                          ["Transporter :", v.transporters?.name],
                          ["Volvo Journey Date :", v.travel_date ? format(new Date(v.travel_date), "dd/MM/yyyy") : "-"],
                          ["Volvo Booking Price :", `Rs. ${(v.rate_per_seat || 0).toLocaleString("en-IN")}/-`],
                          ["Volvo Selling Price :", `Rs. ${(v.total_amount || 0).toLocaleString("en-IN")}/-`],
                        ]} />
                      ))}
                      {fullDetailsData.volvoMD.map((v: any, i: number) => (
                        <BookingServiceRows key={`md-${i}`} label="Manali - Delhi" data={[
                          ["No. of Tickets :", v.number_of_seats],
                          ["Ticket No. :", v.ticket_number],
                          ["Seat No. :", v.seat_numbers],
                          ["Transporter :", v.transporters?.name],
                          ["Volvo Journey Date :", v.travel_date ? format(new Date(v.travel_date), "dd/MM/yyyy") : "-"],
                          ["Volvo Booking Price :", `Rs. ${(v.rate_per_seat || 0).toLocaleString("en-IN")}/-`],
                          ["Volvo Selling Price :", `Rs. ${(v.total_amount || 0).toLocaleString("en-IN")}/-`],
                        ]} />
                      ))}

                      <tr><td className="pr-4 py-0.5">Date :</td><td className="py-0.5">{detailBooking.created_at ? format(new Date(detailBooking.created_at), "dd/MM/yyyy") : "-"}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          <div className="px-4 py-2" style={{ backgroundColor: "#1e6e99" }}>
            <span className="text-white text-[11px]">&nbsp;</span>
          </div>
        </DialogContent>
      </Dialog>

      {approvalStatus === "approved" && (
        <AlertDialog open={!!rejectingPaymentId} onOpenChange={() => setRejectingPaymentId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Reject Payment</AlertDialogTitle><AlertDialogDescription>Are you sure you want to reject this payment? It will be reverted to pending status.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel disabled={rejectLoading}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleRejectPayment} disabled={rejectLoading} className="bg-red-600 hover:bg-red-700">{rejectLoading ? "Rejecting..." : "Reject"}</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

function BookingServiceRows({ label, data }: { label: string; data: [string, any][] }) {
  return (
    <>
      <tr><td colSpan={2} className="font-bold pt-2 pb-1">{label} :</td></tr>
      {data.map(([k, v], i) => (
        <tr key={i}><td className="pr-4 py-0.5" style={{ width: "45%" }}>{k}</td><td className="py-0.5">{v || "-"}</td></tr>
      ))}
    </>
  );
}
