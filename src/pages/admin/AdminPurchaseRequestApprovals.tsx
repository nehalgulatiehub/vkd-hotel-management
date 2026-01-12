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

type DepartmentType = "kitchen" | "housekeeping" | "maintenance" | "front_desk" | "admin" | "other";
type PriorityLevel = "low" | "medium" | "high";
type PrStatus = "pending" | "approved" | "rejected";

interface PurchaseRequest {
  id: string;
  pr_number: string;
  department: DepartmentType;
  item_id: string;
  quantity: number;
  priority: PriorityLevel;
  remarks: string | null;
  status: PrStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_by: string | null;
  created_at: string | null;
  purchase_items?: {
    item_name: string;
    unit: string;
  };
  profiles?: {
    first_name: string | null;
    last_name: string | null;
  };
}

const departmentLabels: Record<DepartmentType, string> = {
  kitchen: "Kitchen",
  housekeeping: "Housekeeping",
  maintenance: "Maintenance",
  front_desk: "Front Desk",
  admin: "Admin",
  other: "Other",
};

const priorityLabels: Record<PriorityLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const statusColors: Record<PrStatus, "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
};

interface AdminPurchaseRequestApprovalsProps {
  statusFilter?: "pending" | "approved" | "rejected" | "all";
}

export default function AdminPurchaseRequestApprovals({ statusFilter = "pending" }: AdminPurchaseRequestApprovalsProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [selectedPR, setSelectedPR] = useState<PurchaseRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [localStatusFilter, setLocalStatusFilter] = useState<string>(statusFilter);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["purchase-requests-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_requests")
        .select(`
          *,
          purchase_items (item_name, unit)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PurchaseRequest[];
    },
  });

  const filteredRequests = requests.filter((pr) => {
    const matchesSearch = pr.pr_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.purchase_items?.item_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = localStatusFilter === "all" || pr.status === localStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedData,
    startIndex,
    endIndex,
    goToPage,
  } = usePagination(filteredRequests, { itemsPerPage: 10 });

  const approveMutation = useMutation({
    mutationFn: async ({ id, status, rejection_reason }: { id: string; status: PrStatus; rejection_reason?: string }) => {
      const { error } = await supabase
        .from("purchase_requests")
        .update({
          status,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          rejection_reason: rejection_reason || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requests-admin"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
      toast.success(`Request ${variables.status} successfully`);
      setIsApprovalDialogOpen(false);
      setSelectedPR(null);
      setRejectionReason("");
    },
    onError: (error) => {
      toast.error("Failed to update request: " + error.message);
    },
  });

  const handleApproval = (pr: PurchaseRequest) => {
    setSelectedPR(pr);
    setIsApprovalDialogOpen(true);
  };

  const confirmApproval = (status: PrStatus) => {
    if (!selectedPR) return;
    if (status === "rejected" && !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    approveMutation.mutate({
      id: selectedPR.id,
      status,
      rejection_reason: status === "rejected" ? rejectionReason : undefined,
    });
  };

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">Purchase Request Approvals</h1>
        <p className="text-muted-foreground text-sm">
          Review and approve/reject purchase requests
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle className="text-base">Requests List</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select value={localStatusFilter} onValueChange={setLocalStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search requests..."
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
                      <TableHead>PR Number</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          No requests found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedData.map((pr) => (
                        <TableRow key={pr.id}>
                          <TableCell className="font-medium">{pr.pr_number}</TableCell>
                          <TableCell>{departmentLabels[pr.department]}</TableCell>
                          <TableCell>{pr.purchase_items?.item_name || "N/A"}</TableCell>
                          <TableCell>{pr.quantity} {pr.purchase_items?.unit}</TableCell>
                          <TableCell>
                            <Badge variant={pr.priority === "high" ? "destructive" : pr.priority === "medium" ? "default" : "secondary"}>
                              {priorityLabels[pr.priority]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusColors[pr.status]}>
                              {pr.status.charAt(0).toUpperCase() + pr.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>
                            {pr.created_at ? format(new Date(pr.created_at), "dd/MM/yyyy") : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleApproval(pr)}
                                title="View & Approve"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {pr.status === "pending" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setSelectedPR(pr);
                                      approveMutation.mutate({ id: pr.id, status: "approved" });
                                    }}
                                    title="Approve"
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleApproval(pr)}
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
                totalItems={filteredRequests.length}
                startIndex={startIndex}
                endIndex={endIndex}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Purchase Request</DialogTitle>
          </DialogHeader>
          {selectedPR && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">PR Number</Label>
                  <p className="font-medium">{selectedPR.pr_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Department</Label>
                  <p className="font-medium">{departmentLabels[selectedPR.department]}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Item</Label>
                  <p className="font-medium">{selectedPR.purchase_items?.item_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Quantity</Label>
                  <p className="font-medium">{selectedPR.quantity} {selectedPR.purchase_items?.unit}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Priority</Label>
                  <Badge variant={selectedPR.priority === "high" ? "destructive" : selectedPR.priority === "medium" ? "default" : "secondary"}>
                    {priorityLabels[selectedPR.priority]}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={statusColors[selectedPR.status]} className="ml-2">
                    {selectedPR.status.charAt(0).toUpperCase() + selectedPR.status.slice(1)}
                  </Badge>
                </div>
              </div>
              {selectedPR.remarks && (
                <div>
                  <Label className="text-muted-foreground">Remarks</Label>
                  <p className="font-medium">{selectedPR.remarks}</p>
                </div>
              )}
              {selectedPR.status === "rejected" && selectedPR.rejection_reason && (
                <div>
                  <Label className="text-muted-foreground text-red-600">Rejection Reason</Label>
                  <p className="font-medium text-red-600">{selectedPR.rejection_reason}</p>
                </div>
              )}
              {selectedPR.status === "pending" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="rejection_reason">Rejection Reason (if rejecting)</Label>
                    <Textarea
                      id="rejection_reason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Provide reason for rejection..."
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => confirmApproval("rejected")}
                      disabled={approveMutation.isPending}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => confirmApproval("approved")}
                      disabled={approveMutation.isPending}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
