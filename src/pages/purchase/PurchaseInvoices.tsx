import { DateInput } from "@/components/ui/DateInput";
import { useState } from "react";
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
import { Plus, Search, Eye, CreditCard, Layers } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { TablePagination } from "@/components/ui/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { format } from "date-fns";

type PaymentStatus = "pending" | "partially_paid" | "paid";

interface PurchaseInvoice {
  id: string;
  invoice_number: string;
  vendor_invoice_number: string | null;
  po_id: string;
  grn_id: string | null;
  vendor_id: string;
  invoice_date: string | null;
  due_date: string | null;
  subtotal: number | null;
  cgst_amount: number | null;
  sgst_amount: number | null;
  igst_amount: number | null;
  total_amount: number | null;
  paid_amount: number | null;
  balance_amount: number | null;
  payment_status: PaymentStatus;
  notes: string | null;
  created_at: string | null;
  vendors?: {
    vendor_name: string;
  };
  purchase_orders?: {
    po_number: string;
  };
}

const statusColors: Record<PaymentStatus, "default" | "secondary" | "destructive"> = {
  pending: "destructive",
  partially_paid: "secondary",
  paid: "default",
};

const statusLabels: Record<PaymentStatus, string> = {
  pending: "Pending",
  partially_paid: "Partially Paid",
  paid: "Paid",
};

