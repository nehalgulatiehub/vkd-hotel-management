import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { useState } from "react";
import { UserViewPaymentDialog } from "@/components/booking/UserViewPaymentDialog";

interface PaymentDialogsProps {
  showViewPaymentDialog: boolean;
  setShowViewPaymentDialog: (show: boolean) => void;
  showPaymentDialog: boolean;
  setShowPaymentDialog: (show: boolean) => void;
  selectedBooking: any;
  bookingPayments: any[];
  paymentAmount: string;
  setPaymentAmount: (amount: string) => void;
  paymentMode: string;
  setPaymentMode: (mode: string) => void;
  paymentReference: string;
  setPaymentReference: (ref: string) => void;
  paymentCityId?: string;
  setPaymentCityId?: (id: string) => void;
  cities?: { id: string; name: string }[];
  isSubmittingPayment: boolean;
  onSubmitPayment: () => void;
  serviceTotals?: { label: string; total: number; paid: number; due: number } | null;
  onEditPayment?: (payment: any) => void;
  onDeletePayment?: (paymentId: string) => void;
}

export function PaymentDialogs({
  showViewPaymentDialog,
  setShowViewPaymentDialog,
  showPaymentDialog,
  setShowPaymentDialog,
  selectedBooking,
  bookingPayments,
  paymentAmount,
  setPaymentAmount,
  paymentMode,
  setPaymentMode,
  paymentReference,
  setPaymentReference,
  paymentCityId,
  setPaymentCityId,
  cities = [],
  isSubmittingPayment,
  onSubmitPayment,
  serviceTotals,
  onEditPayment,
  onDeletePayment,
}: PaymentDialogsProps) {
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editMode, setEditMode] = useState("");
  const [editReference, setEditReference] = useState("");
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleEditClick = (payment: any) => {
    setEditingPayment(payment);
    setEditAmount(payment.amount?.toString() || "");
    setEditMode(payment.payment_mode || "");
    setEditReference(payment.reference_number || "");
    setShowEditDialog(true);
  };

  const handleEditSave = () => {
    if (onEditPayment && editingPayment) {
      onEditPayment({
        ...editingPayment,
        amount: parseFloat(editAmount),
        payment_mode: editMode,
        reference_number: editReference,
      });
    }
    setShowEditDialog(false);
    setEditingPayment(null);
  };

  const handleDeleteClick = (paymentId: string) => {
    if (window.confirm("Are you sure you want to delete this payment?")) {
      onDeletePayment?.(paymentId);
    }
  };

  return (
    <>
      <UserViewPaymentDialog
        open={showViewPaymentDialog}
        onOpenChange={setShowViewPaymentDialog}
        bookingId={selectedBooking?.id || null}
      />

      {/* Edit Payment Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount *</Label>
              <Input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} placeholder="Enter amount" />
            </div>
            <div>
              <Label>Payment Mode *</Label>
              <Select value={editMode} onValueChange={setEditMode}>
                <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reference Number</Label>
              <Input value={editReference} onChange={(e) => setEditReference(e.target.value)} placeholder="Transaction/Cheque number" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
              <Button onClick={handleEditSave}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Payment - {selectedBooking?.booking_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <Label>Booking Number</Label>
              <Input value={selectedBooking?.booking_number || ""} disabled />
            </div>
            <div>
              <Label>Customer Name</Label>
              <Input value={selectedBooking?.customer_name || ""} disabled />
            </div>
            {serviceTotals && (
              <div className="space-y-2">
                <div>
                  <Label>{serviceTotals.label} Total Amount</Label>
                  <Input value={`Rs. ${serviceTotals.total.toLocaleString("en-IN")}/-`} disabled />
                </div>
                <div>
                  <Label>{serviceTotals.label} Received Amount</Label>
                  <Input value={`Rs. ${serviceTotals.paid.toLocaleString("en-IN")}/-`} disabled />
                </div>
                <div>
                  <Label>{serviceTotals.label} Due Amount</Label>
                  <Input value={`Rs. ${serviceTotals.due.toLocaleString("en-IN")}/-`} disabled className="text-destructive font-semibold" />
                </div>
              </div>
            )}
            <div>
              <Label>Amount *</Label>
              <Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="Enter amount" />
            </div>
            <div>
              <Label>Payment Mode *</Label>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reference Number</Label>
              <Input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Transaction/Cheque number" />
            </div>
            <div>
              <Label>Place (City)</Label>
              <Select value={paymentCityId || ""} onValueChange={(v) => setPaymentCityId?.(v)}>
                <SelectTrigger><SelectValue placeholder="Select city where payment was collected" /></SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {serviceTotals && (
              <div>
                <Label>Payment Type</Label>
                <Input value={`${serviceTotals.label} Payment`} disabled />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
              <Button onClick={onSubmitPayment} disabled={isSubmittingPayment}>{isSubmittingPayment ? "Adding..." : "Add Payment"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
