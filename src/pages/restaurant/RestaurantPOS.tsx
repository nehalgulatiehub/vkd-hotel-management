import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Plus, Minus, Trash2, Search, Leaf, AlertCircle, ShoppingCart, Send } from "lucide-react";

interface FoodItem {
  id: string;
  name: string;
  price: number;
  gst_percentage: number;
  is_vegetarian: boolean;
  is_available: boolean;
  category_id: string | null;
  food_categories?: { name: string };
}

interface CartItem {
  food_item: FoodItem;
  quantity: number;
  special_instructions: string;
}

interface RestaurantTable {
  id: string;
  table_number: string;
  table_name: string | null;
  status: string;
}

const RestaurantPOS = () => {
  const queryClient = useQueryClient();
  const [orderType, setOrderType] = useState<"dine_in" | "takeaway" | "delivery">("dine_in");
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [gstPercentage, setGstPercentage] = useState<number>(5);
  const [gstType, setGstType] = useState<"cgst_sgst" | "igst" | "gst">("cgst_sgst");

  const { data: tables } = useQuery({
    queryKey: ["restaurant-tables"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurant_tables")
        .select("*")
        .order("table_number");
      if (error) throw error;
      return data as RestaurantTable[];
    }
  });

  const { data: categories } = useQuery({
    queryKey: ["food-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("food_categories")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    }
  });

  const { data: foodItems } = useQuery({
    queryKey: ["food-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("food_items")
        .select("*, food_categories(name)")
        .eq("is_available", true)
        .order("name");
      if (error) throw error;
      return data as FoodItem[];
    }
  });

  const filteredItems = useMemo(() => {
    if (!foodItems) return [];
    return foodItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || item.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [foodItems, searchQuery, selectedCategory]);

  const cartTotals = useMemo(() => {
    let subtotal = 0;

    cart.forEach((item) => {
      const itemTotal = item.food_item.price * item.quantity;
      subtotal += itemTotal;
    });

    const gstAmount = (subtotal * gstPercentage) / 100;
    
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (gstType === "cgst_sgst") {
      cgst = gstAmount / 2;
      sgst = gstAmount / 2;
    } else if (gstType === "igst") {
      igst = gstAmount;
    }
    // For "gst" type, we just show total GST without breakdown

    return {
      subtotal,
      cgst,
      sgst,
      igst,
      gstAmount,
      total: subtotal + gstAmount
    };
  }, [cart, gstPercentage, gstType]);

  const addToCart = (item: FoodItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.food_item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.food_item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { food_item: item, quantity: 1, special_instructions: "" }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.food_item.id === itemId
            ? { ...c, quantity: Math.max(0, c.quantity + delta) }
            : c
        )
        .filter((c) => c.quantity > 0)
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.food_item.id !== itemId));
  };

  const updateItemInstructions = (itemId: string, instructions: string) => {
    setCart((prev) =>
      prev.map((c) =>
        c.food_item.id === itemId ? { ...c, special_instructions: instructions } : c
      )
    );
  };

  const generateOrderNumber = () => {
    const date = new Date();
    const prefix = "ORD";
    const timestamp = date.getFullYear().toString().slice(-2) +
      String(date.getMonth() + 1).padStart(2, "0") +
      String(date.getDate()).padStart(2, "0") +
      String(date.getHours()).padStart(2, "0") +
      String(date.getMinutes()).padStart(2, "0") +
      String(date.getSeconds()).padStart(2, "0");
    return `${prefix}${timestamp}`;
  };

  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      if (cart.length === 0) throw new Error("Cart is empty");
      if (orderType === "dine_in" && !selectedTableId) throw new Error("Please select a table");

      const orderNumber = generateOrderNumber();

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("restaurant_orders")
        .insert({
          order_number: orderNumber,
          table_id: orderType === "dine_in" ? selectedTableId : null,
          order_type: orderType,
          customer_name: customerName || null,
          customer_phone: customerPhone || null,
          customer_address: orderType === "delivery" ? customerAddress : null,
          subtotal: cartTotals.subtotal,
          cgst_amount: cartTotals.cgst,
          sgst_amount: cartTotals.sgst,
          total_amount: cartTotals.total,
          special_instructions: specialInstructions || null,
          status: "pending",
          gst_percentage: gstPercentage,
          gst_type: gstType
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map((item) => {
        const itemTotal = item.food_item.price * item.quantity;
        return {
          order_id: order.id,
          food_item_id: item.food_item.id,
          food_item_name: item.food_item.name,
          quantity: item.quantity,
          unit_price: item.food_item.price,
          gst_percentage: gstPercentage,
          cgst_amount: 0,
          sgst_amount: 0,
          total_price: itemTotal,
          special_instructions: item.special_instructions || null
        };
      });

      const { error: itemsError } = await supabase
        .from("restaurant_order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update table status if dine-in
      if (orderType === "dine_in" && selectedTableId) {
        await supabase
          .from("restaurant_tables")
          .update({ status: "occupied" })
          .eq("id", selectedTableId);
      }

      return order;
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-orders"] });
      queryClient.invalidateQueries({ queryKey: ["restaurant-tables"] });
      toast.success(`Order ${order.order_number} placed successfully!`);
      // Reset form
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      setSpecialInstructions("");
      setSelectedTableId("");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-4 p-4">
      {/* Left Panel - Menu */}
      <div className="flex-1 flex flex-col gap-4">
        <Card className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Search food items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => addToCart(item)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    {item.is_vegetarian ? (
                      <Leaf className="h-4 w-4 text-success flex-shrink-0 mt-1" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-1" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      {item.food_categories && (
                        <p className="text-xs text-muted-foreground">{item.food_categories.name}</p>
                      )}
                      <p className="text-primary font-bold mt-1">₹{item.price.toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Cart & Order Details */}
      <Card className="w-96 flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Current Order
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Order Type & Table Selection */}
          <div className="space-y-3">
            <div className="flex gap-2">
              {(["dine_in", "takeaway", "delivery"] as const).map((type) => (
                <Button
                  key={type}
                  size="sm"
                  variant={orderType === type ? "default" : "outline"}
                  onClick={() => setOrderType(type)}
                  className="flex-1"
                >
                  {type === "dine_in" ? "Dine In" : type === "takeaway" ? "Takeaway" : "Delivery"}
                </Button>
              ))}
            </div>

            {orderType === "dine_in" && (
              <Select value={selectedTableId} onValueChange={setSelectedTableId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Table" />
                </SelectTrigger>
                <SelectContent>
                  {tables?.filter(t => t.status === "available" || t.id === selectedTableId).map((table) => (
                    <SelectItem key={table.id} value={table.id}>
                      {table.table_number} {table.table_name ? `- ${table.table_name}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Input
              placeholder="Customer Name (Optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            <Input
              placeholder="Customer Phone (Optional)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
            {orderType === "delivery" && (
              <Textarea
                placeholder="Delivery Address"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
              />
            )}
          </div>

          <Separator />

          {/* Cart Items */}
          <ScrollArea className="flex-1">
            {cart.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Cart is empty</p>
                <p className="text-sm">Click on items to add</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.food_item.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.food_item.name}</p>
                        <p className="text-xs text-muted-foreground">₹{item.food_item.price} × {item.quantity}</p>
                      </div>
                      <p className="font-bold text-sm">
                        ₹{(item.food_item.price * item.quantity).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.food_item.id, -1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.food_item.id, 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.food_item.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Special instructions..."
                      className="text-xs h-8"
                      value={item.special_instructions}
                      onChange={(e) => updateItemInstructions(item.food_item.id, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <Separator />

          {/* Totals */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{cartTotals.subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">GST</span>
                <Select value={String(gstPercentage)} onValueChange={(v) => setGstPercentage(Number(v))}>
                  <SelectTrigger className="h-7 w-16 text-xs">
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
                <Select value={gstType} onValueChange={(v) => setGstType(v as "cgst_sgst" | "igst" | "gst")}>
                  <SelectTrigger className="h-7 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cgst_sgst">CGST+SGST</SelectItem>
                    <SelectItem value="igst">IGST</SelectItem>
                    <SelectItem value="gst">GST Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <span>₹{cartTotals.gstAmount.toFixed(2)}</span>
            </div>
            {gstPercentage > 0 && gstType === "cgst_sgst" && (
              <div className="flex justify-between text-xs text-muted-foreground pl-2">
                <span>CGST @{gstPercentage / 2}%: ₹{cartTotals.cgst.toFixed(2)}</span>
                <span>SGST @{gstPercentage / 2}%: ₹{cartTotals.sgst.toFixed(2)}</span>
              </div>
            )}
            {gstPercentage > 0 && gstType === "igst" && (
              <div className="flex justify-between text-xs text-muted-foreground pl-2">
                <span>IGST @{gstPercentage}%: ₹{cartTotals.igst.toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">₹{cartTotals.total.toFixed(2)}</span>
            </div>
          </div>

          <Textarea
            placeholder="Order special instructions..."
            className="text-sm"
            rows={2}
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
          />

          <Button
            size="lg"
            className="w-full"
            disabled={cart.length === 0 || placeOrderMutation.isPending}
            onClick={() => placeOrderMutation.mutate()}
          >
            <Send className="h-4 w-4 mr-2" />
            {placeOrderMutation.isPending ? "Placing Order..." : "Place Order"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default RestaurantPOS;
