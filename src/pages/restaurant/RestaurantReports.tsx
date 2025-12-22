import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download, TrendingUp, IndianRupee, Receipt, Utensils } from "lucide-react";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))"];

const RestaurantReports = () => {
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "custom">("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case "today":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "week":
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        return { start: startOfDay(weekStart), end: endOfDay(now) };
      case "month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "custom":
        return {
          start: customStart ? parseISO(customStart) : startOfDay(now),
          end: customEnd ? parseISO(customEnd) : endOfDay(now)
        };
      default:
        return { start: startOfDay(now), end: endOfDay(now) };
    }
  };

  const { start, end } = getDateRange();

  const { data: salesData } = useQuery({
    queryKey: ["restaurant-sales-report", dateRange, customStart, customEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurant_invoices")
        .select("*")
        .eq("payment_status", "paid")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());
      if (error) throw error;
      return data;
    }
  });

  const { data: ordersByTable } = useQuery({
    queryKey: ["restaurant-table-sales", dateRange, customStart, customEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurant_orders")
        .select("*, restaurant_tables(table_number)")
        .eq("status", "completed")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());
      if (error) throw error;
      return data;
    }
  });

  const { data: itemSales } = useQuery({
    queryKey: ["restaurant-item-sales", dateRange, customStart, customEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurant_order_items")
        .select("*, restaurant_orders!inner(*)")
        .gte("restaurant_orders.created_at", start.toISOString())
        .lte("restaurant_orders.created_at", end.toISOString());
      if (error) throw error;
      return data;
    }
  });

  // Calculate summary stats
  const totalSales = salesData?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
  const totalOrders = salesData?.length || 0;
  const totalCGST = salesData?.reduce((sum, inv) => sum + (inv.cgst_amount || 0), 0) || 0;
  const totalSGST = salesData?.reduce((sum, inv) => sum + (inv.sgst_amount || 0), 0) || 0;
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  // Table-wise sales
  const tableSalesMap: Record<string, { table: string; orders: number; amount: number }> = {};
  ordersByTable?.forEach((order) => {
    const tableNum = order.restaurant_tables?.table_number || "Takeaway/Delivery";
    if (!tableSalesMap[tableNum]) {
      tableSalesMap[tableNum] = { table: tableNum, orders: 0, amount: 0 };
    }
    tableSalesMap[tableNum].orders += 1;
    tableSalesMap[tableNum].amount += order.total_amount || 0;
  });
  const tableSalesData = Object.values(tableSalesMap).sort((a, b) => b.amount - a.amount);

  // Item-wise sales
  const itemSalesMap: Record<string, { name: string; quantity: number; amount: number }> = {};
  itemSales?.forEach((item) => {
    if (!itemSalesMap[item.food_item_name]) {
      itemSalesMap[item.food_item_name] = { name: item.food_item_name, quantity: 0, amount: 0 };
    }
    itemSalesMap[item.food_item_name].quantity += item.quantity;
    itemSalesMap[item.food_item_name].amount += item.total_price || 0;
  });
  const itemSalesData = Object.values(itemSalesMap).sort((a, b) => b.amount - a.amount);

  // Payment mode distribution
  const paymentModeMap: Record<string, number> = {};
  salesData?.forEach((inv) => {
    const mode = inv.payment_mode || "unknown";
    paymentModeMap[mode] = (paymentModeMap[mode] || 0) + inv.total_amount;
  });
  const paymentModeData = Object.entries(paymentModeMap).map(([name, value]) => ({
    name: name.toUpperCase(),
    value
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Restaurant sales and analytics</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          {dateRange === "custom" && (
            <div className="flex gap-2">
              <Input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
              <Input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{totalSales.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{avgOrderValue.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Utensils className="h-4 w-4" />
              Total GST
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{(totalCGST + totalSGST).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">
              CGST: ₹{totalCGST.toFixed(2)} | SGST: ₹{totalSGST.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Daily Sales</TabsTrigger>
          <TabsTrigger value="table">Table-wise</TabsTrigger>
          <TabsTrigger value="items">Item-wise</TabsTrigger>
          <TabsTrigger value="gst">GST Report</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tableSalesData.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="table" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`} />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentModeData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {paymentModeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Table-wise Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableSalesData.map((row) => (
                    <TableRow key={row.table}>
                      <TableCell className="font-medium">{row.table}</TableCell>
                      <TableCell className="text-right">{row.orders}</TableCell>
                      <TableCell className="text-right">₹{row.amount.toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="items">
          <Card>
            <CardHeader>
              <CardTitle>Item-wise Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Quantity Sold</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemSalesData.map((row) => (
                    <TableRow key={row.name}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="text-right">{row.quantity}</TableCell>
                      <TableCell className="text-right">₹{row.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gst">
          <Card>
            <CardHeader>
              <CardTitle>GST Report</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Taxable Value</TableHead>
                    <TableHead className="text-right">CGST</TableHead>
                    <TableHead className="text-right">SGST</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesData?.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                      <TableCell>{format(new Date(inv.created_at), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="text-right">₹{inv.subtotal.toFixed(2)}</TableCell>
                      <TableCell className="text-right">₹{inv.cgst_amount.toFixed(2)}</TableCell>
                      <TableCell className="text-right">₹{inv.sgst_amount.toFixed(2)}</TableCell>
                      <TableCell className="text-right">₹{inv.total_amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-muted/50">
                    <TableCell colSpan={2}>TOTAL</TableCell>
                    <TableCell className="text-right">₹{(totalSales - totalCGST - totalSGST).toFixed(2)}</TableCell>
                    <TableCell className="text-right">₹{totalCGST.toFixed(2)}</TableCell>
                    <TableCell className="text-right">₹{totalSGST.toFixed(2)}</TableCell>
                    <TableCell className="text-right">₹{totalSales.toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RestaurantReports;
