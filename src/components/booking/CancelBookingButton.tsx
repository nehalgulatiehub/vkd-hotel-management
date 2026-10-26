import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { CSSProperties } from "react";
import type { Database } from "@/integrations/supabase/types";

type Booking = Database["public"]["Tables"]["bookings"]["Row"];
interface Props {
  booking: { id: string; status?: string | null; created_by?: string | null } | null;
  onCancelled: () => void | Promise<void>;
  style?: CSSProperties;
}

export function CancelBookingButton({ booking, onCancelled, style }: Props) {
  const { user, isAdmin, isAccount, hasRole } = useAuthContext();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Booking | null>(null);
  const [charges, setCharges] = useState("0");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const allowed = !!user && !!booking && booking.status !== "cancelled" &&
    (isAdmin() || isAccount() || hasRole("manager") || booking.created_by === user.id);
  if (!allowed) return null;

  const show = async () => {
    setOpen(true); setCurrent(null); setLoading(true); setError(""); setReason(""); setCharges("0");
    const { data, error } = await supabase.from("bookings").select("*").eq("id", booking.id).single();
    setLoading(false);
    if (error) { setError("Could not load the booking. Please try again."); return; }
    if (data.status === "cancelled") { setError("This booking is already cancelled."); return; }
    setCurrent(data);
  };

  const submit = async () => {
    if (!current || inFlight.current) return;
    const charge = Number(charges);
    if (!charges.trim() || !Number.isFinite(charge) || charge < 0) {
      setError("Enter a valid non-negative cancellation charge."); return;
    }
    inFlight.current = true; setSaving(true); setError("");
    try {
      const { error } = await supabase.rpc("cancel_booking", {
        p_booking_id: current.id, p_charges: charge, p_reason: reason.trim(),
      });
      if (error) { setError(error.message); return; }
      toast.success("Booking cancelled successfully"); setOpen(false);
      await onCancelled();
    } finally { inFlight.current = false; setSaving(false); }
  };

  const refund = Math.max(0, (current?.paid_amount ?? 0) - (Number(charges) || 0));
  return <>
    <button type="button" style={{ ...style, color: "#b91c1c", cursor: "pointer" }} onClick={show}>Cancel</button>
    <Dialog open={open} onOpenChange={next => { if (!saving) setOpen(next); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Cancel booking</DialogTitle><DialogDescription>This cancels the entire booking and all its attached services. Payment history is kept. Any refund is processed separately.</DialogDescription></DialogHeader>
        {loading && <p>Loading booking…</p>}
        {current && <div className="space-y-3 text-sm">
          <p><strong>Booking:</strong> {current.booking_number}<br /><strong>Customer:</strong> {current.customer_name || "—"}</p>
          <p><strong>Booking price:</strong> ₹{current.total_amount.toLocaleString("en-IN")}<br /><strong>Received:</strong> ₹{(current.paid_amount ?? 0).toLocaleString("en-IN")}</p>
          <Label htmlFor={`cancel-charge-${booking.id}`}>Cancellation charge</Label>
          <Input id={`cancel-charge-${booking.id}`} type="number" min="0" step="0.01" value={charges} onChange={event => setCharges(event.target.value)} disabled={saving} />
          <Label htmlFor={`cancel-reason-${booking.id}`}>Reason</Label>
          <Textarea id={`cancel-reason-${booking.id}`} value={reason} onChange={event => setReason(event.target.value)} disabled={saving} />
          <p><strong>Refund amount:</strong> ₹{refund.toLocaleString("en-IN")}</p>
        </div>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter><Button variant="outline" disabled={saving} onClick={() => setOpen(false)}>Go back</Button><Button variant="destructive" disabled={saving || loading || !current} onClick={submit}>{saving ? "Cancelling…" : "Confirm cancellation"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
