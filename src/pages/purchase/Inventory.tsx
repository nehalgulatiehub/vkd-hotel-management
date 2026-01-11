import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, AlertTriangle, Package } from "lucide-react";
import { TablePagination } from "@/components/ui/TablePagination";
import { usePagination } from "@/hooks/usePagination";

type ItemCategory = "kitchen_items" | "housekeeping_items" | "linen" | "toiletries" | "maintenance" | "other";

interface InventoryItem {
  id: string;
  item_id: string;
  current_stock: number;
  last_updated: string | null;
  purchase_items?: {
    item_name: string;
    category: ItemCategory;
    unit: string;
    reorder_level: number | null;
  };
}

const categoryLabels: Record<ItemCategory, string> = {
  kitchen_items: "Kitchen Items",
  housekeeping_items: "Housekeeping Items",
  linen: "Linen",
  toiletries: "Toiletries",
  maintenance: "Maintenance",
  other: "Other",
};

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select(`
          *,
          purchase_items (item_name, category, unit, reorder_level)
        `)
        .order("last_updated", { ascending: false });
      if (error) throw error;
      return data as InventoryItem[];
    },
  });

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.purchase_items?.item_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || 
      item.purchase_items?.category === categoryFilter;
    
    let matchesStock = true;
    if (stockFilter === "low") {
      matchesStock = item.current_stock <= (item.purchase_items?.reorder_level || 0);
    } else if (stockFilter === "out") {
      matchesStock = item.current_stock === 0;
    } else if (stockFilter === "in_stock") {
      matchesStock = item.current_stock > (item.purchase_items?.reorder_level || 0);
    }
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  const {
    currentPage,
    totalPages,
    paginatedData,
    startIndex,
    endIndex,
    setCurrentPage,
  } = usePagination({ data: filteredInventory, itemsPerPage: 15 });

  // Stats
  const totalItems = inventory.length;
  const lowStockItems = inventory.filter(
    (item) => item.current_stock <= (item.purchase_items?.reorder_level || 0) && item.current_stock > 0
  ).length;
  const outOfStockItems = inventory.filter((item) => item.current_stock === 0).length;

  const getStockStatus = (stock: number, reorderLevel: number | null) => {
    if (stock === 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (stock <= (reorderLevel || 0)) return { label: "Low Stock", variant: "secondary" as const };
    return { label: "In Stock", variant: "default" as const };
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-muted-foreground text-sm">
            Track stock levels and manage inventory
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold">{totalItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500/10 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock</p>
                  <p className="text-2xl font-bold">{lowStockItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500/10 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Out of Stock</p>
                  <p className="text-2xl font-bold">{outOfStockItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <CardTitle className="text-base">Stock Levels</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Stock" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stock</SelectItem>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                    <SelectItem value="out">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Current Stock</TableHead>
                        <TableHead>Reorder Level</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            No inventory items found
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedData.map((item) => {
                          const status = getStockStatus(
                            item.current_stock,
                            item.purchase_items?.reorder_level || 0
                          );
                          return (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">
                                {item.purchase_items?.item_name || "Unknown"}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {categoryLabels[item.purchase_items?.category as ItemCategory] || "Other"}
                                </Badge>
                              </TableCell>
                              <TableCell>{item.purchase_items?.unit}</TableCell>
                              <TableCell className="font-bold">
                                {item.current_stock}
                              </TableCell>
                              <TableCell>
                                {item.purchase_items?.reorder_level || 0}
                              </TableCell>
                              <TableCell>
                                <Badge variant={status.variant}>
                                  {status.label}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={filteredInventory.length}
                  startIndex={startIndex}
                  endIndex={endIndex}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
