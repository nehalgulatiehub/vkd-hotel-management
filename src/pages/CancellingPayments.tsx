import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function CancellingPayments() {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    const { data, error } = await supabase
      .from("refunds")
      .select(`
        *,
        bookings(booking_number, customer_name, contact_no),
        cancellations(cancellation_reason)
      `)
      .order("refund_date", { ascending: false });
    
    if (error) {
      toast.error("Failed to load refund payments");
    } else {
      setRefunds(data || []);
    }
  };

  const filteredRefunds = refunds.filter(refund =>
    refund.bookings?.booking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    refund.bookings?.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRefunds = filteredRefunds.reduce((sum, refund) => sum + (refund.refund_amount || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Header title="Cancelling Payments" />
      <main className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">View Cancelling Payments</h2>
          <p className="text-muted-foreground mt-2">
            Total Refunds: <span className="font-bold text-lg text-orange-600">₹{totalRefunds.toLocaleString()}</span>
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by booking number or customer..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Booking No</th>
                    <th className="text-left p-4 font-semibold">Customer</th>
                    <th className="text-left p-4 font-semibold">Contact</th>
                    <th className="text-left p-4 font-semibold">Refund Date</th>
                    <th className="text-left p-4 font-semibold">Refund Amount</th>
                    <th className="text-left p-4 font-semibold">Refund Mode</th>
                    <th className="text-left p-4 font-semibold">Reference</th>
                    <th className="text-left p-4 font-semibold">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRefunds.map((refund) => (
                    <tr key={refund.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">{refund.bookings?.booking_number || "-"}</td>
                      <td className="p-4">{refund.bookings?.customer_name || "-"}</td>
                      <td className="p-4">{refund.bookings?.contact_no || "-"}</td>
                      <td className="p-4">
                        {refund.refund_date ? new Date(refund.refund_date).toLocaleDateString() : "-"}
                      </td>
                      <td className="p-4 font-bold text-orange-600">
                        ₹{refund.refund_amount?.toLocaleString() || 0}
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{refund.refund_mode || "N/A"}</Badge>
                      </td>
                      <td className="p-4">{refund.reference_number || "-"}</td>
                      <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">
                        {refund.cancellations?.cancellation_reason || refund.notes || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredRefunds.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No cancelling payments found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
