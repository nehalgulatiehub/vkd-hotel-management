import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

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
}: PaymentDialogsProps) {
  return (
    <>
      <Dialog open={showViewPaymentDialog} onOpenChange={setShowViewPaymentDialog}>
        <DialogContent className="max-w-2xl p-0">
          <div className="bg-[#1e6e99] text-white px-4 py-2 text-sm font-medium">
            View Payment - {selectedBooking?.booking_number}
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-semibold">Total Amount:</span>
                <div className="text-lg">₹{(selectedBooking?.total_amount || 0).toLocaleString()}</div>
              </div>
              <div>
                <span className="font-semibold">Paid Amount:</span>
                <div className="text-lg text-green-600">₹{(selectedBooking?.paid_amount || 0).toLocaleString()}</div>
              </div>
              <div>
                <span className="font-semibold">Due Amount:</span>
                <div className="text-lg text-destructive">₹{(selectedBooking?.due_amount || 0).toLocaleString()}</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Payment History</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookingPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">No payments found</TableCell>
                    </TableRow>
                  ) : (
                    bookingPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{format(new Date(payment.payment_date), "dd/MM/yyyy")}</TableCell>
                        <TableCell>₹{payment.amount.toLocaleString()}</TableCell>
                        <TableCell className="capitalize">{payment.payment_mode?.replace(/_/g, " ")}</TableCell>
                        <TableCell>{payment.reference_number || "-"}</TableCell>
                        <TableCell className="capitalize">{payment.approval_status}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
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
