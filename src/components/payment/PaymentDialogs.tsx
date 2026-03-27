import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { useState } from "react";

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
  isSubmittingPayment: boolean;
  onSubmitPayment: () => void;
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
  isSubmittingPayment,
  onSubmitPayment,
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
      <Dialog open={showViewPaymentDialog} onOpenChange={setShowViewPaymentDialog}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <div className="bg-[#b44a50] text-white px-4 py-2.5 flex justify-between items-center">
            <span className="text-sm font-medium">View Payment</span>
          </div>
          <div className="p-4 space-y-4">
            {/* Summary Table */}
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr style={{ backgroundColor: "#c47a7e" }}>
                  <th className="border border-[#ddd] px-3 py-2 text-left font-semibold"></th>
                  <th className="border border-[#ddd] px-3 py-2 text-left font-semibold">Total Payment</th>
                  <th className="border border-[#ddd] px-3 py-2 text-left font-semibold">Total Received Payment</th>
                  <th className="border border-[#ddd] px-3 py-2 text-left font-semibold">Total Due Payment</th>
                  <th className="border border-[#ddd] px-3 py-2 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ backgroundColor: "#f6f0f0" }}>
                  <td className="border border-[#ddd] px-3 py-2 font-medium underline">Booking</td>
                  <td className="border border-[#ddd] px-3 py-2">Rs. {(selectedBooking?.total_amount || 0).toLocaleString('en-IN')}/-</td>
                  <td className="border border-[#ddd] px-3 py-2">Rs. {(selectedBooking?.paid_amount || 0).toLocaleString('en-IN')}/-</td>
                  <td className="border border-[#ddd] px-3 py-2">Rs. {(selectedBooking?.due_amount || 0).toLocaleString('en-IN')}/-</td>
                  <td className="border border-[#ddd] px-3 py-2">
                    <Button 
                      variant="link" 
                      className="h-auto p-0 text-xs text-[#dc2626] hover:text-[#dc2626]/80 underline"
                    >
                      View Details
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
            
            {/* Payment History Label */}
            <div className="text-sm font-semibold">Booking</div>
            
            {/* Payment History Table */}
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr style={{ backgroundColor: "#c47a7e" }}>
                  <th className="border border-[#ddd] px-2 py-2 text-left font-semibold">S.No.</th>
                  <th className="border border-[#ddd] px-2 py-2 text-left font-semibold">Payment</th>
                  <th className="border border-[#ddd] px-2 py-2 text-left font-semibold">Date</th>
                  <th className="border border-[#ddd] px-2 py-2 text-left font-semibold">Mode</th>
                  <th className="border border-[#ddd] px-2 py-2 text-left font-semibold">Payment Detail</th>
                  <th className="border border-[#ddd] px-2 py-2 text-left font-semibold">Place</th>
                  <th className="border border-[#ddd] px-2 py-2 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookingPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="border border-[#ddd] px-2 py-4 text-center text-muted-foreground">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  bookingPayments.map((payment, idx) => (
                    <tr key={payment.id} style={{ backgroundColor: "#f6f0f0" }}>
                      <td className="border border-[#ddd] px-2 py-2">{idx + 1}</td>
                      <td className="border border-[#ddd] px-2 py-2">Rs. {payment.amount.toLocaleString('en-IN')}/-</td>
                      <td className="border border-[#ddd] px-2 py-2">{format(new Date(payment.payment_date), "dd/MM/yyyy")}</td>
                      <td className="border border-[#ddd] px-2 py-2 capitalize">{payment.payment_mode?.replace(/_/g, " ") || "-"}</td>
                      <td className="border border-[#ddd] px-2 py-2">{payment.reference_number || "-"}</td>
                      <td className="border border-[#ddd] px-2 py-2">{(payment as any).cities?.name || "-"}</td>
                      <td className="border border-[#ddd] px-2 py-2">
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="capitalize">{payment.approval_status || "Pending"}</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditClick(payment)}
                              className="text-[#dc2626] hover:text-[#dc2626]/80 underline text-xs"
                            >
                              Edit
                            </button>
                            <span className="text-gray-400">|</span>
                            <button
                              onClick={() => handleDeleteClick(payment.id)}
                              className="text-[#dc2626] hover:text-[#dc2626]/80 underline text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-[#b44a50] text-white px-4 py-2 text-xs">
            Booking: {selectedBooking?.booking_number} | Customer: {selectedBooking?.customer_name}
          </div>
        </DialogContent>
      </Dialog>

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
          <div className="space-y-4">
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
