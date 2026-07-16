import { Header } from "@/components/layout/Header";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const days = Array.from({ length: 31 }, (_, i) => i + 1);
const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

export default function CancellingPayments() {
  const navigate = useNavigate();
  const [refunds, setRefunds] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  
  const [fromMonth, setFromMonth] = useState(months[new Date().getMonth()]);
  const [fromDay, setFromDay] = useState(new Date().getDate());
  const [fromYear, setFromYear] = useState(new Date().getFullYear());
  const [toMonth, setToMonth] = useState(months[new Date().getMonth()]);
  const [toDay, setToDay] = useState(new Date().getDate());
  const [toYear, setToYear] = useState(new Date().getFullYear());
  const [searchWithDate, setSearchWithDate] = useState(false);
  const [paymentModeFilter, setPaymentModeFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [chequeNoFilter, setChequeNoFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [paymentForFilter, setPaymentForFilter] = useState("");

  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [viewPaymentOpen, setViewPaymentOpen] = useState(false);
  const [bookingPayments, setBookingPayments] = useState<any[]>([]);

  useEffect(() => {
    fetchRefunds();
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("id, first_name, last_name").order("first_name");
    setProfiles(data || []);
  };

  const fetchRefunds = async () => {
    const { data, error } = await supabase
      .from("refunds")
      .select(`
        *,
        bookings(id, booking_number, customer_name, contact_no, check_in_date, check_out_date, adults, children, total_amount, paid_amount, due_amount),
        cancellations(cancellation_reason)
      `)
      .order("refund_date", { ascending: false });
    
    if (error) {
      toast.error("Failed to load refund payments");
    } else {
      setRefunds(data || []);
    }
  };

  const handleSearch = () => {
    fetchRefunds();
  };

  const filteredRefunds = refunds.filter(refund => {
    let matchesDate = true;
    if (searchWithDate && refund.refund_date) {
      const refundDate = new Date(refund.refund_date);
      const fromDate = new Date(fromYear, months.indexOf(fromMonth), fromDay);
      const toDate = new Date(toYear, months.indexOf(toMonth), toDay);
      matchesDate = refundDate >= fromDate && refundDate <= toDate;
    }

    const matchesPaymentMode = !paymentModeFilter || refund.refund_mode === paymentModeFilter;
    const matchesCustomer = !customerFilter || 
      refund.bookings?.customer_name?.toLowerCase().includes(customerFilter.toLowerCase());

    return matchesDate && matchesPaymentMode && matchesCustomer;
  });

  const totalRefunds = filteredRefunds.reduce((sum, refund) => sum + (refund.refund_amount || 0), 0);

  const handleViewDetails = (refund: any) => {
    setSelectedBooking(refund.bookings);
    setViewDetailsOpen(true);
  };

  const handleViewPayment = async (refund: any) => {
    if (!refund.bookings?.id) return;
    
    const { data } = await supabase
      .from("payments")
      .select("*")
      .eq("booking_id", refund.bookings.id)
      .order("payment_date", { ascending: false });
    
    setBookingPayments(data || []);
    setSelectedBooking(refund.bookings);
    setViewPaymentOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="View Cancelling Payment" />
      <main className="p-4">
        {/* Header Bar */}
        <div className="bg-[#1e6e99] text-white px-4 py-2 flex justify-between items-center">
          <span className="font-semibold">View Cancelling Payment</span>
          <Link to="/cancelled-bookings" className="text-white hover:underline text-sm">View All Records</Link>
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
          <div className="flex flex-wrap items-center gap-4 mb-2 text-[11px]">
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

            <div className="flex items-center gap-1">
              <span>Customer :</span>
              <input 
                type="text" 
                value={customerFilter} 
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="border px-1 py-0.5 text-[11px] w-32"
              />
            </div>

            <div className="flex items-center gap-1">
              <span>User :</span>
              <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="border px-1 py-0.5 text-[11px]">
                <option value="">--Select--</option>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.username || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown'}</option>)}
              </select>
            </div>
          </div>

          {/* Row 3 */}
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1">
              <span>Cheque No :</span>
              <input 
                type="text" 
                value={chequeNoFilter} 
                onChange={(e) => setChequeNoFilter(e.target.value)}
                className="border px-1 py-0.5 text-[11px] w-32"
              />
            </div>

            <div className="flex items-center gap-1">
              <span>Payment :</span>
              <input 
                type="text" 
                value={paymentFilter} 
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="border px-1 py-0.5 text-[11px] w-32"
              />
            </div>

            <div className="flex items-center gap-1">
              <span>Payment For :</span>
              <select value={paymentForFilter} onChange={(e) => setPaymentForFilter(e.target.value)} className="border px-1 py-0.5 text-[11px]">
                <option value="">---Select Payment---</option>
                <option value="hotel">Hotel</option>
                <option value="safari">Safari</option>
                <option value="volvo">Volvo</option>
                <option value="vehicle">Vehicle</option>
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
                <th className="border border-[#c99] px-3 py-2 text-left font-semibold">Booking</th>
                <th className="border border-[#c99] px-3 py-2 text-left font-semibold">Customer Name</th>
                <th className="border border-[#c99] px-3 py-2 text-left font-semibold">Refund Payment<br/>Payment Mode</th>
                <th className="border border-[#c99] px-3 py-2 text-left font-semibold">Payment Detail</th>
                <th className="border border-[#c99] px-3 py-2 text-left font-semibold">Detail</th>
              </tr>
            </thead>
            <tbody>
              {filteredRefunds.map((refund, index) => (
                <tr key={refund.id} className={index % 2 === 0 ? "bg-[#F5E6E0]" : "bg-[#FDE1E1]"}>
                  <td className="border border-[#c99] px-3 py-2 align-top">{index + 1}</td>
                  <td className="border border-[#c99] px-3 py-2 align-top">
                    <div><strong>Booking:</strong></div>
                    <div>{refund.bookings?.check_in_date ? format(new Date(refund.bookings.check_in_date), "dd/MM/yyyy") : "-"} -</div>
                    <div>{refund.bookings?.check_out_date ? format(new Date(refund.bookings.check_out_date), "dd/MM/yyyy") : "-"}</div>
                    <div><strong>No. of Rooms:</strong></div>
                    <div>Adult Children</div>
                    <div><strong>Price:</strong> Rs. /-</div>
                  </td>
                  <td className="border border-[#c99] px-3 py-2 align-top">
                    <div>{refund.bookings?.customer_name || "-"}</div>
                    <div className="text-muted-foreground">
                      Contact No.:<br/>
                      {refund.bookings?.contact_no || "-"}
                    </div>
                  </td>
                  <td className="border border-[#c99] px-3 py-2 align-top">
                    <div>{refund.refund_amount?.toLocaleString("en-IN") || 0}</div>
                    <div>Pay Mode: {refund.refund_mode || "-"}</div>
                  </td>
                  <td className="border border-[#c99] px-3 py-2 align-top">
                    rs {refund.refund_amount?.toLocaleString("en-IN")} paid from icici mukut on {refund.refund_date ? format(new Date(refund.refund_date), "dd/MM/yyyy") : "-"} by ref no {refund.reference_number || "-"}
                  </td>
                  <td className="border border-[#c99] px-3 py-2 align-top">
                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={() => handleViewDetails(refund)}
                        className="text-[#1e6e99] hover:underline text-left text-xs"
                      >
                        View Details
                      </button>
                      <button 
                        onClick={() => handleViewPayment(refund)}
                        className="text-[#1e6e99] hover:underline text-left text-xs"
                      >
                        View Payment
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRefunds.length === 0 && (
            <div className="text-center py-12 text-muted-foreground bg-[#F5E6E0]">
              No cancelling payments found
            </div>
          )}
        </div>

        {/* Summary Footer */}
        <div className="bg-[#FDE1E1] border border-[#FFC1C1] p-3 mt-0">
          <div className="text-sm font-semibold">
            Total Refunds: Rs. {totalRefunds.toLocaleString("en-IN")} /-
          </div>
        </div>

        {/* View Details Dialog */}
        <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="bg-[#1e6e99] text-white px-4 py-2 -m-6 mb-4">Booking Details</DialogTitle>
            </DialogHeader>
            {selectedBooking && (
              <div className="text-sm space-y-2 pt-4">
                <div><strong>Booking No:</strong> {selectedBooking.booking_number}</div>
                <div><strong>Customer:</strong> {selectedBooking.customer_name}</div>
                <div><strong>Contact:</strong> {selectedBooking.contact_no}</div>
                <div><strong>Check-in:</strong> {selectedBooking.check_in_date ? format(new Date(selectedBooking.check_in_date), "dd/MM/yyyy") : "-"}</div>
                <div><strong>Check-out:</strong> {selectedBooking.check_out_date ? format(new Date(selectedBooking.check_out_date), "dd/MM/yyyy") : "-"}</div>
                <div><strong>Adults:</strong> {selectedBooking.adults || 0}</div>
                <div><strong>Children:</strong> {selectedBooking.children || 0}</div>
                <div><strong>Total Amount:</strong> Rs. {selectedBooking.total_amount?.toLocaleString("en-IN")} /-</div>
                <div><strong>Paid Amount:</strong> Rs. {selectedBooking.paid_amount?.toLocaleString("en-IN")} /-</div>
                <div><strong>Due Amount:</strong> Rs. {selectedBooking.due_amount?.toLocaleString("en-IN")} /-</div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* View Payment Dialog */}
        <Dialog open={viewPaymentOpen} onOpenChange={setViewPaymentOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="bg-[#1e6e99] text-white px-4 py-2 -m-6 mb-4">Payment History</DialogTitle>
            </DialogHeader>
            {selectedBooking && (
              <div className="pt-4">
                <div className="bg-[#F5E6E0] p-3 mb-4 rounded flex justify-between text-sm">
                  <span><strong>Total:</strong> Rs. {selectedBooking.total_amount?.toLocaleString("en-IN")} /-</span>
                  <span><strong>Received:</strong> Rs. {selectedBooking.paid_amount?.toLocaleString("en-IN")} /-</span>
                  <span><strong>Due:</strong> Rs. {selectedBooking.due_amount?.toLocaleString("en-IN")} /-</span>
                </div>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#D4A59A]">
                      <th className="border border-[#c99] px-2 py-1 text-left">Date</th>
                      <th className="border border-[#c99] px-2 py-1 text-left">Amount</th>
                      <th className="border border-[#c99] px-2 py-1 text-left">Mode</th>
                      <th className="border border-[#c99] px-2 py-1 text-left">Reference</th>
                      <th className="border border-[#c99] px-2 py-1 text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookingPayments.map((payment, idx) => (
                      <tr key={payment.id} className={idx % 2 === 0 ? "bg-[#F5E6E0]" : "bg-[#FDE1E1]"}>
                        <td className="border border-[#c99] px-2 py-1">{payment.payment_date ? format(new Date(payment.payment_date), "dd/MM/yyyy") : "-"}</td>
                        <td className="border border-[#c99] px-2 py-1">Rs. {payment.amount?.toLocaleString("en-IN")} /-</td>
                        <td className="border border-[#c99] px-2 py-1">{payment.payment_mode}</td>
                        <td className="border border-[#c99] px-2 py-1">{payment.reference_number || "-"}</td>
                        <td className="border border-[#c99] px-2 py-1">{payment.notes || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {bookingPayments.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">No payments found</div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
