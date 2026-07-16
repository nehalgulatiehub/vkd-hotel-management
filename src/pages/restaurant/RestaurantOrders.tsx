import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import { Eye, Receipt, ChefHat, Check, X, Clock, Utensils } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OrderItem {
  id: string;
  food_item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions: string | null;
}

interface RestaurantOrder {
  id: string;
  order_number: string;
  order_type: string;
  status: string;
  customer_name: string | null;
  customer_phone: string | null;
  subtotal: number;
  cgst_amount: number;
  sgst_amount: number;
  total_amount: number;
  special_instructions: string | null;
  created_at: string;
  restaurant_tables?: { table_number: string; table_name: string | null };
  restaurant_order_items?: OrderItem[];
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: "Pending", color: "bg-warning/20 text-warning", icon: Clock },
  preparing: { label: "Preparing", color: "bg-primary/20 text-primary", icon: ChefHat },
  ready: { label: "Ready", color: "bg-success/20 text-success", icon: Check },
  served: { label: "Served", color: "bg-muted text-muted-foreground", icon: Utensils },
  completed: { label: "Completed", color: "bg-success/20 text-success", icon: Check },
  cancelled: { label: "Cancelled", color: "bg-destructive/20 text-destructive", icon: X }
};

const RestaurantOrders = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<RestaurantOrder | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["restaurant-orders", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("restaurant_orders")
        .select("*, restaurant_tables(table_number, table_name), restaurant_order_items(*)")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as RestaurantOrder[];
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase
        .from("restaurant_orders")
        .update({ status })
        .eq("id", orderId);
      if (error) throw error;

      // If completed or cancelled, free up the table
      if (status === "completed" || status === "cancelled") {
        const order = orders?.find(o => o.id === orderId);
        if (order?.restaurant_tables) {
          await supabase
            .from("restaurant_tables")
            .update({ status: "available" })
            .eq("table_number", order.restaurant_tables.table_number);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-orders"] });
      queryClient.invalidateQueries({ queryKey: ["restaurant-tables"] });
      toast.success("Order status updated");
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const getNextStatus = (current: string): string | null => {
    const flow: Record<string, string> = {
      pending: "preparing",
      preparing: "ready",
      ready: "served",
      served: "completed"
    };
    return flow[current] || null;
  };

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Manage restaurant orders</p>
        </div>
        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="served">Served</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => navigate("/restaurant/pos")}>
            New Order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders?.map((order) => {
          const StatusIcon = statusConfig[order.status]?.icon || Clock;
          const nextStatus = getNextStatus(order.status);

          return (
            <Card key={order.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{order.order_number}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.created_at), "dd/MM/yyyy, hh:mm a")}
                    </p>
                  </div>
                  <Badge className={statusConfig[order.status]?.color}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig[order.status]?.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="capitalize">
                    {order.order_type.replace("_", " ")}
                  </Badge>
                  {order.restaurant_tables && (
                    <Badge variant="secondary">
                      {order.restaurant_tables.table_number}
                    </Badge>
                  )}
                </div>

                {order.customer_name && (
                  <p className="text-sm">👤 {order.customer_name}</p>
                )}

                <p className="text-sm text-muted-foreground">
                  {order.restaurant_order_items?.length || 0} items
                </p>

                <div className="flex justify-between items-center">
                  <p className="text-xl font-bold text-primary">
                    ₹{order.total_amount.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye className="h-4 w-4 mr-1" /> View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/restaurant/invoice/${order.id}`)}
                  >
                    <Receipt className="h-4 w-4 mr-1" /> Invoice
                  </Button>
                  {nextStatus && order.status !== "cancelled" && (
                    <Button
                      size="sm"
                      onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: nextStatus })}
                    >
                      {nextStatus === "preparing" && "Start"}
                      {nextStatus === "ready" && "Ready"}
                      {nextStatus === "served" && "Served"}
                      {nextStatus === "completed" && "Complete"}
                    </Button>
                  )}
                  {order.status === "pending" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: "cancelled" })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(!orders || orders.length === 0) && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No orders found</p>
        </Card>
      )}

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Order Type</p>
                  <p className="font-medium capitalize">{selectedOrder.order_type.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Table</p>
                  <p className="font-medium">
                    {selectedOrder.restaurant_tables?.table_number || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedOrder.customer_name || "Walk-in"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedOrder.customer_phone || "N/A"}</p>
                </div>
              </div>

              <Separator />

              <ScrollArea className="max-h-64">
                <div className="space-y-2">
                  {selectedOrder.restaurant_order_items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div>
                        <p className="font-medium">{item.food_item_name}</p>
                        <p className="text-muted-foreground">
                          ₹{item.unit_price} × {item.quantity}
                        </p>
                        {item.special_instructions && (
                          <p className="text-xs text-warning">Note: {item.special_instructions}</p>
                        )}
                      </div>
                      <p className="font-medium">₹{item.total_price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <Separator />

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CGST</span>
                  <span>₹{selectedOrder.cgst_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST</span>
                  <span>₹{selectedOrder.sgst_amount.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">₹{selectedOrder.total_amount.toFixed(2)}</span>
                </div>
              </div>

              {selectedOrder.special_instructions && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Special Instructions:</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.special_instructions}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RestaurantOrders;
