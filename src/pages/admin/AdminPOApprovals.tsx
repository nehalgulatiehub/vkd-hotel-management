import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Check, X } from "lucide-react";
import { toast } from "sonner";
import { TablePagination } from "@/components/ui/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface AdminPOApprovalsProps {
  status: "pending" | "approved" | "rejected";
}

export default function AdminPOApprovals({ status }: AdminPOApprovalsProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["purchase-orders-admin", status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select(`
          *,
          vendors (vendor_name)
        `)
        .eq("status", status)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: poItemsData = [] } = useQuery({
    queryKey: ["po-items-admin", selectedPO?.id],
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
    return po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.vendors?.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedData,
    startIndex,
    endIndex,
    goToPage,
  } = usePagination(filteredOrders, { itemsPerPage: 10 });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("purchase_orders")
        .update({ status: "approved" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders-admin"] });
      toast.success("Purchase Order approved successfully");
      setIsViewDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to approve: " + error.message);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from("purchase_orders")
        .update({ 
          status: "rejected",
          notes: reason 
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders-admin"] });
      toast.success("Purchase Order rejected");
      setIsRejectDialogOpen(false);
      setIsViewDialogOpen(false);
      setRejectionReason("");
    },
    onError: (error) => {
      toast.error("Failed to reject: " + error.message);
    },
  });

  const handleView = (po: any) => {
    setSelectedPO(po);
    setIsViewDialogOpen(true);
  };

  const handleReject = (po: any) => {
    setSelectedPO(po);
    setIsRejectDialogOpen(true);
  };

  const statusTitle = status === "pending" ? "Pending PO Approvals" : 
                      status === "approved" ? "Approved Purchase Orders" : "Rejected Purchase Orders";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{statusTitle}</h1>
        <p className="text-muted-foreground text-sm">
          {status === "pending" ? "Review and approve purchase orders" : `View ${status} purchase orders`}
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle className="text-base">Purchase Orders</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-4">Loading...</p>
          ) : paginatedData.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">No purchase orders found</p>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Expected Date</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell className="font-medium">{po.po_number}</TableCell>
                        <TableCell>{po.vendors?.vendor_name || "-"}</TableCell>
                        <TableCell>
                          {po.expected_delivery_date ? format(new Date(po.expected_delivery_date), "dd/MM/yyyy") : "-"}
                        </TableCell>
                        <TableCell className="text-right">₹{po.total_amount?.toFixed(2) || "0.00"}</TableCell>
                        <TableCell>
                          <Badge variant={
                            po.status === "approved" ? "default" :
                            po.status === "rejected" ? "destructive" : "secondary"
                          }>
                            {po.status === "pending" ? "Pending" : 
                             po.status === "approved" ? "Approved" : "Rejected"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {po.created_at ? format(new Date(po.created_at), "dd/MM/yyyy") : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleView(po)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {status === "pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => approveMutation.mutate(po.id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleReject(po)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                startIndex={startIndex}
                endIndex={endIndex}
                totalItems={filteredOrders.length}
                onPageChange={goToPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Purchase Order Details - {selectedPO?.po_number}</DialogTitle>
          </DialogHeader>
          {selectedPO && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Vendor:</span>{" "}
                  <span className="font-medium">{selectedPO.vendors?.vendor_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Expected Delivery:</span>{" "}
                  <span className="font-medium">
                    {selectedPO.expected_delivery_date ? format(new Date(selectedPO.expected_delivery_date), "dd/MM/yyyy") : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Subtotal:</span>{" "}
                  <span className="font-medium">₹{selectedPO.subtotal?.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">GST:</span>{" "}
                  <span className="font-medium">₹{selectedPO.total_gst?.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total:</span>{" "}
                  <span className="font-medium">₹{selectedPO.total_amount?.toFixed(2)}</span>
                </div>
              </div>

              {poItemsData.length > 0 && (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {poItemsData.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.purchase_items?.item_name}</TableCell>
                          <TableCell>{item.purchase_items?.unit}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">₹{item.rate?.toFixed(2)}</TableCell>
                          <TableCell className="text-right">₹{item.total_amount?.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {selectedPO.notes && (
                <div>
                  <span className="text-muted-foreground text-sm">Notes:</span>
                  <p className="text-sm">{selectedPO.notes}</p>
                </div>
              )}

              {status === "pending" && (
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleReject(selectedPO)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => approveMutation.mutate(selectedPO.id)}
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

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Purchase Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rejection Reason</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => rejectMutation.mutate({ id: selectedPO?.id, reason: rejectionReason })}
                disabled={rejectMutation.isPending}
              >
                Reject PO
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
