import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowLeft, Printer, Download, CreditCard, Check } from "lucide-react";

interface OrderItem {
  id: string;
  food_item_name: string;
  quantity: number;
  unit_price: number;
  gst_percentage: number;
  cgst_amount: number;
  sgst_amount: number;
  total_price: number;
}

interface RestaurantOrder {
  id: string;
  order_number: string;
  order_type: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  subtotal: number;
  cgst_amount: number;
  sgst_amount: number;
  total_amount: number;
  created_at: string;
  restaurant_tables?: { table_number: string; table_name: string | null };
  restaurant_order_items?: OrderItem[];
}

interface Invoice {
  id: string;
  invoice_number: string;
  payment_status: string;
  payment_mode: string | null;
}

const RestaurantInvoice = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState<string>("cash");
  const [splitPayments, setSplitPayments] = useState([
    { mode: "cash", amount: "" },
    { mode: "upi", amount: "" }
  ]);

  const { data: order, isLoading } = useQuery({
    queryKey: ["restaurant-order", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurant_orders")
        .select("*, restaurant_tables(table_number, table_name), restaurant_order_items(*)")
        .eq("id", orderId)
        .single();
      if (error) throw error;
      return data as RestaurantOrder;
    },
    enabled: !!orderId
  });

  const { data: invoice } = useQuery({
    queryKey: ["restaurant-invoice", orderId],
    queryFn: async () => {
      const { data } = await supabase
        .from("restaurant_invoices")
        .select("*")
        .eq("order_id", orderId)
        .single();
      return data as Invoice | null;
    },
    enabled: !!orderId
  });

  const generateInvoiceNumber = () => {
    const date = new Date();
    const prefix = "INV";
    const timestamp = date.getFullYear().toString().slice(-2) +
      String(date.getMonth() + 1).padStart(2, "0") +
      String(date.getDate()).padStart(2, "0") +
      String(date.getHours()).padStart(2, "0") +
      String(date.getMinutes()).padStart(2, "0") +
      String(date.getSeconds()).padStart(2, "0");
    return `${prefix}${timestamp}`;
  };

  const processPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!order) throw new Error("Order not found");

      const invoiceNumber = invoice?.invoice_number || generateInvoiceNumber();
      const isSplit = paymentMode === "split";

      // Create or update invoice
      if (invoice) {
        const { error } = await supabase
          .from("restaurant_invoices")
          .update({
            payment_status: "paid",
            payment_mode: paymentMode
          })
          .eq("id", invoice.id);
        if (error) throw error;
      } else {
        const { data: newInvoice, error } = await supabase
          .from("restaurant_invoices")
          .insert({
            invoice_number: invoiceNumber,
            order_id: order.id,
            customer_name: order.customer_name,
            customer_phone: order.customer_phone,
            customer_address: order.customer_address,
            subtotal: order.subtotal,
            cgst_amount: order.cgst_amount,
            sgst_amount: order.sgst_amount,
            total_amount: order.total_amount,
            payment_status: "paid",
            payment_mode: paymentMode
          })
          .select()
          .single();
        if (error) throw error;

        // Create payment records
        if (isSplit) {
          const payments = splitPayments
            .filter(p => parseFloat(p.amount) > 0)
            .map(p => ({
              invoice_id: newInvoice.id,
              amount: parseFloat(p.amount),
              payment_mode: p.mode
            }));
          const { error: payError } = await supabase.from("restaurant_payments").insert(payments);
          if (payError) throw payError;
        } else {
          const { error: payError } = await supabase.from("restaurant_payments").insert({
            invoice_id: newInvoice.id,
            amount: order.total_amount,
            payment_mode: paymentMode
          });
          if (payError) throw payError;
        }
      }

      // Update order status
      await supabase.from("restaurant_orders").update({ status: "completed" }).eq("id", order.id);

      // Free up table
      if (order.restaurant_tables) {
        await supabase
          .from("restaurant_tables")
          .update({ status: "available" })
          .eq("table_number", order.restaurant_tables.table_number);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-invoice", orderId] });
      queryClient.invalidateQueries({ queryKey: ["restaurant-orders"] });
      queryClient.invalidateQueries({ queryKey: ["restaurant-tables"] });
      toast.success("Payment processed successfully");
      setIsPaymentDialogOpen(false);
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (!order) return <div className="p-6">Order not found</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <Button variant="ghost" onClick={() => navigate("/restaurant/orders")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
        </Button>
        <div className="flex gap-2">
          {invoice?.payment_status !== "paid" && (
            <Button onClick={() => setIsPaymentDialogOpen(true)}>
              <CreditCard className="h-4 w-4 mr-2" /> Process Payment
            </Button>
          )}
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
        </div>
      </div>

      {/* Invoice */}
      <Card className="max-w-2xl mx-auto" ref={printRef}>
        <CardContent className="p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">RESTAURANT NAME</h1>
            <p className="text-sm text-muted-foreground">
              123 Main Street, City, State - 123456
            </p>
            <p className="text-sm text-muted-foreground">
              Phone: +91 98765 43210 | GSTIN: 12ABCDE3456F7Z8
            </p>
            <Separator className="my-4" />
            <h2 className="text-xl font-semibold">TAX INVOICE</h2>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Invoice No:</strong> {invoice?.invoice_number || "Draft"}</p>
              <p><strong>Order No:</strong> {order.order_number}</p>
              <p><strong>Date:</strong> {format(new Date(order.created_at), "dd/MM/yyyy")}</p>
              <p><strong>Time:</strong> {format(new Date(order.created_at), "hh:mm a")}</p>
            </div>
            <div className="text-right">
              <p><strong>Type:</strong> {order.order_type.replace("_", " ").toUpperCase()}</p>
              {order.restaurant_tables && (
                <p><strong>Table:</strong> {order.restaurant_tables.table_number}</p>
              )}
              {order.customer_name && <p><strong>Customer:</strong> {order.customer_name}</p>}
              {order.customer_phone && <p><strong>Phone:</strong> {order.customer_phone}</p>}
            </div>
          </div>

          <Separator />

          {/* Items Table */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Item</th>
                <th className="text-center py-2">Qty</th>
                <th className="text-right py-2">Rate</th>
                <th className="text-right py-2">GST%</th>
                <th className="text-right py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.restaurant_order_items?.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-2">{item.food_item_name}</td>
                  <td className="text-center py-2">{item.quantity}</td>
                  <td className="text-right py-2">₹{item.unit_price.toFixed(2)}</td>
                  <td className="text-right py-2">{item.gst_percentage}%</td>
                  <td className="text-right py-2">₹{(item.unit_price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <Separator />

          {/* Totals */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>CGST</span>
              <span>₹{order.cgst_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>SGST</span>
              <span>₹{order.sgst_amount.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Grand Total</span>
              <span>₹{order.total_amount.toFixed(2)}</span>
            </div>
          </div>

          {invoice?.payment_status === "paid" && (
            <div className="text-center p-4 bg-success/10 rounded-lg">
              <Check className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="font-bold text-success">PAID</p>
              <p className="text-sm text-muted-foreground capitalize">via {invoice.payment_mode}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground pt-4">
            <p>Thank you for dining with us!</p>
            <p>Visit again soon.</p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">₹{order.total_amount.toFixed(2)}</p>
              <p className="text-muted-foreground">Total Amount</p>
            </div>

            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="split">Split Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMode === "split" && (
              <div className="space-y-3">
                {splitPayments.map((payment, index) => (
                  <div key={index} className="flex gap-2">
                    <Select
                      value={payment.mode}
                      onValueChange={(v) => {
                        const updated = [...splitPayments];
                        updated[index].mode = v;
                        setSplitPayments(updated);
                      }}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={payment.amount}
                      onChange={(e) => {
                        const updated = [...splitPayments];
                        updated[index].amount = e.target.value;
                        setSplitPayments(updated);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={() => processPaymentMutation.mutate()}
              disabled={processPaymentMutation.isPending}
            >
              <Check className="h-4 w-4 mr-2" />
              {processPaymentMutation.isPending ? "Processing..." : "Confirm Payment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RestaurantInvoice;
