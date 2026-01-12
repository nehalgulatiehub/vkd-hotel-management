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
  grn_number: string;
  receipt_date: string;
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

  // Fetch vendor-wise report
  const { data: vendorReport = [], isLoading: vendorLoading } = useQuery({
    queryKey: ["purchase-vendor-report", dateFrom, dateTo],
    queryFn: async () => {
      // Get all GRNs with their items
      let query = supabase
        .from("goods_receipt_notes")
        .select(`
          id,
          receipt_date,
          purchase_orders (
            id,
            vendor_id,
            vendors (id, vendor_name),
            total_amount
          ),
          grn_items (
            received_quantity,
            accepted_quantity,
            purchase_order_items (
              rate,
              total_amount
            )
          )
        `);

      if (dateFrom) {
        query = query.gte("receipt_date", dateFrom);
      }
      if (dateTo) {
        query = query.lte("receipt_date", dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Aggregate by vendor
      const vendorMap = new Map<string, VendorReport>();
      
      data?.forEach((grn: any) => {
        const vendorId = grn.purchase_orders?.vendor_id;
        const vendorName = grn.purchase_orders?.vendors?.vendor_name || "Unknown";
        
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
        
        grn.grn_items?.forEach((item: any) => {
          vendor.total_items_received += item.accepted_quantity || item.received_quantity || 0;
          vendor.total_amount += item.purchase_order_items?.total_amount || 0;
        });
      });

      return Array.from(vendorMap.values()).sort((a, b) => b.total_amount - a.total_amount);
    },
    enabled: reportType === "vendor",
  });

  // Fetch item-wise report
  const { data: itemReport = [], isLoading: itemLoading } = useQuery({
    queryKey: ["purchase-item-report", dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from("grn_items")
        .select(`
          id,
          received_quantity,
          accepted_quantity,
          purchase_items:item_id (id, item_name, unit),
          purchase_order_items:po_item_id (rate, total_amount),
          goods_receipt_notes:grn_id (
            receipt_date,
            purchase_orders (vendor_id)
          )
        `);

      const { data, error } = await query;
      if (error) throw error;

      // Filter by date if provided
      let filteredData = data;
      if (dateFrom || dateTo) {
        filteredData = data?.filter((item: any) => {
          const receiptDate = item.goods_receipt_notes?.receipt_date;
          if (!receiptDate) return false;
          if (dateFrom && receiptDate < dateFrom) return false;
          if (dateTo && receiptDate > dateTo) return false;
          return true;
        });
      }

      // Aggregate by item
      const itemMap = new Map<string, ItemReport & { vendors: Set<string> }>();
      
      filteredData?.forEach((grn: any) => {
        const itemId = grn.purchase_items?.id;
        const itemName = grn.purchase_items?.item_name || "Unknown";
        const unit = grn.purchase_items?.unit || "";
        const vendorId = grn.goods_receipt_notes?.purchase_orders?.vendor_id;
        
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
        const qty = grn.accepted_quantity || grn.received_quantity || 0;
        item.total_quantity += qty;
        item.total_amount += grn.purchase_order_items?.total_amount || 0;
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

  // Fetch detailed purchase report
  const { data: detailedReport = [], isLoading: detailedLoading } = useQuery({
    queryKey: ["purchase-detailed-report", dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from("grn_items")
        .select(`
          id,
          received_quantity,
          accepted_quantity,
          purchase_items:item_id (item_name, unit),
          purchase_order_items:po_item_id (rate, total_amount),
          goods_receipt_notes:grn_id (
            grn_number,
            receipt_date,
            purchase_orders (
              vendors (vendor_name)
            )
          )
        `)
        .order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // Filter by date if provided
      let filteredData = data;
      if (dateFrom || dateTo) {
        filteredData = data?.filter((item: any) => {
          const receiptDate = item.goods_receipt_notes?.receipt_date;
          if (!receiptDate) return false;
          if (dateFrom && receiptDate < dateFrom) return false;
          if (dateTo && receiptDate > dateTo) return false;
          return true;
        });
      }

      return filteredData?.map((item: any) => ({
        id: item.id,
        grn_number: item.goods_receipt_notes?.grn_number || "",
        receipt_date: item.goods_receipt_notes?.receipt_date || "",
        vendor_name: item.goods_receipt_notes?.purchase_orders?.vendors?.vendor_name || "Unknown",
        item_name: item.purchase_items?.item_name || "Unknown",
        quantity: item.accepted_quantity || item.received_quantity || 0,
        rate: item.purchase_order_items?.rate || 0,
        amount: item.purchase_order_items?.total_amount || 0,
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
        d.grn_number.toLowerCase().includes(term)
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
      csvContent = "GRN Number,Date,Vendor,Item,Quantity,Rate,Amount\n";
      detailedReport.forEach(d => {
        csvContent += `"${d.grn_number}","${d.receipt_date}","${d.vendor_name}","${d.item_name}",${d.quantity},${d.rate.toFixed(2)},${d.amount.toFixed(2)}\n`;
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
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-[160px]"
              placeholder="From Date"
            />
            <Input
              type="date"
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
                      <TableHead>GRN #</TableHead>
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
                          <TableCell className="font-medium">{item.grn_number}</TableCell>
                          <TableCell>
                            {item.receipt_date ? format(new Date(item.receipt_date), "dd/MM/yyyy") : "-"}
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
