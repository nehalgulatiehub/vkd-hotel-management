import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
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
import { Plus, Pencil, Trash2, Search, Eye } from "lucide-react";
import { toast } from "sonner";
import { TablePagination } from "@/components/ui/TablePagination";
import { usePagination } from "@/hooks/usePagination";

interface Vendor {
  id: string;
  vendor_name: string;
  contact_person: string | null;
  mobile_number: string | null;
  email: string | null;
  gst_number: string | null;
  address: string | null;
  payment_terms: number | null;
  is_active: boolean | null;
  notes: string | null;
  created_at: string | null;
}

const initialFormData = {
  vendor_name: "",
  contact_person: "",
  mobile_number: "",
  email: "",
  gst_number: "",
  address: "",
  payment_terms: 30,
  notes: "",
};

export default function Vendors() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [viewingVendor, setViewingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Vendor[];
    },
  });

  const filteredVendors = vendors.filter(
    (vendor) =>
      vendor.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.mobile_number?.includes(searchTerm)
  );

  const {
    currentPage,
    totalPages,
    paginatedData,
    startIndex,
    endIndex,
    setCurrentPage,
  } = usePagination({ data: filteredVendors, itemsPerPage: 10 });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("vendors").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Vendor created successfully");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to create vendor: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      const { id, ...updateData } = data;
      const { error } = await supabase
        .from("vendors")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Vendor updated successfully");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to update vendor: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vendors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Vendor deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete vendor: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingVendor(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendor_name.trim()) {
      toast.error("Vendor name is required");
      return;
    }
    if (editingVendor) {
      updateMutation.mutate({ ...formData, id: editingVendor.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      vendor_name: vendor.vendor_name,
      contact_person: vendor.contact_person || "",
      mobile_number: vendor.mobile_number || "",
      email: vendor.email || "",
      gst_number: vendor.gst_number || "",
      address: vendor.address || "",
      payment_terms: vendor.payment_terms || 30,
      notes: vendor.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleView = (vendor: Vendor) => {
    setViewingVendor(vendor);
    setIsViewDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Vendor Management</h1>
            <p className="text-muted-foreground text-sm">
              Manage your vendors and suppliers
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingVendor ? "Edit Vendor" : "Add New Vendor"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vendor_name">Vendor Name *</Label>
                    <Input
                      id="vendor_name"
                      value={formData.vendor_name}
                      onChange={(e) =>
                        setFormData({ ...formData, vendor_name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_person">Contact Person</Label>
                    <Input
                      id="contact_person"
                      value={formData.contact_person}
                      onChange={(e) =>
                        setFormData({ ...formData, contact_person: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile_number">Mobile Number</Label>
                    <Input
                      id="mobile_number"
                      value={formData.mobile_number}
                      onChange={(e) =>
                        setFormData({ ...formData, mobile_number: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gst_number">GST Number</Label>
                    <Input
                      id="gst_number"
                      value={formData.gst_number}
                      onChange={(e) =>
                        setFormData({ ...formData, gst_number: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_terms">Payment Terms (Days)</Label>
                    <Select
                      value={String(formData.payment_terms)}
                      onValueChange={(value) =>
                        setFormData({ ...formData, payment_terms: parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 Days</SelectItem>
                        <SelectItem value="15">15 Days</SelectItem>
                        <SelectItem value="30">30 Days</SelectItem>
                        <SelectItem value="45">45 Days</SelectItem>
                        <SelectItem value="60">60 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingVendor ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <CardTitle className="text-base">Vendors List</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vendors..."
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
                        <TableHead>Vendor Name</TableHead>
                        <TableHead>Contact Person</TableHead>
                        <TableHead>Mobile</TableHead>
                        <TableHead>GST Number</TableHead>
                        <TableHead>Payment Terms</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            No vendors found
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedData.map((vendor) => (
                          <TableRow key={vendor.id}>
                            <TableCell className="font-medium">
                              {vendor.vendor_name}
                            </TableCell>
                            <TableCell>{vendor.contact_person || "-"}</TableCell>
                            <TableCell>{vendor.mobile_number || "-"}</TableCell>
                            <TableCell>{vendor.gst_number || "-"}</TableCell>
                            <TableCell>{vendor.payment_terms} Days</TableCell>
                            <TableCell>
                              <Badge variant={vendor.is_active ? "default" : "secondary"}>
                                {vendor.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleView(vendor)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(vendor)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (confirm("Are you sure you want to delete this vendor?")) {
                                      deleteMutation.mutate(vendor.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
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
                  onPageChange={setCurrentPage}
                  totalItems={filteredVendors.length}
                  startIndex={startIndex}
                  endIndex={endIndex}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* View Vendor Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Vendor Details</DialogTitle>
            </DialogHeader>
            {viewingVendor && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Vendor Name:</span>
                    <p className="font-medium">{viewingVendor.vendor_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Contact Person:</span>
                    <p className="font-medium">{viewingVendor.contact_person || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mobile:</span>
                    <p className="font-medium">{viewingVendor.mobile_number || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">{viewingVendor.email || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">GST Number:</span>
                    <p className="font-medium">{viewingVendor.gst_number || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payment Terms:</span>
                    <p className="font-medium">{viewingVendor.payment_terms} Days</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Address:</span>
                    <p className="font-medium">{viewingVendor.address || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Notes:</span>
                    <p className="font-medium">{viewingVendor.notes || "-"}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
