import { useState, useEffect } from "react";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function AdminAddSafariPayment() {
  const { isAdmin, isAccount, user, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [transporters, setTransporters] = useState<{ id: string; name: string }[]>([]);
  const [selectedTransporter, setSelectedTransporter] = useState("");
  const [payment, setPayment] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [chequeNo, setChequeNo] = useState("");
  const [paymentDetail, setPaymentDetail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManage = isAdmin() || isAccount();

  useEffect(() => {
    if (!authLoading && canManage) {
      fetchTransporters();
    }
  }, [authLoading]);

  const fetchTransporters = async () => {
    const { data } = await supabase.from("transporters").select("id, name").order("name");
    if (data) setTransporters(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!payment || !paymentMode || !selectedTransporter) {
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
        payment_type: "safari_direct",
        payment_date: new Date().toISOString().split('T')[0],
        created_by: user?.id,
        approval_status: "pending",
        transporter_id: selectedTransporter || null
      });

      if (error) throw error;

      toast.success("Safari payment added successfully");
      handleReset();
    } catch (error) {
      console.error("Error adding payment:", error);
      toast.error("Failed to add payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedTransporter("");
    setPayment("");
    setPaymentMode("");
    setChequeNo("");
    setPaymentDetail("");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen">
        <AdminHeader title="Add Safari Payment" />
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
      <AdminHeader title="Add Safari Payment" />
      <main className="p-4">
        <div className="max-w-3xl mx-auto border border-gray-300">
          {/* Header */}
          <div 
            className="py-2 px-4 text-white text-sm font-medium"
            style={{ backgroundColor: '#9b6b6b' }}
          >
            Add Safari Payment
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

              {/* Transporter - with gray background */}
              <div 
                className="flex items-center gap-4 py-2 px-4 -mx-6"
                style={{ backgroundColor: '#e8e8e8' }}
              >
                <label className="w-28 text-right text-sm">Transporter</label>
                <div className="flex-1">
                  <select
                    value={selectedTransporter}
                    onChange={(e) => setSelectedTransporter(e.target.value)}
                    className="w-full max-w-lg h-8 px-2 border border-gray-300 rounded text-sm"
                    required
                  >
                    <option value="">---Select---</option>
                    {transporters.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
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
