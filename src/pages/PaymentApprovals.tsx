import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface PendingPayment {
  id: string;
  type: "booking" | "restaurant" | "refund";
  booking_number?: string;
  invoice_number?: string;
  customer_name?: string;
  amount: number;
  payment_mode: string;
  payment_date: string;
  approval_status: string;
}

export default function PaymentApprovals() {
  const { isAdmin, isAccount, canApprovePayment, user } = useAuthContext();
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");

  const canView = isAdmin() || isAccount();

  useEffect(() => {
    if (canView) {
      fetchPayments();
    }
  }, [canView, activeTab]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const allPayments: PendingPayment[] = [];

      // Fetch booking payments
      const { data: bookingPayments, error: bpError } = await supabase
        .from("payments")
        .select(`
          id,
          amount,
          payment_mode,
          payment_date,
          approval_status,
          booking:bookings(booking_number, customer_name)
        `)
        .eq("approval_status", activeTab === "pending" ? "pending" : activeTab);

      if (bpError) throw bpError;

      bookingPayments?.forEach((p: any) => {
        allPayments.push({
          id: p.id,
          type: "booking",
          booking_number: p.booking?.booking_number,
          customer_name: p.booking?.customer_name,
          amount: p.amount,
          payment_mode: p.payment_mode || "Unknown",
          payment_date: p.payment_date,
          approval_status: p.approval_status || "pending",
        });
      });

      // Fetch restaurant payments
      const { data: restaurantPayments, error: rpError } = await supabase
        .from("restaurant_payments")
        .select(`
          id,
          amount,
          payment_mode,
          payment_date,
          approval_status,
          invoice:restaurant_invoices(invoice_number, customer_name)
        `)
        .eq("approval_status", activeTab === "pending" ? "pending" : activeTab);

      if (rpError) throw rpError;

      restaurantPayments?.forEach((p: any) => {
        allPayments.push({
          id: p.id,
          type: "restaurant",
          invoice_number: p.invoice?.invoice_number,
          customer_name: p.invoice?.customer_name,
          amount: p.amount,
          payment_mode: p.payment_mode || "Unknown",
          payment_date: p.payment_date,
          approval_status: p.approval_status || "pending",
        });
      });

      // Fetch refunds
      const { data: refunds, error: rError } = await supabase
        .from("refunds")
        .select(`
          id,
          refund_amount,
          refund_mode,
          refund_date,
          approval_status,
          booking:bookings(booking_number, customer_name)
        `)
        .eq("approval_status", activeTab === "pending" ? "pending" : activeTab);

      if (rError) throw rError;

      refunds?.forEach((r: any) => {
        allPayments.push({
          id: r.id,
          type: "refund",
          booking_number: r.booking?.booking_number,
          customer_name: r.booking?.customer_name,
          amount: r.refund_amount,
          payment_mode: r.refund_mode || "Unknown",
          payment_date: r.refund_date,
          approval_status: r.approval_status || "pending",
        });
      });

      setPayments(allPayments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (payment: PendingPayment, status: "approved" | "rejected") => {
    if (!canApprovePayment(payment.payment_mode)) {
      toast.error("You cannot approve cash payments");
      return;
    }

    try {
      const updateData = {
        approval_status: status,
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
      };

      let error = null;
      
      switch (payment.type) {
        case "booking":
          const { error: bError } = await supabase
            .from("payments")
            .update(updateData)
            .eq("id", payment.id);
          error = bError;
          break;
        case "restaurant":
          const { error: rError } = await supabase
            .from("restaurant_payments")
            .update(updateData)
            .eq("id", payment.id);
          error = rError;
          break;
        case "refund":
          const { error: refError } = await supabase
            .from("refunds")
            .update(updateData)
            .eq("id", payment.id);
          error = refError;
          break;
      }

      if (error) throw error;

      toast.success(`Payment ${status} successfully`);
      fetchPayments();
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Failed to update payment status");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "booking":
        return <Badge variant="outline">Booking</Badge>;
      case "restaurant":
        return <Badge variant="outline">Restaurant</Badge>;
      case "refund":
        return <Badge variant="outline">Refund</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (!canView) {
    return (
      <div className="min-h-screen">
        <Header title="Access Denied" />
        <main className="p-4">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              You don't have permission to access this page.
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Payment Approvals" />
      <main className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Payment Approval Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No {activeTab} payments found
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        {activeTab === "pending" && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={`${payment.type}-${payment.id}`}>
                          <TableCell>{getTypeBadge(payment.type)}</TableCell>
                          <TableCell>
                            {payment.booking_number || payment.invoice_number || "-"}
                          </TableCell>
                          <TableCell>{payment.customer_name || "-"}</TableCell>
                          <TableCell>₹{payment.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{payment.payment_mode}</Badge>
                          </TableCell>
                          <TableCell>
                            {payment.payment_date
                              ? format(new Date(payment.payment_date), "dd/MM/yyyy")
                              : "-"}
                          </TableCell>
                          <TableCell>{getStatusBadge(payment.approval_status)}</TableCell>
                          {activeTab === "pending" && (
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-7 w-7 text-green-600 hover:text-green-700"
                                  onClick={() => handleApproval(payment, "approved")}
                                  disabled={!canApprovePayment(payment.payment_mode)}
                                  title={
                                    !canApprovePayment(payment.payment_mode)
                                      ? "Account users cannot approve cash payments"
                                      : "Approve payment"
                                  }
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-7 w-7 text-red-600 hover:text-red-700"
                                  onClick={() => handleApproval(payment, "rejected")}
                                  disabled={!canApprovePayment(payment.payment_mode)}
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {isAccount() && !isAdmin() && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="py-4 text-sm text-amber-800">
              <strong>Note:</strong> As an Account user, you can approve all payment types except cash payments.
              Cash payments require Admin approval.
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
