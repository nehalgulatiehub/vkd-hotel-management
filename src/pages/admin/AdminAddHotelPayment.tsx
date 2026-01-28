import { useState, useEffect } from "react";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function AdminAddHotelPayment() {
  const { isAdmin, isAccount, user, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [hotels, setHotels] = useState<{ id: string; name: string }[]>([]);
  const [selectedHotel, setSelectedHotel] = useState("");
  const [payment, setPayment] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [chequeNo, setChequeNo] = useState("");
  const [paymentDetail, setPaymentDetail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManage = isAdmin() || isAccount();

  useEffect(() => {
    if (!authLoading && canManage) {
      fetchHotels();
    }
  }, [authLoading]);

  const fetchHotels = async () => {
    const { data } = await supabase.from("another_hotels").select("id, name").order("name");
    if (data) setHotels(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!payment || !paymentMode || !selectedHotel) {
      toast.error("Please fill in required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("payments").insert({
        amount: parseFloat(payment),
        payment_mode: paymentMode,
        reference_number: chequeNo || null,
        notes: paymentDetail || null,
        payment_type: "hotel_direct",
        payment_date: new Date().toISOString().split('T')[0],
        created_by: user?.id,
        approval_status: "pending",
        hotel_id: selectedHotel || null
      });

      if (error) throw error;

      toast.success("Hotel payment added successfully");
      handleReset();
    } catch (error) {
      console.error("Error adding payment:", error);
      toast.error("Failed to add payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedHotel("");
    setPayment("");
    setPaymentMode("");
    setChequeNo("");
    setPaymentDetail("");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen">
        <AdminHeader title="Add Another Hotel Payment" />
        <main className="p-4 text-center text-muted-foreground">Loading...</main>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="min-h-screen">
        <AdminHeader title="Access Denied" />
        <main className="p-4 text-center text-muted-foreground">Access denied.</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AdminHeader title="Add Another Hotel Payment" />
      <main className="p-4">
        <div className="flex justify-end mb-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate("/admin/hotel-pending")}
            className="text-xs"
          >
            Manage Hotel Payment
          </Button>
        </div>

        <div className="max-w-3xl mx-auto border border-gray-300">
          {/* Header */}
          <div 
            className="py-2 px-4 text-white text-sm font-medium"
            style={{ backgroundColor: '#9b6b6b' }}
          >
            Add Another Hotel Payment
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 bg-white">
            <div className="text-right text-xs mb-4">
              <span className="text-destructive">*</span> - Required Fields
            </div>

            <div className="space-y-4">
              {/* Payment */}
              <div className="flex items-center gap-4">
                <label className="w-32 text-right text-sm">Payment</label>
                <div className="flex-1 max-w-md">
                  <Input
                    type="number"
                    value={payment}
                    onChange={(e) => setPayment(e.target.value)}
                    className="h-8"
                    required
                  />
                  <span className="text-destructive text-xs ml-1">*</span>
                </div>
              </div>

              {/* Payment Mode */}
              <div className="flex items-center gap-4">
                <label className="w-32 text-right text-sm">Payment Mode</label>
                <div className="flex-1 max-w-md">
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-auto h-8 px-2 border border-gray-300 rounded text-sm"
                    required
                  >
                    <option value="">---Select Mode---</option>
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="net banking">Net Banking</option>
                    <option value="credit card">Credit Card</option>
                    <option value="cheque">Cheque</option>
                  </select>
                  <div className="text-xs text-gray-500 mt-1">
                    If payment mode is cheque then write cheque no
                  </div>
                </div>
              </div>

              {/* Cheque No */}
              <div className="flex items-center gap-4">
                <label className="w-32 text-right text-sm">Cheque No.</label>
                <div className="flex-1 max-w-md">
                  <Input
                    type="text"
                    value={chequeNo}
                    onChange={(e) => setChequeNo(e.target.value)}
                    className="h-8 w-48"
                  />
                </div>
              </div>

              {/* Payment Detail */}
              <div className="flex items-start gap-4">
                <label className="w-32 text-right text-sm pt-2">Payment Detail</label>
                <div className="flex-1 max-w-md">
                  <Textarea
                    value={paymentDetail}
                    onChange={(e) => setPaymentDetail(e.target.value)}
                    rows={4}
                    className="resize-y"
                  />
                </div>
              </div>

              {/* Another Hotel - with gray background */}
              <div 
                className="flex items-center gap-4 py-2 px-4 -mx-6"
                style={{ backgroundColor: '#e8e8e8' }}
              >
                <label className="w-28 text-right text-sm">Another Hotel</label>
                <div className="flex-1">
                  <select
                    value={selectedHotel}
                    onChange={(e) => setSelectedHotel(e.target.value)}
                    className="w-full max-w-lg h-8 px-2 border border-gray-300 rounded text-sm"
                    required
                  >
                    <option value="">--Select--</option>
                    {hotels.map(hotel => (
                      <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-center gap-2 mt-6">
              <Button type="submit" size="sm" disabled={isSubmitting} className="px-6">
                Submit
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleReset} className="px-6">
                Reset
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
