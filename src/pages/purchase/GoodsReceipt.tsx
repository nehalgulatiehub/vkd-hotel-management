import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
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
import { Plus, Search, Eye } from "lucide-react";
import { toast } from "sonner";
import { TablePagination } from "@/components/ui/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { format } from "date-fns";

interface GRN {
  id: string;
  grn_number: string;
  po_id: string;
  receipt_date: string | null;
  notes: string | null;
  created_at: string | null;
  purchase_orders?: {
    po_number: string;
    vendors?: {
      vendor_name: string;
    };
  };
}

interface GRNItem {
  po_item_id: string;
  item_id: string;
  item_name: string;
  unit: string;
  ordered_quantity: number;
  received_quantity: number;
  damaged_quantity: number;
}

export default function GoodsReceipt() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedGRN, setSelectedGRN] = useState<GRN | null>(null);
  const [selectedPO, setSelectedPO] = useState("");
  const [receiptDate, setReceiptDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const [grnItems, setGrnItems] = useState<GRNItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: openPOs = [] } = useQuery({
    queryKey: ["open-pos-for-grn"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select(`
          id,
          po_number,
          vendors (vendor_name)
        `)
        .in("status", ["sent_to_vendor", "partially_received"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: poItems = [] } = useQuery({
    queryKey: ["po-items-for-grn", selectedPO],
    queryFn: async () => {
      if (!selectedPO) return [];
      const { data, error } = await supabase
        .from("purchase_order_items")
        .select(`
          id,
          item_id,
          quantity,
          received_quantity,
          purchase_items (item_name, unit)
        `)
        .eq("po_id", selectedPO);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPO,
  });

  const { data: grns = [], isLoading } = useQuery({
    queryKey: ["goods-receipt-notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goods_receipt_notes")
        .select(`
          *,
          purchase_orders (
            po_number,
            vendors (vendor_name)
          )
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as GRN[];
    },
  });

  const { data: grnItemsData = [] } = useQuery({
    queryKey: ["grn-items", selectedGRN?.id],
    queryFn: async () => {
      if (!selectedGRN) return [];
      const { data, error } = await supabase
        .from("grn_items")
        .select(`
          *,
          purchase_items (item_name, unit)
        `)
        .eq("grn_id", selectedGRN.id);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedGRN,
  });

  const filteredGRNs = grns.filter((grn) =>
    grn.grn_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    grn.purchase_orders?.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    grn.purchase_orders?.vendors?.vendor_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedData,
    startIndex,
    endIndex,
    goToPage,
  } = usePagination(filteredGRNs, { itemsPerPage: 10 });

  const generateGRNNumber = () => {
    const date = new Date();
    const prefix = "GRN";
    const timestamp = date.getFullYear().toString().slice(-2) +
      String(date.getMonth() + 1).padStart(2, "0") +
      String(date.getDate()).padStart(2, "0") +
      String(date.getHours()).padStart(2, "0") +
      String(date.getMinutes()).padStart(2, "0") +
      String(date.getSeconds()).padStart(2, "0");
    return `${prefix}${timestamp}`;
  };

  const handlePOSelect = (poId: string) => {
    setSelectedPO(poId);
    setGrnItems([]);
  };

  // Populate GRN items when PO items are loaded
  useState(() => {
    if (poItems.length > 0 && grnItems.length === 0) {
      const items: GRNItem[] = poItems.map((item: any) => ({
        po_item_id: item.id,
        item_id: item.item_id,
        item_name: item.purchase_items?.item_name || "",
        unit: item.purchase_items?.unit || "",
        ordered_quantity: item.quantity,
        received_quantity: 0,
        damaged_quantity: 0,
      }));
      setGrnItems(items);
    }
  });

  // Use effect to update grn items when poItems change
  const loadGrnItems = () => {
    if (poItems.length > 0) {
      const items: GRNItem[] = poItems.map((item: any) => ({
        po_item_id: item.id,
        item_id: item.item_id,
        item_name: item.purchase_items?.item_name || "",
        unit: item.purchase_items?.unit || "",
        ordered_quantity: item.quantity - (item.received_quantity || 0),
        received_quantity: 0,
        damaged_quantity: 0,
      }));
      setGrnItems(items);
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPO || grnItems.length === 0) {
        throw new Error("Please select PO and add items");
      }

      const validItems = grnItems.filter((item) => item.received_quantity > 0);
      if (validItems.length === 0) {
        throw new Error("Please enter received quantities");
      }

      // Create GRN
      const { data: grn, error: grnError } = await supabase
        .from("goods_receipt_notes")
        .insert([{
          grn_number: generateGRNNumber(),
          po_id: selectedPO,
          receipt_date: receiptDate,
          notes: notes || null,
          created_by: user?.id,
        }])
        .select()
        .single();

      if (grnError) throw grnError;

      // Create GRN items
      const grnItemsToInsert = validItems.map((item) => ({
        grn_id: grn.id,
        po_item_id: item.po_item_id,
        item_id: item.item_id,
        received_quantity: item.received_quantity,
        damaged_quantity: item.damaged_quantity,
      }));

      const { error: itemsError } = await supabase
        .from("grn_items")
        .insert(grnItemsToInsert);

      if (itemsError) throw itemsError;

      // Update PO items received quantity
      for (const item of validItems) {
        const poItem = poItems.find((p: any) => p.id === item.po_item_id);
        const newReceivedQty = (poItem?.received_quantity || 0) + item.received_quantity;
        
        await supabase
          .from("purchase_order_items")
          .update({ received_quantity: newReceivedQty })
          .eq("id", item.po_item_id);
      }

      // Update inventory
      for (const item of validItems) {
        const acceptedQty = item.received_quantity - item.damaged_quantity;
        if (acceptedQty > 0) {
          // Check if inventory record exists
          const { data: existing } = await supabase
            .from("inventory")
            .select("id, current_stock")
            .eq("item_id", item.item_id)
            .single();

          if (existing) {
            await supabase
              .from("inventory")
              .update({
                current_stock: existing.current_stock + acceptedQty,
                last_updated: new Date().toISOString(),
              })
              .eq("id", existing.id);
          } else {
            await supabase
              .from("inventory")
              .insert([{
                item_id: item.item_id,
                current_stock: acceptedQty,
              }]);
          }

          // Add inventory history
          await supabase
            .from("inventory_history")
            .insert([{
              item_id: item.item_id,
              grn_id: grn.id,
              change_type: "grn_receipt",
              quantity_change: acceptedQty,
              previous_stock: existing?.current_stock || 0,
              new_stock: (existing?.current_stock || 0) + acceptedQty,
              created_by: user?.id,
            }]);
        }
      }

      // Check if PO is fully received and update status
      const { data: allPoItems } = await supabase
        .from("purchase_order_items")
        .select("quantity, received_quantity")
        .eq("po_id", selectedPO);

      const allReceived = allPoItems?.every((item: any) => item.received_quantity >= item.quantity);
      const someReceived = allPoItems?.some((item: any) => item.received_quantity > 0);

      if (allReceived) {
        await supabase
          .from("purchase_orders")
          .update({ status: "closed" })
          .eq("id", selectedPO);
      } else if (someReceived) {
        await supabase
          .from("purchase_orders")
          .update({ status: "partially_received" })
          .eq("id", selectedPO);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goods-receipt-notes"] });
      queryClient.invalidateQueries({ queryKey: ["open-pos-for-grn"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("GRN created and inventory updated");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to create GRN: " + error.message);
    },
  });

  const resetForm = () => {
    setSelectedPO("");
    setReceiptDate(format(new Date(), "yyyy-MM-dd"));
    setNotes("");
    setGrnItems([]);
    setIsDialogOpen(false);
  };

  const handleView = (grn: GRN) => {
    setSelectedGRN(grn);
    setIsViewDialogOpen(true);
  };

  const updateReceivedQty = (index: number, qty: number) => {
    const updated = [...grnItems];
    updated[index].received_quantity = qty;
    setGrnItems(updated);
  };

  const updateDamagedQty = (index: number, qty: number) => {
    const updated = [...grnItems];
    updated[index].damaged_quantity = qty;
    setGrnItems(updated);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Goods Receipt Notes</h1>
            <p className="text-muted-foreground text-sm">
              Receive goods against purchase orders
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                New GRN
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Goods Receipt Note</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Select Purchase Order *</Label>
                    <Select value={selectedPO} onValueChange={handlePOSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select PO" />
                      </SelectTrigger>
                      <SelectContent>
                        {openPOs.map((po: any) => (
                          <SelectItem key={po.id} value={po.id}>
                            {po.po_number} - {po.vendors?.vendor_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Receipt Date</Label>
                    <Input
                      type="date"
                      value={receiptDate}
                      onChange={(e) => setReceiptDate(e.target.value)}
                    />
                  </div>
                </div>

                {selectedPO && poItems.length > 0 && (
                  <>
                    <Button type="button" variant="outline" onClick={loadGrnItems}>
                      Load Items
                    </Button>
                    
                    {grnItems.length > 0 && (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Item</TableHead>
                              <TableHead>Unit</TableHead>
                              <TableHead>Pending Qty</TableHead>
                              <TableHead>Received Qty</TableHead>
                              <TableHead>Damaged Qty</TableHead>
                              <TableHead>Accepted</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {grnItems.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>{item.item_name}</TableCell>
                                <TableCell>{item.unit}</TableCell>
                                <TableCell>{item.ordered_quantity}</TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    max={item.ordered_quantity}
                                    value={item.received_quantity}
                                    onChange={(e) => updateReceivedQty(index, parseInt(e.target.value) || 0)}
                                    className="w-20"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    max={item.received_quantity}
                                    value={item.damaged_quantity}
                                    onChange={(e) => updateDamagedQty(index, parseInt(e.target.value) || 0)}
                                    className="w-20"
                                  />
                                </TableCell>
                                <TableCell>
                                  {item.received_quantity - item.damaged_quantity}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </>
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
                    onClick={() => createMutation.mutate()}
                    disabled={createMutation.isPending || !selectedPO || grnItems.length === 0}
                  >
                    Create GRN
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <CardTitle className="text-base">GRN List</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search GRNs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
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
                        <TableHead>GRN Number</TableHead>
                        <TableHead>PO Number</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Receipt Date</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            No GRNs found
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedData.map((grn) => (
                          <TableRow key={grn.id}>
                            <TableCell className="font-medium">
                              {grn.grn_number}
                            </TableCell>
                            <TableCell>{grn.purchase_orders?.po_number || "N/A"}</TableCell>
                            <TableCell>
                              {grn.purchase_orders?.vendors?.vendor_name || "N/A"}
                            </TableCell>
                            <TableCell>
                              {grn.receipt_date
                                ? format(new Date(grn.receipt_date), "dd/MM/yyyy")
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {grn.created_at
                                ? format(new Date(grn.created_at), "dd/MM/yyyy")
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleView(grn)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
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
                  totalItems={filteredGRNs.length}
                  startIndex={startIndex}
                  endIndex={endIndex}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* View GRN Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>GRN Details</DialogTitle>
            </DialogHeader>
            {selectedGRN && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">GRN Number:</span>
                    <p className="font-medium">{selectedGRN.grn_number}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">PO Number:</span>
                    <p className="font-medium">{selectedGRN.purchase_orders?.po_number}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vendor:</span>
                    <p className="font-medium">{selectedGRN.purchase_orders?.vendors?.vendor_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Receipt Date:</span>
                    <p className="font-medium">
                      {selectedGRN.receipt_date
                        ? format(new Date(selectedGRN.receipt_date), "dd/MM/yyyy")
                        : "-"}
                    </p>
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Received</TableHead>
                        <TableHead>Damaged</TableHead>
                        <TableHead>Accepted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grnItemsData.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.purchase_items?.item_name}</TableCell>
                          <TableCell>{item.received_quantity}</TableCell>
                          <TableCell>{item.damaged_quantity}</TableCell>
                          <TableCell>{item.accepted_quantity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {selectedGRN.notes && (
                  <div>
                    <span className="text-muted-foreground">Notes:</span>
                    <p>{selectedGRN.notes}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
