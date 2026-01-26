import { Header } from "@/components/layout/Header";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const days = Array.from({ length: 31 }, (_, i) => i + 1);
const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

export default function VehiclePayments() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<any[]>([]);
  const [transporters, setTransporters] = useState<any[]>([]);
  
  const [fromMonth, setFromMonth] = useState(months[new Date().getMonth()]);
  const [fromDay, setFromDay] = useState(new Date().getDate());
  const [fromYear, setFromYear] = useState(new Date().getFullYear());
  const [toMonth, setToMonth] = useState(months[new Date().getMonth()]);
  const [toDay, setToDay] = useState(new Date().getDate());
  const [toYear, setToYear] = useState(new Date().getFullYear());
  const [searchWithDate, setSearchWithDate] = useState(false);
  const [transporterFilter, setTransporterFilter] = useState("");
  const [paymentModeFilter, setPaymentModeFilter] = useState("");

  useEffect(() => {
    fetchPayments();
    fetchTransporters();
  }, []);

  const fetchTransporters = async () => {
    const { data } = await supabase.from("transporters").select("id, name").order("name");
    setTransporters(data || []);
  };

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from("payments")
      .select(`
        *,
        bookings(id, booking_number, customer_name, contact_no)
      `)
      .eq("payment_type", "vehicle")
      .order("payment_date", { ascending: false });

    if (error) {
      toast.error("Failed to load vehicle payments");
    } else {
      // Get vehicle booking details for each payment
      const paymentsWithDetails = await Promise.all((data || []).map(async (payment) => {
        if (payment.bookings?.id) {
          const { data: vehicleData } = await supabase
            .from("vehicle_bookings")
            .select("*, transporters(name)")
            .eq("booking_id", payment.bookings.id)
            .maybeSingle();
          return { ...payment, vehicle_booking: vehicleData };
        }
        return payment;
      }));
      setPayments(paymentsWithDetails);
    }
  };

  const handleSearch = () => {
    fetchPayments();
  };

  const filteredPayments = payments.filter(payment => {
    let matchesDate = true;
    if (searchWithDate && payment.payment_date) {
      const paymentDate = new Date(payment.payment_date);
      const fromDate = new Date(fromYear, months.indexOf(fromMonth), fromDay);
      const toDate = new Date(toYear, months.indexOf(toMonth), toDay);
      matchesDate = paymentDate >= fromDate && paymentDate <= toDate;
    }

    const matchesTransporter = !transporterFilter || 
      payment.vehicle_booking?.transporters?.name?.toLowerCase().includes(transporterFilter.toLowerCase());
    
    const matchesPaymentMode = !paymentModeFilter || payment.payment_mode === paymentModeFilter;

    return matchesDate && matchesTransporter && matchesPaymentMode;
  });

  const totalPayments = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Header title="Another Vehicle Payment" />
      <main className="p-4">
        {/* Header Bar */}
        <div className="bg-[#1e6e99] text-white px-4 py-2 flex justify-between items-center">
          <span className="font-semibold">Another Vehicle Payment</span>
          <Link to="/payments/vehicle-due" className="text-white hover:underline text-sm">View All Records</Link>
        </div>

        {/* Filters */}
        <div className="border border-[#ccc] p-3 bg-white">
          {/* Row 1 */}
          <div className="flex flex-wrap items-center gap-4 mb-2 text-[11px]">
            <div className="flex items-center gap-1">
              <span>From :</span>
              <select value={fromMonth} onChange={(e) => setFromMonth(e.target.value)} className="border px-1 py-0.5 text-[11px]">
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={fromDay} onChange={(e) => setFromDay(Number(e.target.value))} className="border px-1 py-0.5 text-[11px]">
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={fromYear} onChange={(e) => setFromYear(Number(e.target.value))} className="border px-1 py-0.5 text-[11px]">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <span>To :</span>
              <select value={toMonth} onChange={(e) => setToMonth(e.target.value)} className="border px-1 py-0.5 text-[11px]">
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={toDay} onChange={(e) => setToDay(Number(e.target.value))} className="border px-1 py-0.5 text-[11px]">
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={toYear} onChange={(e) => setToYear(Number(e.target.value))} className="border px-1 py-0.5 text-[11px]">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span>Search with Date :</span>
              <label className="flex items-center gap-1">
                <input type="radio" checked={searchWithDate} onChange={() => setSearchWithDate(true)} /> YES
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" checked={!searchWithDate} onChange={() => setSearchWithDate(false)} /> NO
              </label>
            </div>
          </div>

          {/* Row 2 */}
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1">
              <span>Transporter :</span>
              <select 
                value={transporterFilter} 
                onChange={(e) => setTransporterFilter(e.target.value)} 
                className="border px-1 py-0.5 text-[11px] min-w-[200px]"
              >
                <option value="">-- Select Transporter --</option>
                {transporters.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <span>Payment Mode :</span>
              <select value={paymentModeFilter} onChange={(e) => setPaymentModeFilter(e.target.value)} className="border px-1 py-0.5 text-[11px]">
                <option value="">---Select Mode---</option>
                <option value="Cash">Cash in Hand</option>
                <option value="Net Banking">Net Banking</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <button onClick={handleSearch} className="border px-3 py-1 bg-gray-100 hover:bg-gray-200 text-[11px]">
              Search
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-0">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-[#D4A59A] text-black">
                <th className="border border-[#c99] px-3 py-2 text-left font-semibold">S.No.</th>
                <th className="border border-[#c99] px-3 py-2 text-left font-semibold">Transporter</th>
                <th className="border border-[#c99] px-3 py-2 text-left font-semibold">Payment</th>
                <th className="border border-[#c99] px-3 py-2 text-left font-semibold">Date</th>
                <th className="border border-[#c99] px-3 py-2 text-left font-semibold">Payment Mode</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment, index) => (
                <tr key={payment.id} className={index % 2 === 0 ? "bg-[#F5E6E0]" : "bg-[#FDE1E1]"}>
                  <td className="border border-[#c99] px-3 py-2 align-top">{index + 1}</td>
                  <td className="border border-[#c99] px-3 py-2 align-top">
                    {payment.vehicle_booking?.transporters?.name || "-"}
                  </td>
                  <td className="border border-[#c99] px-3 py-2 align-top">
                    Rs. {payment.amount?.toLocaleString("en-IN")} /-
                  </td>
                  <td className="border border-[#c99] px-3 py-2 align-top">
                    {payment.payment_date ? format(new Date(payment.payment_date), "dd/MM/yyyy") : "-"}
                  </td>
                  <td className="border border-[#c99] px-3 py-2 align-top">
                    <div><strong>Payment Mode :</strong> {payment.payment_mode || "-"}</div>
                    <div><strong>Payment Detail :</strong> {payment.notes || `Rs ${payment.amount?.toLocaleString("en-IN")} paid`}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPayments.length === 0 && (
            <div className="text-center py-12 text-muted-foreground bg-[#F5E6E0]">
              No vehicle payments found
            </div>
          )}
        </div>

        {/* Summary Footer */}
        <div className="bg-[#FDE1E1] border border-[#FFC1C1] p-3 mt-0">
          <div className="text-sm font-semibold">
            Total Payments: Rs. {totalPayments.toLocaleString("en-IN")} /-
          </div>
        </div>
      </main>
    </div>
  );
}
