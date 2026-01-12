import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Check, X, Search, Eye } from "lucide-react";
import { toast } from "sonner";
import { TablePagination } from "@/components/ui/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { format } from "date-fns";

type ItemCategory = "kitchen_items" | "housekeeping_items" | "linen" | "toiletries" | "maintenance" | "other";
type ItemUnit = "kg" | "liter" | "piece" | "box" | "packet" | "dozen" | "meter" | "set";

interface PurchaseItem {
  id: string;
  item_name: string;
  category: ItemCategory;
  unit: ItemUnit;
  reorder_level: number | null;
  gst_percentage: number | null;
  hsn_code: string | null;
  description: string | null;
  is_active: boolean | null;
  created_at: string | null;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
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

interface AdminPurchaseItemApprovalsProps {
  statusFilter?: "pending" | "approved" | "all";
}

export default function AdminPurchaseItemApprovals({ statusFilter = "pending" }: AdminPurchaseItemApprovalsProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PurchaseItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [localStatusFilter, setLocalStatusFilter] = useState<string>(statusFilter);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["purchase-items-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_items")
        .select(`
          *,
          profiles:created_by (first_name, last_name)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PurchaseItem[];
    },
  });

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.hsn_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = localStatusFilter === "all" || 
      (localStatusFilter === "pending" && !item.is_active) ||
      (localStatusFilter === "approved" && item.is_active);
    return matchesSearch && matchesStatus;
  });

  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedData,
    startIndex,
    endIndex,
    goToPage,
  } = usePagination(filteredItems, { itemsPerPage: 10 });

  const approveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("purchase_items")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-items-admin"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-items"] });
      toast.success(`Item ${variables.is_active ? 'approved' : 'rejected'} successfully`);
      setIsViewDialogOpen(false);
      setSelectedItem(null);
    },
    onError: (error) => {
      toast.error("Failed to update item: " + error.message);
    },
  });

  const handleView = (item: PurchaseItem) => {
    setSelectedItem(item);
    setIsViewDialogOpen(true);
  };

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">Item Master Approvals</h1>
        <p className="text-muted-foreground text-sm">
          Review and approve/reject item requests
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle className="text-base">Items List</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select value={localStatusFilter} onValueChange={setLocalStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
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
                      <TableHead>Reorder Level</TableHead>
                      <TableHead>GST %</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          No items found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedData.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.item_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{categoryLabels[item.category]}</Badge>
                          </TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>{item.reorder_level}</TableCell>
                          <TableCell>{item.gst_percentage}%</TableCell>
                          <TableCell>
                            <Badge variant={item.is_active ? "default" : "secondary"}>
                              {item.is_active ? "Approved" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.created_at ? format(new Date(item.created_at), "dd/MM/yyyy") : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleView(item)}
                                title="View & Approve"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {!item.is_active && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => approveMutation.mutate({ id: item.id, is_active: true })}
                                    title="Approve"
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => approveMutation.mutate({ id: item.id, is_active: false })}
                                    title="Reject"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
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
                totalItems={filteredItems.length}
                startIndex={startIndex}
                endIndex={endIndex}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Item Details</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Item Name</Label>
                  <p className="font-medium">{selectedItem.item_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p className="font-medium">{categoryLabels[selectedItem.category]}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Unit</Label>
                  <p className="font-medium">{selectedItem.unit}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Reorder Level</Label>
                  <p className="font-medium">{selectedItem.reorder_level}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">GST %</Label>
                  <p className="font-medium">{selectedItem.gst_percentage}%</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">HSN Code</Label>
                  <p className="font-medium">{selectedItem.hsn_code || "-"}</p>
                </div>
              </div>
              {selectedItem.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="font-medium">{selectedItem.description}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <Badge variant={selectedItem.is_active ? "default" : "secondary"} className="ml-2">
                  {selectedItem.is_active ? "Approved" : "Pending"}
                </Badge>
              </div>
              {!selectedItem.is_active && (
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => approveMutation.mutate({ id: selectedItem.id, is_active: false })}
                    disabled={approveMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => approveMutation.mutate({ id: selectedItem.id, is_active: true })}
                    disabled={approveMutation.isPending}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
