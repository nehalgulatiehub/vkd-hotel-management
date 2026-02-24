import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Trash2, Pencil, DollarSign, Printer } from "lucide-react";
import { toast } from "sonner";
import { TablePagination } from "@/components/ui/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { format } from "date-fns";

type PoStatus = "pending" | "approved" | "rejected" | "created" | "sent_to_vendor" | "partially_received" | "closed" | "cancelled";

interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_id: string;
  expected_delivery_date: string | null;
  subtotal: number | null;
  total_gst: number | null;
  total_amount: number | null;
  status: PoStatus;
  notes: string | null;
  created_at: string | null;
  vendors?: {
    vendor_name: string;
  };
}

interface POItem {
  pr_id: string;
  item_id: string;
  item_name: string;
  unit: string;
  quantity: number;
  rate: number;
  gst_percentage: number;
}

const statusLabels: Record<PoStatus, string> = {
  pending: "Pending Approval",
  approved: "Approved",
  rejected: "Rejected",
  created: "Created",
  sent_to_vendor: "Sent to Vendor",
  partially_received: "Partially Received",
  closed: "Closed",
  cancelled: "Cancelled",
};

const statusColors: Record<PoStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
  created: "secondary",
  sent_to_vendor: "default",
  partially_received: "outline",
  closed: "default",
  cancelled: "destructive",
};

