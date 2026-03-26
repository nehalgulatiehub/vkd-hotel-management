import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminViewPaymentDialog } from "@/components/admin/AdminViewPaymentDialog";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow } from "@/components/admin/AdminPageShell";

interface SafariTransporterSummary {
  safari_name: string; total_amount: number; total_paid: number; due_amount: number; booking_ids: string[]; latest_date: string | null;
}

export default function AdminSafariTransporterDue() {
  const [summaries, setSummaries] = useState<SafariTransporterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [transporterFilter, setTransporterFilter] = useState("");
  const [safariNames, setSafariNames] = useState<string[]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("safari_bookings").select("id, booking_id, safari_name, total_amount, paid_amount, safari_date, created_at").order("safari_name");
      if (error) throw error;
      const grouped: Record<string, SafariTransporterSummary> = {};
      (data || []).forEach((sb: any) => {
        const name = sb.safari_name || "Unknown";
        if (!grouped[name]) grouped[name] = { safari_name: name, total_amount: 0, total_paid: 0, due_amount: 0, booking_ids: [], latest_date: null };
        grouped[name].total_amount += sb.total_amount || 0;
        grouped[name].total_paid += sb.paid_amount || 0;
        if (sb.booking_id) grouped[name].booking_ids.push(sb.booking_id);
        const date = sb.safari_date || sb.created_at;
        if (date && (!grouped[name].latest_date || date > grouped[name].latest_date)) grouped[name].latest_date = date;
      });
      Object.values(grouped).forEach(g => { g.due_amount = g.total_amount - g.total_paid; });
      const result = Object.values(grouped);
      setSummaries(result);
      setSafariNames([...new Set(result.map(s => s.safari_name))].sort());
    } catch { toast.error("Failed to load safari transporter data"); }
    finally { setLoading(false); }
  };

  const filteredSummaries = summaries.filter(s => !transporterFilter || s.safari_name === transporterFilter);

  const filterSection = (
    <div className="flex flex-wrap items-center gap-4 text-xs">
      <div className="flex items-center gap-1"><span>Transporter :</span>
        <select value={transporterFilter} onChange={e => setTransporterFilter(e.target.value)} className="border px-1 py-0.5 text-xs min-w-[200px]">
          <option value="">--Select--</option>{safariNames.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
      </div>
      <button className="border px-3 py-0.5 text-xs bg-gray-100 hover:bg-gray-200">Search</button>
    </div>
  );

  return (
    <>
      <AdminPageShell title="View Safari Transporter Payment" actions={[{ label: "View All Records", onClick: () => setTransporterFilter("") }]} filterSection={filterSection}>
        {loading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> : (
          <>
            <ThemedTable>
              <ThemedTHead><ThemedTH>S.No</ThemedTH><ThemedTH>Date</ThemedTH><ThemedTH>Transporter</ThemedTH><ThemedTH>Total Amount</ThemedTH><ThemedTH>Paid Amount</ThemedTH><ThemedTH>Due Amount</ThemedTH></ThemedTHead>
              <tbody>
                {filteredSummaries.length === 0 ? <ThemedEmptyRow colSpan={6} message="No safari transporter data found" /> : filteredSummaries.map((summary, idx) => (
                  <ThemedTR key={summary.safari_name} index={idx}>
                    <ThemedTD>{idx + 1}</ThemedTD>
                    <ThemedTD>{summary.latest_date ? new Date(summary.latest_date).toLocaleDateString("en-GB") : "-"}</ThemedTD>
                    <ThemedTD>{summary.safari_name}</ThemedTD>
                    <ThemedTD>Rs {summary.total_amount.toLocaleString("en-IN")}</ThemedTD>
                    <ThemedTD>Rs {summary.total_paid.toLocaleString("en-IN")}</ThemedTD>
                    <ThemedTD className="font-medium">Rs {summary.due_amount.toLocaleString("en-IN")}</ThemedTD>
                  </ThemedTR>
                ))}
              </tbody>
            </ThemedTable>
            {filteredSummaries.length > 0 && (
              <div className="flex items-center justify-between p-3 border-t border-gray-300 text-xs font-medium">
                Total: Rs. {filteredSummaries.reduce((s, r) => s + r.total_amount, 0).toLocaleString("en-IN")}/-
                &nbsp;|&nbsp; Paid: Rs. {filteredSummaries.reduce((s, r) => s + r.total_paid, 0).toLocaleString("en-IN")}/-
                &nbsp;|&nbsp; Due: Rs. {filteredSummaries.reduce((s, r) => s + r.due_amount, 0).toLocaleString("en-IN")}/-
              </div>
            )}
          </>
        )}
      </AdminPageShell>
      <AdminViewPaymentDialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog} bookingId={selectedBookingId} />
    </>
  );
}
