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
import { Plus, Search, Eye, CreditCard } from "lucide-react";
import { toast } from "sonner";
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
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
  const [selectedPO, setSelectedPO] = useState("");
  const [selectedGRN, setSelectedGRN] = useState("");
  const [vendorInvoiceNumber, setVendorInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dueDate, setDueDate] = useState("");
  const [subtotal, setSubtotal] = useState(0);
  const [cgst, setCgst] = useState(0);
  const [sgst, setSgst] = useState(0);
  const [igst, setIgst] = useState(0);
  const [notes, setNotes] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("bank_transfer");
  const [paymentRef, setPaymentRef] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: closedPOs = [] } = useQuery({
    queryKey: ["closed-pos-for-invoice"],
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
        .eq("status", "closed")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: grnsByPO = [] } = useQuery({
    queryKey: ["grns-by-po", selectedPO],
    queryFn: async () => {
      if (!selectedPO) return [];
      const { data, error } = await supabase
        .from("goods_receipt_notes")
        .select("id, grn_number")
        .eq("po_id", selectedPO);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPO,
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
    setSelectedGRN("");
    const po = closedPOs.find((p: any) => p.id === poId);
    if (po) {
      setSubtotal(po.total_amount || 0);
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPO) {
        throw new Error("Please select a PO");
      }

      const po = closedPOs.find((p: any) => p.id === selectedPO);
      const totalAmount = subtotal + cgst + sgst + igst;

      const { error } = await supabase
        .from("purchase_invoices")
        .insert([{
          invoice_number: generateInvoiceNumber(),
          vendor_invoice_number: vendorInvoiceNumber || null,
          po_id: selectedPO,
          grn_id: selectedGRN || null,
          vendor_id: po?.vendor_id,
          invoice_date: invoiceDate,
          due_date: dueDate || null,
          subtotal,
          cgst_amount: cgst,
          sgst_amount: sgst,
          igst_amount: igst,
          total_amount: totalAmount,
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
          payment_date: format(new Date(), "yyyy-MM-dd"),
          amount: paymentAmount,
          payment_mode: paymentMode,
          reference_number: paymentRef || null,
          created_by: user?.id,
        }]);

      if (paymentError) throw paymentError;

      // Update invoice paid amount
      const newPaidAmount = (selectedInvoice.paid_amount || 0) + paymentAmount;
      const totalAmount = selectedInvoice.total_amount || 0;
      const newStatus: PaymentStatus = newPaidAmount >= totalAmount ? "paid" : "partially_paid";

      const { error: updateError } = await supabase
        .from("purchase_invoices")
        .update({
          paid_amount: newPaidAmount,
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

  const resetForm = () => {
    setSelectedPO("");
    setSelectedGRN("");
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
    setPaymentAmount((invoice.total_amount || 0) - (invoice.paid_amount || 0));
    setIsPaymentDialogOpen(true);
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Select PO *</Label>
                    <Select value={selectedPO} onValueChange={handlePOSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select PO" />
                      </SelectTrigger>
                      <SelectContent>
                        {closedPOs.map((po: any) => (
                          <SelectItem key={po.id} value={po.id}>
                            {po.po_number} - {po.vendors?.vendor_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Link GRN (Optional)</Label>
                    <Select value={selectedGRN} onValueChange={setSelectedGRN}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select GRN" />
                      </SelectTrigger>
                      <SelectContent>
                        {grnsByPO.map((grn: any) => (
                          <SelectItem key={grn.id} value={grn.id}>
                            {grn.grn_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                    <Input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
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
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handlePayment(invoice)}
                                  >
                                    <CreditCard className="h-4 w-4" />
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
                <div className="text-sm">
                  <p>Invoice: {selectedInvoice.invoice_number}</p>
                  <p>Balance: ₹{selectedInvoice.balance_amount?.toFixed(2)}</p>
                </div>

                <div className="space-y-2">
                  <Label>Payment Amount *</Label>
                  <Input
                    type="number"
                    min="0.01"
                    max={selectedInvoice.balance_amount || 0}
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
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Reference Number</Label>
                  <Input
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="Transaction/Cheque reference"
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
                    Record Payment
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
  );
}
