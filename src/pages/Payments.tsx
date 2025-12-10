import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/TablePagination";

export default function Payments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from("payments")
      .select("*, bookings(booking_number, customer_name, contact_no)")
      .order("payment_date", { ascending: false });

    if (error) {
      toast.error("Failed to load payments");
    } else {
      setPayments(data || []);
    }
  };

  const filteredPayments = payments.filter(payment =>
    payment.bookings?.booking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.bookings?.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.reference_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPayments = filteredPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

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
      <Header title="All Payments" />
      <main className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Payment Records</h2>
          <p className="text-muted-foreground mt-2">
            Total Payments: <span className="font-bold text-lg text-green-600">₹{totalPayments.toLocaleString()}</span>
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by booking number, customer, or reference..."
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
                    <th className="text-left p-4 font-semibold">S.No.</th>
                    <th className="text-left p-4 font-semibold">Date</th>
                    <th className="text-left p-4 font-semibold">Booking No</th>
                    <th className="text-left p-4 font-semibold">Customer</th>
                    <th className="text-left p-4 font-semibold">Contact</th>
                    <th className="text-left p-4 font-semibold">Amount</th>
                    <th className="text-left p-4 font-semibold">Mode</th>
                    <th className="text-left p-4 font-semibold">Reference</th>
                    <th className="text-left p-4 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((payment, index) => (
                    <tr key={payment.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">{startIndex + index}</td>
                      <td className="p-4">
                        {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : "-"}
                      </td>
                      <td className="p-4 font-medium">{payment.bookings?.booking_number || "-"}</td>
                      <td className="p-4">{payment.bookings?.customer_name || "-"}</td>
                      <td className="p-4">{payment.bookings?.contact_no || "-"}</td>
                      <td className="p-4 font-bold text-green-600">₹{payment.amount?.toLocaleString() || 0}</td>
                      <td className="p-4">
                        <Badge variant="outline" className="capitalize">
                          {payment.payment_mode || "N/A"}
                        </Badge>
                      </td>
                      <td className="p-4">{payment.reference_number || "-"}</td>
                      <td className="p-4 max-w-xs truncate">{payment.notes || "-"}</td>
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
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
