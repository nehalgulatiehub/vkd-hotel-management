import { useState, useRef, useEffect } from "react";
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
import { ArrowLeft, Printer, CreditCard, Check, Settings } from "lucide-react";

interface OrderItem {
  id: string;
  food_item_name: string;
  quantity: number;
  unit_price: number;
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

interface RestaurantSettings {
  name: string;
  address: string;
  phone: string;
  gstin: string;
}

const DEFAULT_SETTINGS: RestaurantSettings = {
  name: "RESTAURANT NAME",
  address: "123 Main Street, City, State - 123456",
  phone: "+91 98765 43210",
  gstin: "12ABCDE3456F7Z8"
};

const RestaurantInvoice = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState<string>("cash");
  const [gstPercentage, setGstPercentage] = useState<number>(5);
  const [splitPayments, setSplitPayments] = useState([
    { mode: "cash", amount: "" },
    { mode: "upi", amount: "" }
  ]);

  // Load restaurant settings from localStorage
  const [settings, setSettings] = useState<RestaurantSettings>(() => {
    const saved = localStorage.getItem("restaurant_settings");
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [editSettings, setEditSettings] = useState<RestaurantSettings>(settings);

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

  // Calculate GST on total
  const subtotal = order?.restaurant_order_items?.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0) || 0;
  const gstAmount = (subtotal * gstPercentage) / 100;
  const cgstAmount = gstAmount / 2;
  const sgstAmount = gstAmount / 2;
  const grandTotal = subtotal + gstAmount;

  const saveSettings = () => {
    localStorage.setItem("restaurant_settings", JSON.stringify(editSettings));
    setSettings(editSettings);
    setIsSettingsDialogOpen(false);
    toast.success("Settings saved!");
  };

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

      if (invoice) {
        const { error } = await supabase
          .from("restaurant_invoices")
          .update({
            payment_status: "paid",
            payment_mode: paymentMode,
            subtotal: subtotal,
            cgst_amount: cgstAmount,
            sgst_amount: sgstAmount,
            total_amount: grandTotal
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
            subtotal: subtotal,
            cgst_amount: cgstAmount,
            sgst_amount: sgstAmount,
            total_amount: grandTotal,
            payment_status: "paid",
            payment_mode: paymentMode
          })
          .select()
          .single();
        if (error) throw error;

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
            amount: grandTotal,
            payment_mode: paymentMode
          });
          if (payError) throw payError;
        }
      }

      await supabase.from("restaurant_orders").update({ status: "completed" }).eq("id", order.id);

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
      {/* Controls - Hidden on print */}
      <div className="flex justify-between items-center print:hidden">
        <Button variant="ghost" onClick={() => navigate("/restaurant/orders")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
        </Button>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-2">
            <Label className="text-sm">GST %:</Label>
            <Select value={String(gstPercentage)} onValueChange={(v) => setGstPercentage(Number(v))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0%</SelectItem>
                <SelectItem value="5">5%</SelectItem>
                <SelectItem value="12">12%</SelectItem>
                <SelectItem value="18">18%</SelectItem>
                <SelectItem value="28">28%</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="icon" onClick={() => { setEditSettings(settings); setIsSettingsDialogOpen(true); }}>
            <Settings className="h-4 w-4" />
          </Button>
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

      {/* POS Slip Style Invoice */}
      <div className="flex justify-center">
        <div 
          ref={printRef} 
          className="bg-white text-black w-80 p-4 font-mono text-xs shadow-lg print:shadow-none print:w-72"
          style={{ fontFamily: "'Courier New', monospace" }}
        >
          {/* Header */}
          <div className="text-center space-y-1 mb-4">
            <h1 className="text-base font-bold uppercase">{settings.name}</h1>
            <p className="text-[10px] leading-tight">{settings.address}</p>
            <p className="text-[10px]">Ph: {settings.phone}</p>
            <p className="text-[10px]">GSTIN: {settings.gstin}</p>
            <div className="border-t border-dashed border-black my-2"></div>
            <p className="font-bold">TAX INVOICE</p>
          </div>

          {/* Invoice Info */}
          <div className="space-y-1 mb-3 text-[10px]">
            <div className="flex justify-between">
              <span>Bill No:</span>
              <span>{invoice?.invoice_number || "Draft"}</span>
            </div>
            <div className="flex justify-between">
              <span>Order:</span>
              <span>{order.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{format(new Date(order.created_at), "dd/MM/yy HH:mm")}</span>
            </div>
            <div className="flex justify-between">
              <span>Type:</span>
              <span className="uppercase">{order.order_type.replace("_", " ")}</span>
            </div>
            {order.restaurant_tables && (
              <div className="flex justify-between">
                <span>Table:</span>
                <span>{order.restaurant_tables.table_number}</span>
              </div>
            )}
            {order.customer_name && (
              <div className="flex justify-between">
                <span>Customer:</span>
                <span>{order.customer_name}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-black my-2"></div>

          {/* Items Header */}
          <div className="flex justify-between font-bold text-[10px] mb-1">
            <span className="flex-1">Item</span>
            <span className="w-8 text-center">Qty</span>
            <span className="w-14 text-right">Amt</span>
          </div>

          <div className="border-t border-dashed border-black mb-2"></div>

          {/* Items */}
          <div className="space-y-1 text-[10px]">
            {order.restaurant_order_items?.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span className="flex-1 truncate pr-1">{item.food_item_name}</span>
                <span className="w-8 text-center">{item.quantity}</span>
                <span className="w-14 text-right">{(item.unit_price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-black my-2"></div>

          {/* Totals */}
          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {gstPercentage > 0 && (
              <>
                <div className="flex justify-between">
                  <span>CGST @{gstPercentage / 2}%:</span>
                  <span>₹{cgstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST @{gstPercentage / 2}%:</span>
                  <span>₹{sgstAmount.toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="border-t border-dashed border-black my-1"></div>
            <div className="flex justify-between font-bold text-sm">
              <span>TOTAL:</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {invoice?.payment_status === "paid" && (
            <div className="text-center mt-3 py-2 border border-dashed border-black">
              <p className="font-bold">*** PAID ***</p>
              <p className="text-[10px] uppercase">via {invoice.payment_mode}</p>
            </div>
          )}

          <div className="border-t border-dashed border-black my-3"></div>

          {/* Footer */}
          <div className="text-center text-[10px] space-y-1">
            <p>Thank you for dining with us!</p>
            <p>Visit again soon</p>
            <p className="mt-2">*****************************</p>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restaurant Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Restaurant Name</Label>
              <Input
                value={editSettings.name}
                onChange={(e) => setEditSettings({ ...editSettings, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={editSettings.address}
                onChange={(e) => setEditSettings({ ...editSettings, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={editSettings.phone}
                onChange={(e) => setEditSettings({ ...editSettings, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>GSTIN</Label>
              <Input
                value={editSettings.gstin}
                onChange={(e) => setEditSettings({ ...editSettings, gstin: e.target.value })}
              />
            </div>
            <Button className="w-full" onClick={saveSettings}>
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">₹{grandTotal.toFixed(2)}</p>
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

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          #root {
            visibility: hidden;
          }
          [class*="print:hidden"] {
            display: none !important;
          }
          div[style*="font-family"] {
            visibility: visible !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            padding: 5mm;
          }
          div[style*="font-family"] * {
            visibility: visible !important;
          }
        }
      `}</style>
    </div>
  );
};

export default RestaurantInvoice;