export default function PurchaseInvoices() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isBulkPaymentDialogOpen, setIsBulkPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
  const [selectedPO, setSelectedPO] = useState("");
  const [vendorInvoiceNumber, setVendorInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dueDate, setDueDate] = useState("");
  const [subtotal, setSubtotal] = useState(0);
  const [cgst, setCgst] = useState(0);
  const [sgst, setSgst] = useState(0);
  const [igst, setIgst] = useState(0);
  const [notes, setNotes] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [paymentMode, setPaymentMode] = useState("bank_transfer");
  const [paymentRef, setPaymentRef] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Bulk payment state
  const [bulkVendorId, setBulkVendorId] = useState("");
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [bulkPaymentAmount, setBulkPaymentAmount] = useState(0);
  const [bulkPaymentDate, setBulkVendorDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [bulkPaymentMode, setBulkPaymentMode] = useState("bank_transfer");
  const [bulkPaymentRef, setBulkPaymentRef] = useState("");
  const [bulkNotes, setBulkNotes] = useState("");

  const { data: vendors = [] } = useQuery({
    queryKey: ["vendors-active-for-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("id, vendor_name")
        .eq("is_active", true)
        .order("vendor_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: approvedPOs = [] } = useQuery({
    queryKey: ["approved-pos-for-invoice"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select(`
          id,
          po_number,
          vendor_id,
          total_amount,
          vendors (vendor_name)
        `)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["purchase-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_invoices")
        .select(`
          *,
          vendors (vendor_name),
          purchase_orders (po_number)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PurchaseInvoice[];
    },
  });

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch = inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.vendors?.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.vendor_invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedData,
    startIndex,
    endIndex,
    goToPage,
  } = usePagination(filteredInvoices, { itemsPerPage: 10 });

  const generateInvoiceNumber = () => {
    const date = new Date();
    const prefix = "PI";
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
    const po = approvedPOs.find((p: any) => p.id === poId);
    if (po) {
      setSubtotal(po.total_amount || 0);
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPO) {
        throw new Error("Please select a PO");
      }

      const po = approvedPOs.find((p: any) => p.id === selectedPO);
      const totalAmount = subtotal + cgst + sgst + igst;

      const { error } = await supabase
        .from("purchase_invoices")
        .insert([{
          invoice_number: generateInvoiceNumber(),
          vendor_invoice_number: vendorInvoiceNumber || null,
          po_id: selectedPO,
          grn_id: null,
          vendor_id: po?.vendor_id,
          invoice_date: invoiceDate,
          due_date: dueDate || null,
          subtotal,
          cgst_amount: cgst,
          sgst_amount: sgst,
          igst_amount: igst,
          total_amount: totalAmount,
          paid_amount: 0,
          balance_amount: totalAmount,
          payment_status: "pending",
          notes: notes || null,
          created_by: user?.id,
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-invoices"] });
      toast.success("Invoice created successfully");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to create invoice: " + error.message);
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedInvoice || paymentAmount <= 0) {
        throw new Error("Invalid payment");
      }

      // Create payment record
      const { error: paymentError } = await supabase
        .from("purchase_payments")
        .insert([{
          invoice_id: selectedInvoice.id,
          vendor_id: selectedInvoice.vendor_id,
          payment_date: paymentDate || format(new Date(), "yyyy-MM-dd"),
          amount: paymentAmount,
          payment_mode: paymentMode,
          reference_number: paymentRef || null,
          created_by: user?.id,
        }]);

      if (paymentError) throw paymentError;

      // Update invoice paid amount and balance amount
      const newPaidAmount = (selectedInvoice.paid_amount || 0) + paymentAmount;
      const totalAmount = selectedInvoice.total_amount || 0;
      const newBalanceAmount = Math.max(0, totalAmount - newPaidAmount);
      const newStatus: PaymentStatus = newBalanceAmount <= 0.001 ? "paid" : "partially_paid";

      const { error: updateError } = await supabase
        .from("purchase_invoices")
        .update({
          paid_amount: newPaidAmount,
          balance_amount: newBalanceAmount,
          payment_status: newStatus,
        })
        .eq("id", selectedInvoice.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-invoices"] });
      toast.success("Payment recorded successfully");
      setIsPaymentDialogOpen(false);
      setPaymentAmount(0);
      setPaymentMode("bank_transfer");
      setPaymentRef("");
    },
    onError: (error) => {
      toast.error("Failed to record payment: " + error.message);
    },
  });

  // Bulk Payment Mutation: allocates payment across selected vendor invoices (FIFO)
  const bulkPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!bulkVendorId || selectedInvoiceIds.length === 0 || bulkPaymentAmount <= 0) {
        throw new Error("Please select vendor, invoices, and enter a valid payment amount");
      }

      const targetInvoices = invoices
        .filter((inv) => selectedInvoiceIds.includes(inv.id))
        .sort((a, b) => new Date(a.invoice_date || a.created_at || 0).getTime() - new Date(b.invoice_date || b.created_at || 0).getTime());

      let remainingPayment = bulkPaymentAmount;

      for (const inv of targetInvoices) {
        if (remainingPayment <= 0) break;

        const currentPaid = inv.paid_amount || 0;
        const total = inv.total_amount || 0;
        const pendingDue = Math.max(0, total - currentPaid);
        if (pendingDue <= 0) continue;

        const allocated = Math.min(pendingDue, remainingPayment);
        remainingPayment -= allocated;

        // 1. Create payment record
        const { error: pError } = await supabase
          .from("purchase_payments")
          .insert([{
            invoice_id: inv.id,
            vendor_id: bulkVendorId,
            payment_date: bulkPaymentDate || format(new Date(), "yyyy-MM-dd"),
            amount: allocated,
            payment_mode: bulkPaymentMode,
            reference_number: bulkPaymentRef || null,
            notes: bulkNotes ? `Vendor Bulk Payment: ${bulkNotes}` : `Vendor Bulk Payment across ${selectedInvoiceIds.length} bills`,
            created_by: user?.id,
          }]);

        if (pError) throw pError;

        // 2. Update invoice paid & balance
        const updatedPaid = currentPaid + allocated;
        const updatedBalance = Math.max(0, total - updatedPaid);
        const updatedStatus: PaymentStatus = updatedBalance <= 0.001 ? "paid" : "partially_paid";

        const { error: uError } = await supabase
          .from("purchase_invoices")
          .update({
            paid_amount: updatedPaid,
            balance_amount: updatedBalance,
            payment_status: updatedStatus,
          })
          .eq("id", inv.id);

        if (uError) throw uError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-invoices"] });
      toast.success("Vendor consolidated payment recorded successfully");
      setIsBulkPaymentDialogOpen(false);
      setBulkVendorId("");
      setSelectedInvoiceIds([]);
      setBulkPaymentAmount(0);
      setBulkPaymentRef("");
      setBulkNotes("");
    },
    onError: (error) => {
      toast.error("Failed to record bulk payment: " + error.message);
    },
  });

  const resetForm = () => {
    setSelectedPO("");
    setVendorInvoiceNumber("");
    setInvoiceDate(format(new Date(), "yyyy-MM-dd"));
    setDueDate("");
    setSubtotal(0);
    setCgst(0);
    setSgst(0);
    setIgst(0);
    setNotes("");
    setIsDialogOpen(false);
  };

  const handleView = (invoice: PurchaseInvoice) => {
    setSelectedInvoice(invoice);
    setIsViewDialogOpen(true);
  };

  const handlePayment = (invoice: PurchaseInvoice) => {
    setSelectedInvoice(invoice);
    const balance = (invoice.total_amount || 0) - (invoice.paid_amount || 0);
    setPaymentAmount(balance > 0 ? balance : 0);
    setPaymentDate(format(new Date(), "yyyy-MM-dd"));
    setPaymentMode("bank_transfer");
    setPaymentRef("");
    setIsPaymentDialogOpen(true);
  };

  const handleOpenBulkPayment = (vendorId?: string) => {
    setBulkVendorDate(format(new Date(), "yyyy-MM-dd"));
    setBulkPaymentMode("bank_transfer");
    setBulkPaymentRef("");
    setBulkNotes("");
    if (vendorId) {
      handleBulkVendorChange(vendorId);
    } else {
      setBulkVendorId("");
      setSelectedInvoiceIds([]);
      setBulkPaymentAmount(0);
    }
    setIsBulkPaymentDialogOpen(true);
  };

  const handleBulkVendorChange = (vendorId: string) => {
    setBulkVendorId(vendorId);
    const vendorUnpaidInvoices = invoices.filter(
      (inv) => inv.vendor_id === vendorId && inv.payment_status !== "paid"
    );
    const ids = vendorUnpaidInvoices.map((inv) => inv.id);
    setSelectedInvoiceIds(ids);
    const totalDue = vendorUnpaidInvoices.reduce(
      (sum, inv) => sum + Math.max(0, (inv.total_amount || 0) - (inv.paid_amount || 0)),
      0
    );
    setBulkPaymentAmount(totalDue);
  };

  const handleToggleInvoice = (id: string) => {
    const nextIds = selectedInvoiceIds.includes(id)
      ? selectedInvoiceIds.filter((item) => item !== id)
      : [...selectedInvoiceIds, id];
    setSelectedInvoiceIds(nextIds);
    const totalDue = invoices
      .filter((inv) => nextIds.includes(inv.id))
      .reduce((sum, inv) => sum + Math.max(0, (inv.total_amount || 0) - (inv.paid_amount || 0)), 0);
    setBulkPaymentAmount(totalDue);
  };

  const handleSelectAllInvoices = (selectAll: boolean) => {
    if (!selectAll) {
      setSelectedInvoiceIds([]);
      setBulkPaymentAmount(0);
    } else {
      const vendorUnpaidInvoices = invoices.filter(
        (inv) => inv.vendor_id === bulkVendorId && inv.payment_status !== "paid"
      );
      const ids = vendorUnpaidInvoices.map((inv) => inv.id);
      setSelectedInvoiceIds(ids);
      const totalDue = vendorUnpaidInvoices.reduce(
        (sum, inv) => sum + Math.max(0, (inv.total_amount || 0) - (inv.paid_amount || 0)),
        0
      );
      setBulkPaymentAmount(totalDue);
    }
  };

  return (
    <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Purchase Invoices</h1>
            <p className="text-muted-foreground text-sm">
              Manage vendor invoices and payments
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => handleOpenBulkPayment()}>
              <Layers className="h-4 w-4 mr-2 text-primary" />
              Vendor Bulk Payment
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Invoice
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Purchase Invoice</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select PO *</Label>
                  <Select value={selectedPO} onValueChange={handlePOSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select approved PO" />
                    </SelectTrigger>
                    <SelectContent>
                      {approvedPOs.map((po: any) => (
                        <SelectItem key={po.id} value={po.id}>
                          {po.po_number} - {po.vendors?.vendor_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Vendor Invoice Number</Label>
                    <Input
                      value={vendorInvoiceNumber}
                      onChange={(e) => setVendorInvoiceNumber(e.target.value)}
                      placeholder="Vendor's invoice number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Invoice Date</Label>
                    <DateInput
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <DateInput
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Subtotal</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={subtotal}
                      onChange={(e) => setSubtotal(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CGST</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={cgst}
                      onChange={(e) => setCgst(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SGST</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={sgst}
                      onChange={(e) => setSgst(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IGST</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={igst}
                      onChange={(e) => setIgst(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="flex justify-end p-4 bg-muted rounded-md">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-2xl font-bold">₹{(subtotal + cgst + sgst + igst).toFixed(2)}</p>
                  </div>
                </div>

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
                    disabled={createMutation.isPending || !selectedPO}
                  >
                    Create Invoice
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <CardTitle className="text-base">Invoices List</CardTitle>
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
                    placeholder="Search invoices..."
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
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Vendor Invoice</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            No invoices found
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedData.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">
                              {invoice.invoice_number}
                            </TableCell>
                            <TableCell>{invoice.vendor_invoice_number || "-"}</TableCell>
                            <TableCell>{invoice.vendors?.vendor_name || "N/A"}</TableCell>
                            <TableCell>₹{(invoice.total_amount || 0).toFixed(2)}</TableCell>
                            <TableCell>₹{(invoice.paid_amount || 0).toFixed(2)}</TableCell>
                            <TableCell>₹{(invoice.balance_amount || 0).toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant={statusColors[invoice.payment_status]}>
                                {statusLabels[invoice.payment_status]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleView(invoice)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {invoice.payment_status !== "paid" && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handlePayment(invoice)}
                                      title="Record Payment for this Invoice"
                                    >
                                      <CreditCard className="h-4 w-4 text-emerald-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleOpenBulkPayment(invoice.vendor_id)}
                                      title={`Pay all bills for ${invoice.vendors?.vendor_name || "Vendor"}`}
                                    >
                                      <Layers className="h-4 w-4 text-blue-600" />
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
                  totalItems={filteredInvoices.length}
                  startIndex={startIndex}
                  endIndex={endIndex}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* View Invoice Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Invoice Details</DialogTitle>
            </DialogHeader>
            {selectedInvoice && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Invoice Number:</span>
                    <p className="font-medium">{selectedInvoice.invoice_number}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vendor Invoice:</span>
                    <p className="font-medium">{selectedInvoice.vendor_invoice_number || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vendor:</span>
                    <p className="font-medium">{selectedInvoice.vendors?.vendor_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">PO Number:</span>
                    <p className="font-medium">{selectedInvoice.purchase_orders?.po_number}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Invoice Date:</span>
                    <p className="font-medium">
                      {selectedInvoice.invoice_date
                        ? format(new Date(selectedInvoice.invoice_date), "dd/MM/yyyy")
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Due Date:</span>
                    <p className="font-medium">
                      {selectedInvoice.due_date
                        ? format(new Date(selectedInvoice.due_date), "dd/MM/yyyy")
                        : "-"}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{selectedInvoice.subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CGST:</span>
                    <span>₹{selectedInvoice.cgst_amount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST:</span>
                    <span>₹{selectedInvoice.sgst_amount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IGST:</span>
                    <span>₹{selectedInvoice.igst_amount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>₹{selectedInvoice.total_amount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Paid:</span>
                    <span>₹{selectedInvoice.paid_amount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-red-600 font-bold">
                    <span>Balance:</span>
                    <span>₹{selectedInvoice.balance_amount?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
            </DialogHeader>
            {selectedInvoice && (
              <div className="space-y-4">
                <div className="text-sm bg-muted/40 p-3 rounded-md space-y-1">
                  <p><span className="text-muted-foreground">Invoice:</span> <span className="font-semibold">{selectedInvoice.invoice_number}</span></p>
                  <p><span className="text-muted-foreground">Vendor:</span> <span className="font-semibold">{selectedInvoice.vendors?.vendor_name}</span></p>
                  <p><span className="text-muted-foreground">Pending Balance:</span> <span className="font-bold text-red-600">₹{(selectedInvoice.balance_amount !== null && selectedInvoice.balance_amount !== undefined ? selectedInvoice.balance_amount : ((selectedInvoice.total_amount || 0) - (selectedInvoice.paid_amount || 0))).toFixed(2)}</span></p>
                </div>

                <div className="space-y-2">
                  <Label>Payment Date *</Label>
                  <DateInput
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Amount *</Label>
                  <Input
                    type="number"
                    min="0.01"
                    max={selectedInvoice.balance_amount || selectedInvoice.total_amount || 0}
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Mode</Label>
                  <Select value={paymentMode} onValueChange={setPaymentMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer / NEFT / RTGS</SelectItem>
                      <SelectItem value="upi">UPI / GPay / PhonePe</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Reference Number</Label>
                  <Input
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="Transaction / Cheque / UTR reference"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => paymentMutation.mutate()}
                    disabled={paymentMutation.isPending || paymentAmount <= 0}
                  >
                    {paymentMutation.isPending ? "Recording..." : "Record Payment"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Vendor Bulk Payment Dialog */}
        <Dialog open={isBulkPaymentDialogOpen} onOpenChange={setIsBulkPaymentDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Vendor Consolidated / Bulk Payment
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Pay multiple bills for a vendor in a single transaction (e.g. monthly Nanda Gas bill, grocery settlement).
              </p>

              {/* Step 1: Select Vendor */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Select Vendor *</Label>
                <Select value={bulkVendorId} onValueChange={handleBulkVendorChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor to pay" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => {
                      const vInvoices = invoices.filter(
                        (inv) => inv.vendor_id === vendor.id && inv.payment_status !== "paid"
                      );
                      const due = vInvoices.reduce(
                        (sum, inv) => sum + Math.max(0, (inv.total_amount || 0) - (inv.paid_amount || 0)),
                        0
                      );
                      return (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.vendor_name} {vInvoices.length > 0 ? `(${vInvoices.length} unpaid • ₹${due.toFixed(2)} due)` : "(0 unpaid bills)"}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {bulkVendorId && (() => {
                const vendorUnpaidInvoices = invoices.filter(
                  (inv) => inv.vendor_id === bulkVendorId && inv.payment_status !== "paid"
                );
                const selectedDue = invoices
                  .filter((inv) => selectedInvoiceIds.includes(inv.id))
                  .reduce(
                    (sum, inv) => sum + Math.max(0, (inv.total_amount || 0) - (inv.paid_amount || 0)),
                    0
                  );

                if (vendorUnpaidInvoices.length === 0) {
                  return (
                    <div className="p-6 text-center border rounded-lg bg-muted/30">
                      <p className="font-medium text-green-600">Great! All invoices for this vendor are fully paid.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-semibold">
                        Unpaid Bills ({vendorUnpaidInvoices.length})
                      </Label>
                      <div className="flex gap-2 text-xs">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleSelectAllInvoices(true)}
                        >
                          Select All
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleSelectAllInvoices(false)}
                        >
                          Deselect All
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-md border overflow-x-auto max-h-60 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12 text-center">
                              <Checkbox
                                checked={
                                  selectedInvoiceIds.length === vendorUnpaidInvoices.length &&
                                  vendorUnpaidInvoices.length > 0
                                }
                                onCheckedChange={(checked) => handleSelectAllInvoices(!!checked)}
                              />
                            </TableHead>
                            <TableHead>Bill / Invoice #</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Paid</TableHead>
                            <TableHead className="text-right">Balance Due</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {vendorUnpaidInvoices.map((inv) => {
                            const invBalance = Math.max(0, (inv.total_amount || 0) - (inv.paid_amount || 0));
                            const isChecked = selectedInvoiceIds.includes(inv.id);
                            return (
                              <TableRow
                                key={inv.id}
                                className={`cursor-pointer ${isChecked ? "bg-muted/40" : ""}`}
                                onClick={() => handleToggleInvoice(inv.id)}
                              >
                                <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={() => handleToggleInvoice(inv.id)}
                                  />
                                </TableCell>
                                <TableCell className="font-medium">
                                  {inv.invoice_number}
                                  {inv.vendor_invoice_number && (
                                    <span className="text-xs text-muted-foreground block">
                                      Ref: {inv.vendor_invoice_number}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {inv.invoice_date ? format(new Date(inv.invoice_date), "dd/MM/yyyy") : "-"}
                                </TableCell>
                                <TableCell className="text-right">₹{(inv.total_amount || 0).toFixed(2)}</TableCell>
                                <TableCell className="text-right text-green-600">₹{(inv.paid_amount || 0).toFixed(2)}</TableCell>
                                <TableCell className="text-right font-semibold text-red-600">₹{invBalance.toFixed(2)}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="bg-muted/40 p-3 rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm gap-2">
                      <div>
                        Selected: <span className="font-bold">{selectedInvoiceIds.length}</span> of {vendorUnpaidInvoices.length} bills
                      </div>
                      <div className="font-bold">
                        Total Selected Balance: <span className="text-red-600">₹{selectedDue.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Step 2: Payment Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                      <div className="space-y-2">
                        <Label>Payment Date *</Label>
                        <DateInput
                          value={bulkPaymentDate}
                          onChange={(e) => setBulkVendorDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Payment Amount (₹) *</Label>
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={bulkPaymentAmount}
                          onChange={(e) => setBulkPaymentAmount(parseFloat(e.target.value) || 0)}
                        />
                        <span className="text-[11px] text-muted-foreground block">
                          Payment will be allocated across selected bills from oldest first.
                        </span>
                      </div>
                      <div className="space-y-2">
                        <Label>Payment Mode</Label>
                        <Select value={bulkPaymentMode} onValueChange={setBulkPaymentMode}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bank_transfer">Bank Transfer / NEFT / RTGS</SelectItem>
                            <SelectItem value="upi">UPI / GPay / PhonePe</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Reference Number</Label>
                        <Input
                          value={bulkPaymentRef}
                          onChange={(e) => setBulkPaymentRef(e.target.value)}
                          placeholder="UTR / Cheque # / UPI Ref"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Notes / Description</Label>
                      <Textarea
                        value={bulkNotes}
                        onChange={(e) => setBulkNotes(e.target.value)}
                        placeholder="e.g. Full settlement of monthly gas bills for Sept 2026..."
                        rows={2}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsBulkPaymentDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={() => bulkPaymentMutation.mutate()}
                        disabled={
                          bulkPaymentMutation.isPending ||
                          selectedInvoiceIds.length === 0 ||
                          bulkPaymentAmount <= 0
                        }
                      >
                        {bulkPaymentMutation.isPending
                          ? "Processing..."
                          : `Record Payment (₹${bulkPaymentAmount.toFixed(2)})`}
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
}
