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
import { Badge } from "@/components/ui/badge";
import { Plus, Check, X, Search, Eye } from "lucide-react";
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

const initialFormData = {
  department: "kitchen" as DepartmentType,
  item_id: "",
  quantity: 1,
  priority: "medium" as PriorityLevel,
  remarks: "",
};

export default function PurchaseRequests() {
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuthContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [selectedPR, setSelectedPR] = useState<PurchaseRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [formData, setFormData] = useState(initialFormData);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: items = [] } = useQuery({
    queryKey: ["purchase-items-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_items")
        .select("id, item_name, unit")
        .eq("is_active", true)
        .order("item_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["purchase-requests"],
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
    const matchesStatus = statusFilter === "all" || pr.status === statusFilter;
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

  const generatePRNumber = () => {
    const date = new Date();
    const prefix = "PR";
    const timestamp = date.getFullYear().toString().slice(-2) +
      String(date.getMonth() + 1).padStart(2, "0") +
      String(date.getDate()).padStart(2, "0") +
      String(date.getHours()).padStart(2, "0") +
      String(date.getMinutes()).padStart(2, "0") +
      String(date.getSeconds()).padStart(2, "0");
    return `${prefix}${timestamp}`;
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("purchase_requests").insert([{
        ...data,
        pr_number: generatePRNumber(),
        created_by: user?.id,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
      toast.success("Purchase request created successfully");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to create request: " + error.message);
    },
  });

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

  const resetForm = () => {
    setFormData(initialFormData);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.item_id) {
      toast.error("Please select an item");
      return;
    }
    if (formData.quantity < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }
    createMutation.mutate(formData);
  };

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
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Purchase Requests</h1>
            <p className="text-muted-foreground text-sm">
              Create and manage purchase requests
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Purchase Request</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) =>
                      setFormData({ ...formData, department: value as DepartmentType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(departmentLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item_id">Item *</Label>
                  <Select
                    value={formData.item_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, item_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.item_name} ({item.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) =>
                        setFormData({ ...formData, priority: value as PriorityLevel })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(priorityLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    value={formData.remarks}
                    onChange={(e) =>
                      setFormData({ ...formData, remarks: e.target.value })
                    }
                    placeholder="Any additional notes..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    Create Request
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <CardTitle className="text-base">Requests List</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            No requests found
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedData.map((pr) => (
                          <TableRow key={pr.id}>
                            <TableCell className="font-medium">
                              {pr.pr_number}
                            </TableCell>
                            <TableCell>{departmentLabels[pr.department]}</TableCell>
                            <TableCell>
                              {pr.purchase_items?.item_name || "N/A"}
                            </TableCell>
                            <TableCell>
                              {pr.quantity} {pr.purchase_items?.unit}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={pr.priority === "high" ? "destructive" : pr.priority === "medium" ? "default" : "secondary"}
                              >
                                {priorityLabels[pr.priority]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusColors[pr.status]}>
                                {pr.status.charAt(0).toUpperCase() + pr.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {pr.created_at ? format(new Date(pr.created_at), "dd/MM/yyyy") : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                {pr.status === "pending" && (isAdmin() || true) && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleApproval(pr)}
                                    title="Approve/Reject"
                                  >
                                    <Eye className="h-4 w-4" />
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Review Purchase Request</DialogTitle>
            </DialogHeader>
            {selectedPR && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">PR Number:</span>
                    <p className="font-medium">{selectedPR.pr_number}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Department:</span>
                    <p className="font-medium">{departmentLabels[selectedPR.department]}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Item:</span>
                    <p className="font-medium">{selectedPR.purchase_items?.item_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Quantity:</span>
                    <p className="font-medium">{selectedPR.quantity} {selectedPR.purchase_items?.unit}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Priority:</span>
                    <p className="font-medium">{priorityLabels[selectedPR.priority]}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Requested By:</span>
                    <p className="font-medium">
                      {selectedPR.profiles?.first_name} {selectedPR.profiles?.last_name}
                    </p>
                  </div>
                  {selectedPR.remarks && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Remarks:</span>
                      <p className="font-medium">{selectedPR.remarks}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Rejection Reason (if rejecting)</Label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => confirmApproval("rejected")}
                    disabled={approveMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => confirmApproval("approved")}
                    disabled={approveMutation.isPending}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
