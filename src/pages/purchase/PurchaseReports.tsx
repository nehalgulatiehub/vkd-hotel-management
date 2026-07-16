import { DateInput } from "@/components/ui/DateInput";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Download, Package, IndianRupee, ShoppingCart, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/TablePagination";

interface VendorReport {
  vendor_id: string;
  vendor_name: string;
  total_orders: number;
  total_items_received: number;
  total_amount: number;
}

interface ItemReport {
  item_id: string;
  item_name: string;
  unit: string;
  total_quantity: number;
  total_amount: number;
  average_rate: number;
  vendor_count: number;
}

interface DetailedPurchase {
  id: string;
  po_number: string;
  order_date: string;
  vendor_name: string;
  item_name: string;
  quantity: number;
  rate: number;
  amount: number;
}

export default function PurchaseReports() {
  const [searchTerm, setSearchTerm] = useState("");
  const [reportType, setReportType] = useState<"vendor" | "item" | "detailed">("vendor");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Fetch vendors for dropdown filter
  const { data: vendors = [] } = useQuery({
    queryKey: ["vendors-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("id, vendor_name")
        .order("vendor_name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch vendor-wise report from approved POs
  const { data: vendorReport = [], isLoading: vendorLoading } = useQuery({
    queryKey: ["purchase-vendor-report", dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from("purchase_orders")
        .select(`
          id,
          po_number,
          created_at,
          vendor_id,
          total_amount,
          vendors (id, vendor_name),
          purchase_order_items (
            quantity,
            rate,
            total_amount
          )
        `)
        .eq("status", "approved");

      if (dateFrom) {
        query = query.gte("created_at", dateFrom);
      }
      if (dateTo) {
        query = query.lte("created_at", dateTo + "T23:59:59");
      }

      const { data, error } = await query;
      if (error) throw error;

      // Aggregate by vendor
      const vendorMap = new Map<string, VendorReport>();
      
      data?.forEach((po: any) => {
        const vendorId = po.vendor_id;
        const vendorName = po.vendors?.vendor_name || "Unknown";
        
        if (!vendorId) return;

        if (!vendorMap.has(vendorId)) {
          vendorMap.set(vendorId, {
            vendor_id: vendorId,
            vendor_name: vendorName,
            total_orders: 0,
            total_items_received: 0,
            total_amount: 0,
          });
        }

        const vendor = vendorMap.get(vendorId)!;
        vendor.total_orders += 1;
        vendor.total_amount += po.total_amount || 0;
        
        po.purchase_order_items?.forEach((item: any) => {
          vendor.total_items_received += item.quantity || 0;
        });
      });

      return Array.from(vendorMap.values()).sort((a, b) => b.total_amount - a.total_amount);
    },
    enabled: reportType === "vendor",
  });

  // Fetch item-wise report from approved POs
  const { data: itemReport = [], isLoading: itemLoading } = useQuery({
    queryKey: ["purchase-item-report", dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from("purchase_order_items")
        .select(`
          id,
          quantity,
          rate,
          total_amount,
          purchase_items:item_id (id, item_name, unit),
          purchase_orders:po_id (
            id,
            status,
            created_at,
            vendor_id
          )
        `);

      const { data, error } = await query;
      if (error) throw error;

      // Filter by approved status and date
      let filteredData = data?.filter((item: any) => item.purchase_orders?.status === "approved");
      
      if (dateFrom || dateTo) {
        filteredData = filteredData?.filter((item: any) => {
          const orderDate = item.purchase_orders?.created_at?.split("T")[0];
          if (!orderDate) return false;
          if (dateFrom && orderDate < dateFrom) return false;
          if (dateTo && orderDate > dateTo) return false;
          return true;
        });
      }

      // Aggregate by item
      const itemMap = new Map<string, ItemReport & { vendors: Set<string> }>();
      
      filteredData?.forEach((poItem: any) => {
        const itemId = poItem.purchase_items?.id;
        const itemName = poItem.purchase_items?.item_name || "Unknown";
        const unit = poItem.purchase_items?.unit || "";
        const vendorId = poItem.purchase_orders?.vendor_id;
        
        if (!itemId) return;

        if (!itemMap.has(itemId)) {
          itemMap.set(itemId, {
            item_id: itemId,
            item_name: itemName,
            unit: unit,
            total_quantity: 0,
            total_amount: 0,
            average_rate: 0,
            vendor_count: 0,
            vendors: new Set(),
          });
        }

        const item = itemMap.get(itemId)!;
        item.total_quantity += poItem.quantity || 0;
        item.total_amount += poItem.total_amount || 0;
        if (vendorId) item.vendors.add(vendorId);
      });

      return Array.from(itemMap.values()).map(item => ({
        ...item,
        vendor_count: item.vendors.size,
        average_rate: item.total_quantity > 0 ? item.total_amount / item.total_quantity : 0,
      })).sort((a, b) => b.total_amount - a.total_amount);
    },
    enabled: reportType === "item",
  });

  // Fetch detailed purchase report from approved POs
  const { data: detailedReport = [], isLoading: detailedLoading } = useQuery({
    queryKey: ["purchase-detailed-report", dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from("purchase_order_items")
        .select(`
          id,
          quantity,
          rate,
          total_amount,
          purchase_items:item_id (item_name, unit),
          purchase_orders:po_id (
            po_number,
            created_at,
            status,
            vendors (vendor_name)
          )
        `)
        .order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // Filter by approved status and date
      let filteredData = data?.filter((item: any) => item.purchase_orders?.status === "approved");
      
      if (dateFrom || dateTo) {
        filteredData = filteredData?.filter((item: any) => {
          const orderDate = item.purchase_orders?.created_at?.split("T")[0];
          if (!orderDate) return false;
          if (dateFrom && orderDate < dateFrom) return false;
          if (dateTo && orderDate > dateTo) return false;
          return true;
        });
      }

      return filteredData?.map((item: any) => ({
        id: item.id,
        po_number: item.purchase_orders?.po_number || "",
        order_date: item.purchase_orders?.created_at?.split("T")[0] || "",
        vendor_name: item.purchase_orders?.vendors?.vendor_name || "Unknown",
        item_name: item.purchase_items?.item_name || "Unknown",
        quantity: item.quantity || 0,
        rate: item.rate || 0,
        amount: item.total_amount || 0,
      })) as DetailedPurchase[];
    },
    enabled: reportType === "detailed",
  });

  // Calculate summary stats
  const summaryStats = {
    totalVendors: vendorReport.length,
    totalOrders: vendorReport.reduce((sum, v) => sum + v.total_orders, 0),
    totalItems: itemReport.reduce((sum, i) => sum + i.total_quantity, 0),
    totalAmount: vendorReport.reduce((sum, v) => sum + v.total_amount, 0) || 
                 itemReport.reduce((sum, i) => sum + i.total_amount, 0) ||
                 detailedReport.reduce((sum, d) => sum + d.amount, 0),
  };

  // Filter data based on search
  const getFilteredData = () => {
    const term = searchTerm.toLowerCase();
    if (reportType === "vendor") {
      return vendorReport.filter(v => v.vendor_name.toLowerCase().includes(term));
    } else if (reportType === "item") {
      return itemReport.filter(i => i.item_name.toLowerCase().includes(term));
    } else {
      return detailedReport.filter(d => 
        d.vendor_name.toLowerCase().includes(term) ||
        d.item_name.toLowerCase().includes(term) ||
        d.po_number.toLowerCase().includes(term)
      );
    }
  };

  const filteredData = getFilteredData();
  const pagination = usePagination(filteredData as any[], { itemsPerPage: 15 });

  const isLoading = vendorLoading || itemLoading || detailedLoading;

  const exportToCSV = () => {
    let csvContent = "";
    
    if (reportType === "vendor") {
      csvContent = "Vendor Name,Total Orders,Items Received,Total Amount\n";
      vendorReport.forEach(v => {
        csvContent += `"${v.vendor_name}",${v.total_orders},${v.total_items_received},${v.total_amount.toFixed(2)}\n`;
      });
    } else if (reportType === "item") {
      csvContent = "Item Name,Unit,Total Quantity,Avg Rate,Total Amount,Vendors\n";
      itemReport.forEach(i => {
        csvContent += `"${i.item_name}","${i.unit}",${i.total_quantity},${i.average_rate.toFixed(2)},${i.total_amount.toFixed(2)},${i.vendor_count}\n`;
      });
    } else {
      csvContent = "PO Number,Date,Vendor,Item,Quantity,Rate,Amount\n";
      detailedReport.forEach(d => {
        csvContent += `"${d.po_number}","${d.order_date}","${d.vendor_name}","${d.item_name}",${d.quantity},${d.rate.toFixed(2)},${d.amount.toFixed(2)}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `purchase_report_${reportType}_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Purchase Reports</h1>
        <Button onClick={exportToCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalVendors}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Received</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalItems.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchase Value</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{summaryStats.totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <Select value={reportType} onValueChange={(v: any) => setReportType(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Report Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vendor">Vendor-wise</SelectItem>
                <SelectItem value="item">Item-wise</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <DateInput
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-[160px]"
              placeholder="From Date"
            />
            <DateInput
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-[160px]"
              placeholder="To Date"
            />
          </div>
        </CardContent>
      </Card>

      {/* Report Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-8">Loading...</div>
          ) : (
            <>
              {reportType === "vendor" && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor Name</TableHead>
                      <TableHead className="text-right">Total Orders</TableHead>
                      <TableHead className="text-right">Items Received</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagination.paginatedItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No data found
                        </TableCell>
                      </TableRow>
                    ) : (
                      (pagination.paginatedItems as VendorReport[]).map((vendor) => (
                        <TableRow key={vendor.vendor_id}>
                          <TableCell className="font-medium">{vendor.vendor_name}</TableCell>
                          <TableCell className="text-right">{vendor.total_orders}</TableCell>
                          <TableCell className="text-right">{vendor.total_items_received}</TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{vendor.total_amount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}

              {reportType === "item" && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Total Qty</TableHead>
                      <TableHead className="text-right">Avg Rate</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead className="text-right">Vendors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagination.paginatedItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No data found
                        </TableCell>
                      </TableRow>
                    ) : (
                      (pagination.paginatedItems as ItemReport[]).map((item) => (
                        <TableRow key={item.item_id}>
                          <TableCell className="font-medium">{item.item_name}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell className="text-right">{item.total_quantity}</TableCell>
                          <TableCell className="text-right">₹{item.average_rate.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{item.total_amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">{item.vendor_count}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}

              {reportType === "detailed" && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagination.paginatedItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No data found
                        </TableCell>
                      </TableRow>
                    ) : (
                      (pagination.paginatedItems as DetailedPurchase[]).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.po_number}</TableCell>
                          <TableCell>
                            {item.order_date ? format(new Date(item.order_date), "dd/MM/yyyy") : "-"}
                          </TableCell>
                          <TableCell>{item.vendor_name}</TableCell>
                          <TableCell>{item.item_name}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">₹{item.rate.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{item.amount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}

              <TablePagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={pagination.goToPage}
                totalItems={pagination.totalItems}
                startIndex={pagination.startIndex}
                endIndex={pagination.endIndex}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
