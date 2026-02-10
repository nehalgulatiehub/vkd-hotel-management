import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { AdminViewPaymentDialog } from "@/components/admin/AdminViewPaymentDialog";

interface SafariTransporterSummary {
  safari_name: string;
  total_amount: number;
  total_paid: number;
  due_amount: number;
  booking_ids: string[];
  latest_date: string | null;
}

export default function AdminSafariTransporterDue() {
  const [summaries, setSummaries] = useState<SafariTransporterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [transporterFilter, setTransporterFilter] = useState("");
  const [safariNames, setSafariNames] = useState<string[]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("safari_bookings")
        .select("id, booking_id, safari_name, total_amount, paid_amount, safari_date, created_at")
        .order("safari_name");

      if (error) throw error;

      // Group by safari_name
      const grouped: Record<string, SafariTransporterSummary> = {};
      (data || []).forEach((sb: any) => {
        const name = sb.safari_name || "Unknown";
        if (!grouped[name]) {
          grouped[name] = {
            safari_name: name,
            total_amount: 0,
            total_paid: 0,
            due_amount: 0,
            booking_ids: [],
            latest_date: null,
          };
        }
        grouped[name].total_amount += sb.total_amount || 0;
        grouped[name].total_paid += sb.paid_amount || 0;
        if (sb.booking_id) grouped[name].booking_ids.push(sb.booking_id);
        const date = sb.safari_date || sb.created_at;
        if (date && (!grouped[name].latest_date || date > grouped[name].latest_date)) {
          grouped[name].latest_date = date;
        }
      });

      Object.values(grouped).forEach(g => {
        g.due_amount = g.total_amount - g.total_paid;
      });

      const result = Object.values(grouped);
      setSummaries(result);
      setSafariNames([...new Set(result.map(s => s.safari_name))].sort());
    } catch (error) {
      console.error(error);
      toast.error("Failed to load safari transporter data");
    } finally {
      setLoading(false);
    }
  };

  const filteredSummaries = summaries.filter(s =>
    !transporterFilter || s.safari_name === transporterFilter
  );

  const handleViewAll = () => setTransporterFilter("");

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader title="View Safari Transporter Payment" />
      <main className="p-3 space-y-3">
        {/* Search Section */}
        <div className="border border-[#c99] rounded">
          <div className="flex items-center justify-between px-3 py-1.5" style={{ backgroundColor: "#1e6e99" }}>
            <span className="text-white text-xs font-bold">Search</span>
            <button onClick={handleViewAll} className="text-white text-xs underline hover:no-underline">View All Records</button>
          </div>
          <div className="p-3" style={{ fontSize: "11px" }}>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1">
                <span>Transporter :</span>
                <select
                  value={transporterFilter}
                  onChange={e => setTransporterFilter(e.target.value)}
                  className="border rounded px-1 py-0.5 text-xs min-w-[200px]"
                >
                  <option value="">--Select--</option>
                  {safariNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => {}}
                className="border rounded px-4 py-1 text-xs font-bold bg-background hover:bg-muted"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : (
          <div className="border border-[#c99] rounded overflow-x-auto">
            <table className="w-full border-collapse" style={{ fontSize: "11px" }}>
              <thead>
                <tr style={{ backgroundColor: "#D4A59A" }}>
                  <th className="border border-[#c99] px-2 py-1.5 text-left font-bold text-xs">S.No.</th>
                  <th className="border border-[#c99] px-2 py-1.5 text-left font-bold text-xs">Date</th>
                  <th className="border border-[#c99] px-2 py-1.5 text-left font-bold text-xs">Transporter</th>
                  <th className="border border-[#c99] px-2 py-1.5 text-left font-bold text-xs">Total Amount</th>
                  <th className="border border-[#c99] px-2 py-1.5 text-left font-bold text-xs">Paid Amount</th>
                  <th className="border border-[#c99] px-2 py-1.5 text-left font-bold text-xs">Due Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground border border-[#c99]">
                      No safari transporter data found
                    </td>
                  </tr>
                ) : (
                  filteredSummaries.map((summary, idx) => (
                    <tr key={summary.safari_name} style={{ backgroundColor: "#F5E6E0" }}>
                      <td className="border border-[#c99] px-2 py-2 text-xs">{idx + 1}</td>
                      <td className="border border-[#c99] px-2 py-2 text-xs">
                        {summary.latest_date ? new Date(summary.latest_date).toLocaleDateString("en-GB") : "-"}
                      </td>
                      <td className="border border-[#c99] px-2 py-2 text-xs font-medium">{summary.safari_name}</td>
                      <td className="border border-[#c99] px-2 py-2 text-xs">
                        Rs {summary.total_amount.toLocaleString("en-IN")}
                      </td>
                      <td className="border border-[#c99] px-2 py-2 text-xs">
                        Rs {summary.total_paid.toLocaleString("en-IN")}
                      </td>
                      <td className="border border-[#c99] px-2 py-2 text-xs font-medium">
                        Rs {summary.due_amount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {filteredSummaries.length > 0 && (
              <div className="flex items-center justify-between p-3 border-t border-[#c99]">
                <div className="text-xs font-medium">
                  Total: Rs. {filteredSummaries.reduce((s, r) => s + r.total_amount, 0).toLocaleString("en-IN")}/-
                  &nbsp;|&nbsp; Paid: Rs. {filteredSummaries.reduce((s, r) => s + r.total_paid, 0).toLocaleString("en-IN")}/-
                  &nbsp;|&nbsp; Due: Rs. {filteredSummaries.reduce((s, r) => s + r.due_amount, 0).toLocaleString("en-IN")}/-
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <AdminViewPaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        bookingId={selectedBookingId}
      />
    </div>
  );
}
