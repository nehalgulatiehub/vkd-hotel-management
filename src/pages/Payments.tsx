import { Header } from "@/components/layout/Header";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/TablePagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { BookingDetailsDialog } from "@/components/booking/BookingDetailsDialog";

interface PaymentWithBooking {
  id: string;
  amount: number;
  payment_date: string | null;
  payment_mode: string | null;
  reference_number: string | null;
  notes: string | null;
  approval_status: string | null;
  payment_type: string | null;
  bookings: {
    id: string;
    booking_number: string;
    customer_name: string | null;
    contact_no: string | null;
    booking_type: string | null;
    reference: string | null;
    adults: number | null;
    children: number | null;
    check_in_date: string;
    check_out_date: string;
    total_amount: number | null;
    paid_amount: number | null;
    due_amount: number | null;
    created_at: string | null;
  } | null;
  cities: {
    name: string;
  } | null;
}

interface HotelInfo {
  hotel_name: string | null;
  room_type: string | null;
  number_of_rooms: number | null;
}

interface BookingPayment {
  id: string;
  amount: number;
  payment_date: string | null;
  payment_mode: string | null;
  reference_number: string | null;
  notes: string | null;
  approval_status: string | null;
  cities: { name: string } | null;
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const days = Array.from({ length: 31 }, (_, i) => i + 1);
const years = Array.from({ length: 10 }, (_, i) => 2020 + i);

export default function Payments() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<PaymentWithBooking[]>([]);
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithBooking | null>(null);
  const [hotelInfo, setHotelInfo] = useState<HotelInfo | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewPaymentDialogOpen, setViewPaymentDialogOpen] = useState(false);
  const [bookingPayments, setBookingPayments] = useState<BookingPayment[]>([]);
  const [serviceData, setServiceData] = useState<any>(null);
  const [serviceType, setServiceType] = useState<"safari" | "vehicle" | "hotel" | "volvo_dm" | "volvo_md">("hotel");

  // Filters
  const [filters, setFilters] = useState({
    fromMonth: "Jan",
    fromDay: "1",
    fromYear: "2026",
    toMonth: "Jan",
    toDay: "31",
    toYear: "2026",
    searchWithDate: "NO",
    place: "",
    paymentMode: "",
    chequeNo: "",
    bookingType: "",
    amount: "",
  });

  useEffect(() => {
    fetchPayments();
    fetchCities();
  }, []);

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from("payments")
      .select(`
        *,
        bookings(id, booking_number, customer_name, contact_no, booking_type, reference, adults, children, check_in_date, check_out_date, total_amount, paid_amount, due_amount, created_at),
        cities(name)
      `)
      .order("payment_date", { ascending: false });

    if (error) {
      toast.error("Failed to load payments");
    } else {
      setPayments((data as unknown as PaymentWithBooking[]) || []);
    }
  };

  const fetchBookingPayments = async (bookingId: string) => {
    const { data, error } = await supabase
      .from("payments")
      .select("id, amount, payment_date, payment_mode, reference_number, notes, approval_status, cities(name)")
      .eq("booking_id", bookingId)
      .order("payment_date", { ascending: false });

    if (error) {
      toast.error("Failed to load booking payments");
    } else {
      setBookingPayments((data as unknown as BookingPayment[]) || []);
    }
  };

  const handleViewPayment = async (payment: PaymentWithBooking) => {
    setSelectedPayment(payment);
    if (payment.bookings?.id) {
      await fetchBookingPayments(payment.bookings.id);
    }
    setViewPaymentDialogOpen(true);
  };

  const fetchCities = async () => {
    const { data } = await supabase.from("cities").select("id, name").order("name");
    setCities(data || []);
  };

  const fetchHotelInfo = async (bookingId: string) => {
    const { data } = await supabase
      .from("hotel_bookings")
      .select(`
        number_of_rooms,
        room_type,
        own_hotels(name),
        another_hotels(name)
      `)
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (data) {
      let roomName = data.room_type;
      // Try to resolve room UUID to name
      if (data.room_type && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.room_type)) {
        const { data: roomData } = await supabase
          .from("rooms")
          .select("room_type, room_number")
          .eq("id", data.room_type)
          .maybeSingle();
        if (roomData) {
          roomName = roomData.room_type || roomData.room_number;
        }
      }

      setHotelInfo({
        hotel_name: data.own_hotels?.name || data.another_hotels?.name || null,
        room_type: roomName,
        number_of_rooms: data.number_of_rooms,
      });
    } else {
      setHotelInfo(null);
    }
  };

  const handleViewDetails = async (payment: PaymentWithBooking) => {
    setSelectedPayment(payment);
    if (payment.bookings?.id) {
      const bookingId = payment.bookings.id;
      // Determine service type from payment_type
      const paymentType = payment.payment_type?.toLowerCase() || "";
      let type: "safari" | "vehicle" | "hotel" | "volvo_dm" | "volvo_md" = "hotel";
      
      if (paymentType.includes("safari")) {
        type = "safari";
        const { data } = await supabase
          .from("safari_bookings")
          .select("*")
          .eq("booking_id", bookingId)
          .maybeSingle();
        setServiceData(data);
      } else if (paymentType.includes("vehicle")) {
        type = "vehicle";
        const { data } = await supabase
          .from("vehicle_bookings")
          .select("*, transporters(name)")
          .eq("booking_id", bookingId)
          .maybeSingle();
        setServiceData(data);
      } else if (paymentType.includes("delhi_manali") || (paymentType.includes("delhi") && paymentType.includes("manali") && !paymentType.includes("manali_delhi"))) {
        type = "volvo_dm";
        const { data } = await supabase
          .from("volvo_bookings")
          .select("*, transporters(name)")
          .eq("booking_id", bookingId)
          .limit(1)
          .maybeSingle();
        setServiceData(data);
      } else if (paymentType.includes("manali_delhi") || (paymentType.includes("manali") && paymentType.includes("delhi"))) {
        type = "volvo_md";
        const { data } = await supabase
          .from("volvo_bookings")
          .select("*, transporters(name)")
          .eq("booking_id", bookingId)
          .limit(1)
          .maybeSingle();
        setServiceData(data);
      } else {
        // Default to hotel
        type = "hotel";
        const { data } = await supabase
          .from("hotel_bookings")
          .select("*, own_hotels(name), another_hotels(name)")
          .eq("booking_id", bookingId)
          .maybeSingle();
        setServiceData(data);
      }
      
      setServiceType(type);
    }
    setDialogOpen(true);
  };

  const getFilteredPayments = () => {
    return payments.filter((payment) => {
      // Place filter
      if (filters.place && payment.cities?.name !== filters.place) return false;
      
      // Payment mode filter
      if (filters.paymentMode && payment.payment_mode?.toLowerCase() !== filters.paymentMode.toLowerCase()) return false;
      
      // Cheque no filter
      if (filters.chequeNo && !payment.reference_number?.toLowerCase().includes(filters.chequeNo.toLowerCase())) return false;
      
      // Booking type filter
      if (filters.bookingType && payment.payment_type?.toLowerCase() !== filters.bookingType.toLowerCase()) return false;
      
      // Amount filter
      if (filters.amount && payment.amount !== parseFloat(filters.amount)) return false;

      // Date filter
      if (filters.searchWithDate === "YES" && payment.payment_date) {
        const paymentDate = new Date(payment.payment_date);
        const fromDate = new Date(`${filters.fromYear}-${months.indexOf(filters.fromMonth) + 1}-${filters.fromDay}`);
        const toDate = new Date(`${filters.toYear}-${months.indexOf(filters.toMonth) + 1}-${filters.toDay}`);
        if (paymentDate < fromDate || paymentDate > toDate) return false;
      }

      return true;
    });
  };

  const filteredPayments = getFilteredPayments();

  const {
    paginatedItems,
    currentPage,
    totalPages,
    goToPage,
    totalItems,
    startIndex,
    endIndex,
  } = usePagination(filteredPayments, { itemsPerPage: 10 });

  return (
    <div className="min-h-screen bg-background">
      <Header title="View Payment" />
      <main className="p-4">
        {/* Header Row */}
        <div className="flex justify-between items-center mb-3 bg-[#8B4513] text-white px-3 py-2">
          <span className="font-semibold">View Booking</span>
          <button 
            onClick={() => navigate("/bookings")}
            className="text-white hover:underline text-sm"
          >
            View All Records
          </button>
        </div>

        {/* Compact Filter Section */}
        <div className="border border-border bg-muted/30 mb-3">
          {/* Row 1: Dates and Search Toggle */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-2 py-1.5 border-b border-border text-[11px]">
            <div className="flex items-center gap-1">
              <span>From :</span>
              <select value={filters.fromMonth} onChange={(e) => setFilters({ ...filters, fromMonth: e.target.value })} className="h-5 border border-input bg-background px-1 rounded-sm text-[11px]">
                {months.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={filters.fromDay} onChange={(e) => setFilters({ ...filters, fromDay: e.target.value })} className="h-5 border border-input bg-background px-1 rounded-sm text-[11px] w-12">
                {days.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={filters.fromYear} onChange={(e) => setFilters({ ...filters, fromYear: e.target.value })} className="h-5 border border-input bg-background px-1 rounded-sm text-[11px]">
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span>To :</span>
              <select value={filters.toMonth} onChange={(e) => setFilters({ ...filters, toMonth: e.target.value })} className="h-5 border border-input bg-background px-1 rounded-sm text-[11px]">
                {months.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={filters.toDay} onChange={(e) => setFilters({ ...filters, toDay: e.target.value })} className="h-5 border border-input bg-background px-1 rounded-sm text-[11px] w-12">
                {days.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={filters.toYear} onChange={(e) => setFilters({ ...filters, toYear: e.target.value })} className="h-5 border border-input bg-background px-1 rounded-sm text-[11px]">
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span>Search with Date :</span>
              <label className="flex items-center gap-0.5">
                <input type="radio" name="searchDate" value="YES" checked={filters.searchWithDate === "YES"} onChange={() => setFilters({ ...filters, searchWithDate: "YES" })} className="w-3 h-3" />
                <span>YES</span>
              </label>
              <label className="flex items-center gap-0.5">
                <input type="radio" name="searchDate" value="NO" checked={filters.searchWithDate === "NO"} onChange={() => setFilters({ ...filters, searchWithDate: "NO" })} className="w-3 h-3" />
                <span>NO</span>
              </label>
            </div>
          </div>

          {/* Row 2: Place, Payment Mode, Amount */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-2 py-1.5 border-b border-border text-[11px]">
            <div className="flex items-center gap-1">
              <span>Place</span>
              <select value={filters.place} onChange={(e) => setFilters({ ...filters, place: e.target.value })} className="h-5 border border-input bg-background px-1 rounded-sm text-[11px]">
                <option value="">Select Place</option>
                {cities.map((city) => <option key={city.id} value={city.name}>{city.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span>Payment Mode</span>
              <select value={filters.paymentMode} onChange={(e) => setFilters({ ...filters, paymentMode: e.target.value })} className="h-5 border border-input bg-background px-1 rounded-sm text-[11px]">
                <option value="">---Select Mode---</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="net_banking">Net Banking</option>
                <option value="card">Card</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span>Amount</span>
              <input
                type="text"
                value={filters.amount}
                onChange={(e) => setFilters({ ...filters, amount: e.target.value })}
                className="h-5 w-24 border border-input bg-background px-1 rounded-sm text-[11px]"
              />
            </div>
          </div>

          {/* Row 3: Cheque No, Booking Type, Search Button */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-2 py-1.5 text-[11px]">
            <div className="flex items-center gap-1">
              <span>Cheque No</span>
              <input
                type="text"
                value={filters.chequeNo}
                onChange={(e) => setFilters({ ...filters, chequeNo: e.target.value })}
                className="h-5 w-28 border border-input bg-background px-1 rounded-sm text-[11px]"
              />
            </div>
            <div className="flex items-center gap-1">
              <span>Booking Type</span>
              <select value={filters.bookingType} onChange={(e) => setFilters({ ...filters, bookingType: e.target.value })} className="h-5 border border-input bg-background px-1 rounded-sm text-[11px]">
                <option value="">---Select---</option>
                <option value="Booking Advance">Booking Advance</option>
                <option value="Safari">Safari</option>
                <option value="Hotel Payment">Hotel Payment</option>
                <option value="Another Hotel Payment">Another Hotel Payment</option>
                <option value="Vehicle Payment">Vehicle Payment</option>
                <option value="Delhi Manali Volvo">Delhi Manali Volvo</option>
                <option value="Manali Delhi Volvo">Manali Delhi Volvo</option>
              </select>
            </div>
            <button
              onClick={() => {/* Filtering is automatic */}}
              className="h-5 px-3 bg-muted border border-input rounded-sm text-[11px] hover:bg-muted/80"
            >
              Search
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="bg-[#D4A59A] text-foreground">
                <th className="border border-border p-2 text-left font-semibold">S.No.</th>
                <th className="border border-border p-2 text-left font-semibold">Payment Place</th>
                <th className="border border-border p-2 text-left font-semibold">Date</th>
                <th className="border border-border p-2 text-left font-semibold">Booking For</th>
                <th className="border border-border p-2 text-left font-semibold">Payment Mode</th>
                <th className="border border-border p-2 text-left font-semibold">Cheque No</th>
                <th className="border border-border p-2 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((payment, index) => (
                <tr key={payment.id} className="bg-[#F5E6E0] hover:bg-[#EBDAD4]">
                  <td className="border border-border p-2">{startIndex + index}</td>
                  <td className="border border-border p-2">{payment.amount?.toLocaleString() || "-"}</td>
                  <td className="border border-border p-2">
                    {payment.payment_date ? new Date(payment.payment_date).toISOString().split("T")[0] : "-"}
                  </td>
                  <td className="border border-border p-2">{payment.payment_type || "Booking"}</td>
                  <td className="border border-border p-2">
                    {payment.payment_mode || "N/A"} Code=[{payment.reference_number || ""}]
                  </td>
                  <td className="border border-border p-2">{payment.reference_number || "-"}</td>
                  <td className="border border-border p-2">
                    <div className="flex flex-col gap-0.5 text-primary">
                      <button onClick={() => handleViewDetails(payment)} className="text-left hover:underline">View Details</button>
                      <button onClick={() => payment.bookings?.id && navigate(`/booking/${payment.bookings.id}/receipt`)} className="text-left hover:underline">Print Booking</button>
                      <button onClick={() => handleViewPayment(payment)} className="text-left hover:underline">View Payment</button>
                      <button onClick={() => navigate("/refunds")} className="text-left hover:underline">Refund Payment</button>
                      <button onClick={() => navigate("/cancelling-payments")} className="text-left hover:underline">View Refund Payment</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPayments.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No payments found
            </div>
          )}
        </div>
        
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
          totalItems={totalItems}
          startIndex={startIndex}
          endIndex={endIndex}
        />

        {/* View Details Dialog */}
        <BookingDetailsDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          booking={selectedPayment?.bookings}
          serviceType={serviceType}
          serviceData={serviceData}
        />

        {/* View Payment Dialog */}
        <Dialog open={viewPaymentDialogOpen} onOpenChange={setViewPaymentDialogOpen}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden">
            <DialogHeader className="bg-[#2563EB] text-white px-4 py-3">
              <DialogTitle className="text-lg font-semibold">View Payment</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              {/* Summary Header */}
              <table className="w-full text-xs border-collapse mb-4">
                <thead>
                  <tr className="bg-[#D4A59A]">
                    <th className="border border-border p-2 text-left font-semibold"></th>
                    <th className="border border-border p-2 text-left font-semibold">Total Payment</th>
                    <th className="border border-border p-2 text-left font-semibold">Total Recieved Payment</th>
                    <th className="border border-border p-2 text-left font-semibold">Total Due Payment</th>
                    <th className="border border-border p-2 text-left font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-[#F5E6E0]">
                    <td className="border border-border p-2 font-semibold">Booking</td>
                    <td className="border border-border p-2">Rs. {selectedPayment?.bookings?.total_amount?.toLocaleString() || 0}/-</td>
                    <td className="border border-border p-2">Rs. {selectedPayment?.bookings?.paid_amount?.toLocaleString() || 0}/-</td>
                    <td className="border border-border p-2">Rs. {selectedPayment?.bookings?.due_amount?.toLocaleString() || 0}/-</td>
                    <td className="border border-border p-2">
                      <button 
                        onClick={() => { setViewPaymentDialogOpen(false); handleViewDetails(selectedPayment!); }}
                        className="text-primary hover:underline"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Payment History */}
              <div className="text-xs">
                <div className="font-semibold mb-2">Booking</div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#D4A59A]">
                      <th className="border border-border p-2 text-left font-semibold">S.No.</th>
                      <th className="border border-border p-2 text-left font-semibold">Payment</th>
                      <th className="border border-border p-2 text-left font-semibold">Date</th>
                      <th className="border border-border p-2 text-left font-semibold">Mode</th>
                      <th className="border border-border p-2 text-left font-semibold">Payment Detail</th>
                      <th className="border border-border p-2 text-left font-semibold">Place</th>
                      <th className="border border-border p-2 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookingPayments.length === 0 ? (
                      <tr className="bg-[#F5E6E0]">
                        <td colSpan={7} className="border border-border p-4 text-center text-muted-foreground">
                          No payments found
                        </td>
                      </tr>
                    ) : (
                      bookingPayments.map((bp, index) => (
                        <tr key={bp.id} className="bg-[#F5E6E0]">
                          <td className="border border-border p-2">{index + 1}</td>
                          <td className="border border-border p-2">Rs. {bp.amount?.toLocaleString() || 0}/-</td>
                          <td className="border border-border p-2">
                            {bp.payment_date ? new Date(bp.payment_date).toLocaleDateString("en-GB") : "-"}
                          </td>
                          <td className="border border-border p-2">
                            {bp.payment_mode || "N/A"} Code={bp.reference_number ? `[${bp.reference_number}]` : "[]"}
                          </td>
                          <td className="border border-border p-2">
                            {bp.notes || `rs ${bp.amount?.toLocaleString() || 0}/-recd`}
                          </td>
                          <td className="border border-border p-2">{bp.cities?.name || "-"}</td>
                          <td className="border border-border p-2 capitalize">{bp.approval_status || "Pending"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
