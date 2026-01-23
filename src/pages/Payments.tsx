import { Header } from "@/components/layout/Header";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
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
        bookings(id, booking_number, customer_name, contact_no, booking_type, reference, adults, children, check_in_date, check_out_date, total_amount, created_at),
        cities(name)
      `)
      .order("payment_date", { ascending: false });

    if (error) {
      toast.error("Failed to load payments");
    } else {
      setPayments((data as PaymentWithBooking[]) || []);
    }
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
      await fetchHotelInfo(payment.bookings.id);
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
                      <button onClick={() => payment.bookings?.id && navigate(`/booking-payments?bookingId=${payment.bookings.id}`)} className="text-left hover:underline">View Payment</button>
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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md p-0 overflow-hidden">
            <DialogHeader className="bg-[#2563EB] text-white px-4 py-3">
              <DialogTitle className="text-lg font-semibold">View Booking Details</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <div className="bg-[#F5E6E0] border border-border rounded p-4">
                {selectedPayment?.bookings && (
                  <div className="space-y-2 text-sm">
                    <div className="flex">
                      <span className="w-32 text-muted-foreground">Type :</span>
                      <span>{selectedPayment.bookings.booking_type || "Direct"}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-muted-foreground">Reference :</span>
                      <span>{selectedPayment.bookings.reference || "-"}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-muted-foreground">Customer Name :</span>
                      <span>{selectedPayment.bookings.customer_name || "-"}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-muted-foreground">No. of People :</span>
                      <span>{selectedPayment.bookings.adults || 0} Adult {selectedPayment.bookings.children || 0} Children</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-muted-foreground">Hotel :</span>
                      <span>{hotelInfo?.hotel_name || "-"}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-muted-foreground">Room :</span>
                      <span>{hotelInfo?.room_type || "-"}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-muted-foreground">No. of Rooms :</span>
                      <span>{hotelInfo?.number_of_rooms || "-"}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-muted-foreground">Package :</span>
                      <span>-</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-muted-foreground">Price :</span>
                      <span>Rs. {selectedPayment.bookings.total_amount?.toLocaleString() || 0}/-</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-muted-foreground">Booking From :</span>
                      <span>{selectedPayment.bookings.check_in_date ? new Date(selectedPayment.bookings.check_in_date).toLocaleDateString("en-GB") : "-"}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-muted-foreground">Booking To :</span>
                      <span>{selectedPayment.bookings.check_out_date ? new Date(selectedPayment.bookings.check_out_date).toLocaleDateString("en-GB") : "-"}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-muted-foreground">Date :</span>
                      <span>{selectedPayment.bookings.created_at ? new Date(selectedPayment.bookings.created_at).toLocaleDateString("en-GB") : "-"}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