export default function PurchaseOrders() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditPriceDialogOpen, setIsEditPriceDialogOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [editPricePO, setEditPricePO] = useState<PurchaseOrder | null>(null);
  const [editPriceItems, setEditPriceItems] = useState<any[]>([]);
  const [selectedVendor, setSelectedVendor] = useState("");
  
  const [poItems, setPoItems] = useState<POItem[]>([]);
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [printPO, setPrintPO] = useState<PurchaseOrder | null>(null);
  const [printItems, setPrintItems] = useState<any[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: companySettings } = useQuery({
    queryKey: ["company-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("company_settings").select("*").limit(1).single();
      return data;
    },
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ["vendors-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("id, vendor_name, address, mobile_number, email, gst_number")
        .eq("is_active", true)
        .order("vendor_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: allItems = [] } = useQuery({
    queryKey: ["purchase-items-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_items")
        .select("id, item_name, unit, gst_percentage")
        .eq("is_active", true)
        .order("item_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select(`
          *,
          vendors (vendor_name)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PurchaseOrder[];
    },
  });

  const { data: poItemsData = [] } = useQuery({
    queryKey: ["po-items", selectedPO?.id],
    queryFn: async () => {
      if (!selectedPO) return [];
      const { data, error } = await supabase
        .from("purchase_order_items")
        .select(`
          *,
          purchase_items (item_name, unit)
        `)
        .eq("po_id", selectedPO.id);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPO,
  });

  const filteredOrders = orders.filter((po) => {
    const matchesSearch = po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.vendors?.vendor_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedData,
    startIndex,
    endIndex,
    goToPage,
  } = usePagination(filteredOrders, { itemsPerPage: 10 });

  const generatePONumber = () => {
    const date = new Date();
    const prefix = "PO";
    const timestamp = date.getFullYear().toString().slice(-2) +
      String(date.getMonth() + 1).padStart(2, "0") +
      String(date.getDate()).padStart(2, "0") +
      String(date.getHours()).padStart(2, "0") +
      String(date.getMinutes()).padStart(2, "0") +
      String(date.getSeconds()).padStart(2, "0");
    return `${prefix}${timestamp}`;
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedVendor || poItems.length === 0) {
        throw new Error("Please select vendor and add items");
      }

      const subtotal = poItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
      const totalGst = poItems.reduce((sum, item) => {
        const amount = item.quantity * item.rate;
        return sum + (amount * item.gst_percentage / 100);
      }, 0);
      const totalAmount = subtotal + totalGst;

      const { data: po, error: poError } = await supabase
        .from("purchase_orders")
        .insert([{
          po_number: generatePONumber(),
          vendor_id: selectedVendor,
          expected_delivery_date: expectedDate || null,
          subtotal,
          total_gst: totalGst,
          total_amount: totalAmount,
          notes: notes || null,
          created_by: user?.id,
          status: "pending",
        }])
        .select()
        .single();

      if (poError) throw poError;

      const itemsToInsert = poItems.map((item) => ({
        po_id: po.id,
        pr_id: item.pr_id,
        item_id: item.item_id,
        quantity: item.quantity,
        rate: item.rate,
        gst_percentage: item.gst_percentage,
        gst_amount: (item.quantity * item.rate * item.gst_percentage / 100),
        total_amount: item.quantity * item.rate + (item.quantity * item.rate * item.gst_percentage / 100),
      }));

      const { error: itemsError } = await supabase
        .from("purchase_order_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Purchase order created successfully");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to create PO: " + error.message);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PoStatus }) => {
      const { error } = await supabase
        .from("purchase_orders")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Status updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update status: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Delete PO items first
      const { error: itemsError } = await supabase
        .from("purchase_order_items")
        .delete()
        .eq("po_id", id);
      if (itemsError) throw itemsError;

      // Delete PO
      const { error } = await supabase
        .from("purchase_orders")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Purchase order deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingPO || !selectedVendor || poItems.length === 0) {
        throw new Error("Invalid data");
      }

      const subtotal = poItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
      const totalGst = poItems.reduce((sum, item) => {
        const amount = item.quantity * item.rate;
        return sum + (amount * item.gst_percentage / 100);
      }, 0);
      const totalAmount = subtotal + totalGst;

      // Update PO
      const { error: poError } = await supabase
        .from("purchase_orders")
        .update({
          vendor_id: selectedVendor,
          expected_delivery_date: expectedDate || null,
          subtotal,
          total_gst: totalGst,
          total_amount: totalAmount,
          notes: notes || null,
        })
        .eq("id", editingPO.id);

      if (poError) throw poError;

      // Delete existing items and re-insert
      await supabase
        .from("purchase_order_items")
        .delete()
        .eq("po_id", editingPO.id);

      const itemsToInsert = poItems.map((item) => ({
        po_id: editingPO.id,
        pr_id: item.pr_id,
        item_id: item.item_id,
        quantity: item.quantity,
        rate: item.rate,
        gst_percentage: item.gst_percentage,
        gst_amount: (item.quantity * item.rate * item.gst_percentage / 100),
        total_amount: item.quantity * item.rate + (item.quantity * item.rate * item.gst_percentage / 100),
      }));

      const { error: itemsError } = await supabase
        .from("purchase_order_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Purchase order updated");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to update: " + error.message);
    },
  });

  // Mutation to update prices only (for approved POs)
  const updatePricesMutation = useMutation({
    mutationFn: async () => {
      if (!editPricePO || editPriceItems.length === 0) {
        throw new Error("Invalid data");
      }

      // Update each item's rate and recalculate amounts
      for (const item of editPriceItems) {
        const gstAmount = item.quantity * item.rate * (item.gst_percentage / 100);
        const totalAmount = item.quantity * item.rate + gstAmount;
        
        const { error } = await supabase
          .from("purchase_order_items")
          .update({
            rate: item.rate,
            gst_amount: gstAmount,
            total_amount: totalAmount,
          })
          .eq("id", item.id);
        
        if (error) throw error;
      }

      // Recalculate PO totals
      const subtotal = editPriceItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
      const totalGst = editPriceItems.reduce((sum, item) => {
        const amount = item.quantity * item.rate;
        return sum + (amount * item.gst_percentage / 100);
      }, 0);
      const totalAmount = subtotal + totalGst;

      const { error: poError } = await supabase
        .from("purchase_orders")
        .update({
          subtotal,
          total_gst: totalGst,
          total_amount: totalAmount,
        })
        .eq("id", editPricePO.id);

      if (poError) throw poError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["po-items"] });
      toast.success("Prices updated successfully");
      setIsEditPriceDialogOpen(false);
      setEditPricePO(null);
      setEditPriceItems([]);
    },
    onError: (error) => {
      toast.error("Failed to update prices: " + error.message);
    },
  });

  const resetForm = () => {
    setSelectedVendor("");
    setPoItems([]);
    setExpectedDate("");
    setNotes("");
    setEditingPO(null);
    setIsDialogOpen(false);
  };

  const handleEdit = async (po: PurchaseOrder) => {
    setEditingPO(po);
    setSelectedVendor(po.vendor_id);
    setExpectedDate(po.expected_delivery_date || "");
    setNotes(po.notes || "");

    // Load existing PO items
    const { data: items } = await supabase
      .from("purchase_order_items")
      .select(`
        *,
        purchase_items (id, item_name, unit, gst_percentage)
      `)
      .eq("po_id", po.id);

    if (items) {
      setPoItems(items.map((item: any) => ({
        pr_id: item.pr_id || "",
        item_id: item.item_id,
        item_name: item.purchase_items?.item_name || "",
        unit: item.purchase_items?.unit || "",
        quantity: item.quantity,
        rate: item.rate,
        gst_percentage: item.gst_percentage || 18,
      })));
    }

    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this purchase order?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddItem = (itemId: string) => {
    const item = allItems.find((i) => i.id === itemId);
    if (!item) return;

    setPoItems([...poItems, {
      pr_id: "",
      item_id: item.id,
      item_name: item.item_name,
      unit: item.unit,
      quantity: 1,
      rate: 0,
      gst_percentage: item.gst_percentage || 18,
    }]);
  };

  const handleRemoveItem = (index: number) => {
    setPoItems(poItems.filter((_, i) => i !== index));
  };

  const handleUpdateItemRate = (index: number, rate: number) => {
    const updated = [...poItems];
    updated[index].rate = rate;
    setPoItems(updated);
  };

  const handleUpdateItemQuantity = (index: number, quantity: number) => {
    const updated = [...poItems];
    updated[index].quantity = quantity;
    setPoItems(updated);
  };

  const calculateTotals = () => {
    const subtotal = poItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const totalGst = poItems.reduce((sum, item) => {
      const amount = item.quantity * item.rate;
      return sum + (amount * item.gst_percentage / 100);
    }, 0);
    return { subtotal, totalGst, total: subtotal + totalGst };
  };

  const handleView = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setIsViewDialogOpen(true);
  };

  const handlePrintPO = async (po: PurchaseOrder) => {
    setPrintPO(po);
    const { data: items } = await supabase
      .from("purchase_order_items")
      .select(`*, purchase_items (item_name, unit)`)
      .eq("po_id", po.id);
    setPrintItems(items || []);
    setIsPrintDialogOpen(true);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // Handler for editing prices (for approved or other POs)
  const handleEditPrices = async (po: PurchaseOrder) => {
    setEditPricePO(po);
    
    // Load existing PO items with all details
    const { data: items } = await supabase
      .from("purchase_order_items")
      .select(`
        *,
        purchase_items (id, item_name, unit, gst_percentage)
      `)
      .eq("po_id", po.id);

    if (items) {
      setEditPriceItems(items.map((item: any) => ({
        id: item.id,
        item_id: item.item_id,
        item_name: item.purchase_items?.item_name || "",
        unit: item.purchase_items?.unit || "",
        quantity: item.quantity,
        rate: item.rate,
        gst_percentage: item.gst_percentage || 18,
      })));
    }

    setIsEditPriceDialogOpen(true);
  };

  const handleUpdateEditPriceItemRate = (index: number, rate: number) => {
    const updated = [...editPriceItems];
    updated[index].rate = rate;
    setEditPriceItems(updated);
  };

  const calculateEditPriceTotals = () => {
    const subtotal = editPriceItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const totalGst = editPriceItems.reduce((sum, item) => {
      const amount = item.quantity * item.rate;
      return sum + (amount * item.gst_percentage / 100);
    }, 0);
    return { subtotal, totalGst, total: subtotal + totalGst };
  };

  const editPriceTotals = calculateEditPriceTotals();

  const totals = calculateTotals();

  return (
    <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Purchase Orders</h1>
            <p className="text-muted-foreground text-sm">
              Create and manage purchase orders
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                New PO
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPO ? "Edit Purchase Order" : "Create Purchase Order"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Vendor *</Label>
                    <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.vendor_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Expected Delivery Date</Label>
                    <Input
                      type="date"
                      value={expectedDate}
                      onChange={(e) => setExpectedDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Add Item</Label>
                  <Select onValueChange={handleAddItem}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select item to add" />
                    </SelectTrigger>
                    <SelectContent>
                      {allItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.item_name} ({item.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {poItems.length > 0 && (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead>GST %</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {poItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.item_name}</TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleUpdateItemQuantity(index, parseInt(e.target.value) || 1)}
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.rate}
                                onChange={(e) => handleUpdateItemRate(index, parseFloat(e.target.value) || 0)}
                                className="w-24"
                              />
                            </TableCell>
                            <TableCell>{item.gst_percentage}%</TableCell>
                            <TableCell>
                              ₹{(item.quantity * item.rate * (1 + item.gst_percentage / 100)).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {poItems.length > 0 && (
                  <div className="flex justify-end">
                    <div className="text-right space-y-1">
                      <p className="text-sm">Subtotal: ₹{totals.subtotal.toFixed(2)}</p>
                      <p className="text-sm">GST: ₹{totals.totalGst.toFixed(2)}</p>
                      <p className="font-bold">Total: ₹{totals.total.toFixed(2)}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => editingPO ? updateMutation.mutate() : createMutation.mutate()}
                    disabled={(editingPO ? updateMutation.isPending : createMutation.isPending) || poItems.length === 0 || !selectedVendor}
                  >
                    {editingPO ? "Update PO" : "Create PO"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <CardTitle className="text-base">Purchase Orders List</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search orders..."
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
                        <TableHead>PO Number</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Expected Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            No orders found
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedData.map((po) => (
                          <TableRow key={po.id}>
                            <TableCell className="font-medium">
                              {po.po_number}
                            </TableCell>
                            <TableCell>{po.vendors?.vendor_name || "N/A"}</TableCell>
                            <TableCell>
                              {po.expected_delivery_date
                                ? format(new Date(po.expected_delivery_date), "dd/MM/yyyy")
                                : "-"}
                            </TableCell>
                            <TableCell>₹{(po.total_amount || 0).toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant={statusColors[po.status]}>
                                {statusLabels[po.status]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {po.created_at
                                ? format(new Date(po.created_at), "dd/MM/yyyy")
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleView(po)}
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handlePrintPO(po)}
                                  title="Print PDF"
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                                {/* Edit Prices button - available for approved, sent_to_vendor, partially_received POs */}
                                {(po.status === "approved" || po.status === "sent_to_vendor" || po.status === "partially_received") && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditPrices(po)}
                                    title="Edit Prices"
                                  >
                                    <DollarSign className="h-4 w-4" />
                                  </Button>
                                )}
                                {(po.status === "pending" || po.status === "created") && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEdit(po)}
                                      title="Edit PO"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => handleDelete(po.id)}
                                      title="Delete PO"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                {po.status === "created" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateStatusMutation.mutate({ id: po.id, status: "sent_to_vendor" })}
                                  >
                                    Send
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                  totalItems={filteredOrders.length}
                  startIndex={startIndex}
                  endIndex={endIndex}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* View PO Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Purchase Order Details</DialogTitle>
            </DialogHeader>
            {selectedPO && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">PO Number:</span>
                    <p className="font-medium">{selectedPO.po_number}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vendor:</span>
                    <p className="font-medium">{selectedPO.vendors?.vendor_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Expected Date:</span>
                    <p className="font-medium">
                      {selectedPO.expected_delivery_date
                        ? format(new Date(selectedPO.expected_delivery_date), "dd/MM/yyyy")
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p className="font-medium">
                      <Badge variant={statusColors[selectedPO.status]}>
                        {statusLabels[selectedPO.status]}
                      </Badge>
                    </p>
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>GST</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {poItemsData.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.purchase_items?.item_name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>₹{item.rate}</TableCell>
                          <TableCell>₹{item.gst_amount?.toFixed(2)}</TableCell>
                          <TableCell>₹{item.total_amount?.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end text-right">
                  <div className="space-y-1">
                    <p>Subtotal: ₹{selectedPO.subtotal?.toFixed(2)}</p>
                    <p>GST: ₹{selectedPO.total_gst?.toFixed(2)}</p>
                    <p className="font-bold">Total: ₹{selectedPO.total_amount?.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Prices Dialog */}
        <Dialog open={isEditPriceDialogOpen} onOpenChange={setIsEditPriceDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Prices - {editPricePO?.po_number}</DialogTitle>
            </DialogHeader>
            {editPricePO && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>Vendor: <span className="font-medium text-foreground">{editPricePO.vendors?.vendor_name}</span></p>
                  <p className="mt-1">Update item prices below. This is useful when prices change after receiving goods.</p>
                </div>

                {editPriceItems.length > 0 && (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead>GST %</TableHead>
                          <TableHead>Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {editPriceItems.map((item, index) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.item_name}</TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.rate}
                                onChange={(e) => handleUpdateEditPriceItemRate(index, parseFloat(e.target.value) || 0)}
                                className="w-24"
                              />
                            </TableCell>
                            <TableCell>{item.gst_percentage}%</TableCell>
                            <TableCell>
                              ₹{(item.quantity * item.rate * (1 + item.gst_percentage / 100)).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {editPriceItems.length > 0 && (
                  <div className="flex justify-end">
                    <div className="text-right space-y-1">
                      <p className="text-sm">Subtotal: ₹{editPriceTotals.subtotal.toFixed(2)}</p>
                      <p className="text-sm">GST: ₹{editPriceTotals.totalGst.toFixed(2)}</p>
                      <p className="font-bold">Total: ₹{editPriceTotals.total.toFixed(2)}</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditPriceDialogOpen(false);
                      setEditPricePO(null);
                      setEditPriceItems([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => updatePricesMutation.mutate()}
                    disabled={updatePricesMutation.isPending || editPriceItems.length === 0}
                  >
                    {updatePricesMutation.isPending ? "Updating..." : "Update Prices"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Print PO Dialog - Hidden on screen, visible on print */}
        {isPrintDialogOpen && printPO && (
          <>
            <style>{`
              @media print {
                body * { visibility: hidden !important; }
                .po-print-area, .po-print-area * { visibility: visible !important; }
                .po-print-area {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  padding: 20px !important;
                }
                .no-print { display: none !important; }
              }
            `}</style>
            <div className="fixed inset-0 bg-background/80 z-50 overflow-auto no-print">
              <div className="max-w-3xl mx-auto my-8 bg-background border rounded-lg shadow-lg">
                <div className="flex justify-between items-center p-4 border-b no-print">
                  <h3 className="font-semibold">Purchase Order Preview</h3>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => window.print()}>
                      <Printer className="h-4 w-4 mr-2" /> Print / Save PDF
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsPrintDialogOpen(false)}>
                      Close
                    </Button>
                  </div>
                </div>
                <div ref={printRef} className="po-print-area p-8" style={{ fontFamily: "Arial, sans-serif" }}>
                  {/* Company Header */}
                  <div style={{ textAlign: "center", marginBottom: "20px", borderBottom: "2px solid #333", paddingBottom: "15px" }}>
                    <h1 style={{ fontSize: "22px", fontWeight: "bold", margin: 0 }}>
                      {companySettings?.company_name || "Company Name"}
                    </h1>
                    {companySettings?.sub_title && (
                      <p style={{ fontSize: "12px", margin: "2px 0", color: "#666" }}>{companySettings.sub_title}</p>
                    )}
                    {companySettings?.address && (
                      <p style={{ fontSize: "11px", margin: "2px 0", color: "#666" }}>{companySettings.address}</p>
                    )}
                    {companySettings?.contact_no && (
                      <p style={{ fontSize: "11px", margin: "2px 0", color: "#666" }}>Phone: {companySettings.contact_no}</p>
                    )}
                    {companySettings?.gstin && (
                      <p style={{ fontSize: "11px", margin: "2px 0", color: "#666" }}>GSTIN: {companySettings.gstin}</p>
                    )}
                  </div>

                  <h2 style={{ textAlign: "center", fontSize: "16px", fontWeight: "bold", margin: "10px 0 20px" }}>
                    PURCHASE ORDER
                  </h2>

                  {/* PO Info & Vendor Info */}
                  {(() => {
                    const vendor = vendors.find(v => v.id === printPO.vendor_id);
                    return (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", fontSize: "12px" }}>
                        <div>
                          <p style={{ fontWeight: "bold", marginBottom: "4px" }}>To:</p>
                          <p style={{ fontWeight: "bold" }}>{vendor?.vendor_name || printPO.vendors?.vendor_name}</p>
                          {vendor?.address && <p>{vendor.address}</p>}
                          {vendor?.mobile_number && <p>Phone: {vendor.mobile_number}</p>}
                          {vendor?.email && <p>Email: {vendor.email}</p>}
                          {vendor?.gst_number && <p>GSTIN: {vendor.gst_number}</p>}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p><strong>PO Number:</strong> {printPO.po_number}</p>
                          <p><strong>Date:</strong> {printPO.created_at ? format(new Date(printPO.created_at), "dd/MM/yyyy") : "-"}</p>
                          {printPO.expected_delivery_date && (
                            <p><strong>Expected Delivery:</strong> {format(new Date(printPO.expected_delivery_date), "dd/MM/yyyy")}</p>
                          )}
                          <p><strong>Status:</strong> {statusLabels[printPO.status]}</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Items Table */}
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: "20px" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f0f0f0" }}>
                        <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "left" }}>#</th>
                        <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "left" }}>Item Name</th>
                        <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "left" }}>Unit</th>
                        <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "right" }}>Qty</th>
                        <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "right" }}>Rate (₹)</th>
                        <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "right" }}>Amount (₹)</th>
                        <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "right" }}>GST %</th>
                        <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "right" }}>GST (₹)</th>
                        <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "right" }}>Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printItems.map((item: any, idx: number) => {
                        const amount = item.quantity * item.rate;
                        const gst = item.gst_amount || (amount * (item.gst_percentage || 0) / 100);
                        const total = item.total_amount || (amount + gst);
                        return (
                          <tr key={item.id}>
                            <td style={{ border: "1px solid #ccc", padding: "6px" }}>{idx + 1}</td>
                            <td style={{ border: "1px solid #ccc", padding: "6px" }}>{item.purchase_items?.item_name}</td>
                            <td style={{ border: "1px solid #ccc", padding: "6px" }}>{item.purchase_items?.unit}</td>
                            <td style={{ border: "1px solid #ccc", padding: "6px", textAlign: "right" }}>{item.quantity}</td>
                            <td style={{ border: "1px solid #ccc", padding: "6px", textAlign: "right" }}>{item.rate?.toFixed(2)}</td>
                            <td style={{ border: "1px solid #ccc", padding: "6px", textAlign: "right" }}>{amount.toFixed(2)}</td>
                            <td style={{ border: "1px solid #ccc", padding: "6px", textAlign: "right" }}>{item.gst_percentage || 0}%</td>
                            <td style={{ border: "1px solid #ccc", padding: "6px", textAlign: "right" }}>{gst.toFixed(2)}</td>
                            <td style={{ border: "1px solid #ccc", padding: "6px", textAlign: "right" }}>{total.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
                    <div style={{ fontSize: "12px", textAlign: "right" }}>
                      <p>Subtotal: ₹{(printPO.subtotal || 0).toFixed(2)}</p>
                      <p>GST: ₹{(printPO.total_gst || 0).toFixed(2)}</p>
                      <p style={{ fontWeight: "bold", fontSize: "14px", borderTop: "1px solid #333", paddingTop: "4px" }}>
                        Total: ₹{(printPO.total_amount || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Notes */}
                  {printPO.notes && (
                    <div style={{ fontSize: "12px", marginBottom: "20px" }}>
                      <p style={{ fontWeight: "bold" }}>Notes:</p>
                      <p>{printPO.notes}</p>
                    </div>
                  )}

                  {/* Signature */}
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "60px", fontSize: "12px" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ borderTop: "1px solid #333", width: "200px", marginTop: "40px", paddingTop: "4px" }}>
                        Vendor Signature
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ borderTop: "1px solid #333", width: "200px", marginTop: "40px", paddingTop: "4px" }}>
                        Authorized Signatory
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
  );
}
