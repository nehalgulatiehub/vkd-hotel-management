import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSearchParams, useNavigate } from "react-router-dom";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/TablePagination";

export default function Refunds() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get("id");
  
  const [bookings, setBookings] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [cancellations, setCancellations] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    booking_id: "",
    cancellation_id: "",
    refund_amount: "",
    refund_mode: "",
    reference_number: "",
    notes: ""
  });

  useEffect(() => {
    fetchBookings();
    fetchRefunds();
    fetchCancellations();
    
    if (bookingId) {
      fetchBookingById(bookingId);
    }
  }, [bookingId]);

  const fetchBookings = async () => {
    const { data } = await supabase
      .from("bookings")
      .select("*, agents(name)")
      .eq("status", "cancelled")
      .order("created_at", { ascending: false });
    setBookings(data || []);
  };

  const fetchRefunds = async () => {
    const { data } = await supabase
      .from("refunds")
      .select("*, bookings(booking_number, customer_name), cancellations(cancellation_reason)")
      .order("created_at", { ascending: false });
    setRefunds(data || []);
  };

  const fetchCancellations = async () => {
    const { data } = await supabase
      .from("cancellations")
      .select("*, bookings(booking_number, customer_name)")
      .order("created_at", { ascending: false });
    setCancellations(data || []);
  };

  const fetchBookingById = async (id: string) => {
    const { data } = await supabase
      .from("bookings")
      .select("*, agents(name)")
      .eq("id", id)
      .single();
    
    if (data) {
      setSelectedBooking(data);
      const { data: cancelData } = await supabase
        .from("cancellations")
        .select("*")
        .eq("booking_id", id)
        .single();
      
      setFormData({
        booking_id: id,
        cancellation_id: cancelData?.id || "",
        refund_amount: data.paid_amount?.toString() || "",
        refund_mode: "",
        reference_number: "",
        notes: ""
      });
      setShowForm(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from("refunds")
        .insert({
          booking_id: formData.booking_id,
          cancellation_id: formData.cancellation_id || null,
          refund_amount: parseFloat(formData.refund_amount),
          refund_mode: formData.refund_mode,
          reference_number: formData.reference_number,
          notes: formData.notes,
          refund_date: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;

      toast.success("Refund processed successfully");
      setShowForm(false);
      setSelectedBooking(null);
      fetchRefunds();
      
      setFormData({
        booking_id: "",
        cancellation_id: "",
        refund_amount: "",
        refund_mode: "",
        reference_number: "",
        notes: ""
      });
    } catch (error) {
      console.error("Error processing refund:", error);
      toast.error("Failed to process refund");
    }
  };

  const {
    paginatedItems,
    currentPage,
    totalPages,
    goToPage,
    totalItems,
    startIndex,
    endIndex,
  } = usePagination(refunds, { itemsPerPage: 10 });

  return (
    <div className="min-h-screen bg-background">
      <Header title="Refunds Management" />
      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">
            {showForm ? "Process Refund" : "View Refunds"}
          </h2>
          <Button 
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) {
                setSelectedBooking(null);
                navigate("/refunds");
              }
            }}
          >
            {showForm ? "View Refunds" : "Process Refund"}
          </Button>
        </div>

        {showForm ? (
          <Card>
            <CardHeader>
              <CardTitle>Process Refund</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!bookingId && (
                  <div className="space-y-2">
                    <Label>Select Cancelled Booking</Label>
                    <Select
                      value={formData.booking_id}
                      onValueChange={(value) => {
                        const booking = bookings.find(b => b.id === value);
                        setSelectedBooking(booking);
                        setFormData({
                          ...formData,
                          booking_id: value,
                          refund_amount: booking?.paid_amount?.toString() || ""
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select booking" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50">
                        {bookings.map((booking) => (
                          <SelectItem key={booking.id} value={booking.id}>
                            {booking.booking_number} - {booking.customer_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedBooking && (
                  <>
                    <div className="bg-muted p-4 rounded-lg space-y-2">
                      <p><strong>Booking:</strong> {selectedBooking.booking_number}</p>
                      <p><strong>Customer:</strong> {selectedBooking.customer_name}</p>
                      <p><strong>Total Paid:</strong> Rs. {selectedBooking.paid_amount || 0}/-</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Refund Amount <span className="text-destructive">*</span></Label>
                      <Input
                        type="number"
                        step="0.01"
                        required
                        value={formData.refund_amount}
                        onChange={(e) => setFormData({ ...formData, refund_amount: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Refund Mode <span className="text-destructive">*</span></Label>
                      <Select
                        required
                        value={formData.refund_mode}
                        onValueChange={(value) => setFormData({ ...formData, refund_mode: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-50">
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Reference Number</Label>
                      <Input
                        value={formData.reference_number}
                        onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                        placeholder="Transaction/Cheque number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={4}
                      />
                    </div>

                    <div className="flex gap-4">
                      <Button type="submit">Process Refund</Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setShowForm(false);
                          setSelectedBooking(null);
                          navigate("/refunds");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-left">S.No.</th>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Booking No</th>
                      <th className="p-3 text-left">Customer</th>
                      <th className="p-3 text-left">Refund Amount</th>
                      <th className="p-3 text-left">Mode</th>
                      <th className="p-3 text-left">Reference</th>
                      <th className="p-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-muted-foreground">
                          No refunds found
                        </td>
                      </tr>
                    ) : (
                      paginatedItems.map((refund, index) => (
                        <tr key={refund.id} className="border-t hover:bg-muted/50">
                          <td className="p-3">{startIndex + index}</td>
                          <td className="p-3">{new Date(refund.refund_date).toLocaleDateString()}</td>
                          <td className="p-3">{refund.bookings?.booking_number}</td>
                          <td className="p-3">{refund.bookings?.customer_name}</td>
                          <td className="p-3">Rs. {refund.refund_amount?.toFixed(2) || "0.00"}/-</td>
                          <td className="p-3 capitalize">{refund.refund_mode}</td>
                          <td className="p-3">{refund.reference_number || "-"}</td>
                          <td className="p-3">
                            <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              Processed
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
                totalItems={totalItems}
                startIndex={startIndex}
                endIndex={endIndex}
              />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
