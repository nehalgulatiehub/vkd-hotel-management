import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

interface TransporterSummary {
  transporter_id: string;
  transporter_name: string;
  total_transport_amount: number;
  total_paid: number;
  outstanding: number;
}

export default function ViewManaliDelhiDue() {
  const navigate = useNavigate();
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [summaries, setSummaries] = useState<TransporterSummary[]>([]);
  const [transporters, setTransporters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransporter, setSelectedTransporter] = useState("");

  const canManage = isAdmin() || isAccount();

  useEffect(() => {
    if (!authLoading && canManage) {
      fetchTransporters();
      fetchData();
    }
  }, [authLoading, canManage]);

  const fetchTransporters = async () => {
    const { data } = await supabase.from("transporters").select("id, name").order("name");
    setTransporters(data || []);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: volvoData } = await supabase
        .from("volvo_bookings")
        .select("id, booking_id, total_amount, paid_amount, due_amount, notes")
        .eq("route", "Manali-Delhi");

      const { data: payments } = await supabase
        .from("payments")
        .select("transporter_id, amount, approval_status")
        .eq("payment_type", "manali_delhi")
        .not("transporter_id", "is", null);

      const totalVolvoAmount = (volvoData || []).reduce((sum, v) => sum + (v.total_amount || 0), 0);

      const transporterMap: Record<string, { paid: number }> = {};
      (payments || []).forEach(p => {
        if (!p.transporter_id) return;
        if (!transporterMap[p.transporter_id]) {
          transporterMap[p.transporter_id] = { paid: 0 };
        }
        if (p.approval_status === "approved" || p.approval_status === "Approved") {
          transporterMap[p.transporter_id].paid += p.amount || 0;
        }
      });

      const { data: transportersList } = await supabase.from("transporters").select("id, name");
      const tMap = new Map((transportersList || []).map(t => [t.id, t.name]));

      const results: TransporterSummary[] = [];
      for (const [tId, info] of Object.entries(transporterMap)) {
        results.push({
          transporter_id: tId,
          transporter_name: tMap.get(tId) || "Unknown",
          total_transport_amount: totalVolvoAmount,
          total_paid: info.paid,
          outstanding: info.paid - totalVolvoAmount,
        });
      }

      if (results.length === 0 && totalVolvoAmount > 0) {
        const totalPaid = (volvoData || []).reduce((sum, v) => sum + (v.paid_amount || 0), 0);
        results.push({
          transporter_id: "aggregate",
          transporter_name: "All MD Transporters",
          total_transport_amount: totalVolvoAmount,
          total_paid: totalPaid,
          outstanding: totalPaid - totalVolvoAmount,
        });
      }

      setSummaries(results);
    } catch (error) {
      console.error("Error fetching MD due data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSummaries = summaries.filter(s => {
    if (!selectedTransporter) return true;
    return s.transporter_id === selectedTransporter;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen">
        <AdminHeader title="Due MD Transporter Payment" />
        <main className="p-4">
          <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
        </main>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="min-h-screen">
        <AdminHeader title="Access Denied" />
        <main className="p-4">
          <Card><CardContent className="py-8 text-center text-muted-foreground">Access denied.</CardContent></Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader title="Due MD Transporter Payment" />
      <main className="p-4">
        {/* Blue Header Bar */}
        <div className="flex justify-between items-center px-4 py-2 mb-3" style={{ backgroundColor: "#1e6e99" }}>
          <span className="text-white font-semibold text-sm">View MD Transporter Payment</span>
          <Button variant="link" className="text-white p-0 h-auto text-sm hover:text-white/80" onClick={() => setSelectedTransporter("")}>
            View All Records
          </Button>
        </div>

        {/* Filter Section */}
        <div className="mb-3 border border-border">
              <div className="bg-[#8B1538] text-white px-3 py-1.5 text-xs font-semibold">Search</div>
              <div className="bg-muted/50">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-2 py-1.5">
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground">Transporter :</span>
              <select
                value={selectedTransporter}
                onChange={(e) => setSelectedTransporter(e.target.value)}
                className="h-5 text-[11px] border border-input bg-background px-1 min-w-[200px] rounded-sm"
              >
                <option value="">--Select--</option>
                {transporters.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <button className="h-6 px-4 text-[11px] bg-primary text-primary-foreground border border-primary/80 hover:bg-primary/90 rounded-sm ml-auto">
              Search
            </button>
          </div>
        </div>
              </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: "#D4A59A" }}>
                      <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">S.No.</th>
                      <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Date</th>
                      <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Outstanding</th>
                      <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Total Transport Amount</th>
                      <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Transporter</th>
                      <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold"></th>
                      <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold"></th>
                      <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Action</th>
                      <th className="border border-[#c99] px-3 py-2 text-center text-xs font-semibold">
                        <input type="checkbox" className="w-3 h-3" disabled />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSummaries.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-4 text-xs text-muted-foreground">
                          No records found.
                        </td>
                      </tr>
                    ) : (
                      filteredSummaries.map((summary, index) => (
                        <tr key={summary.transporter_id} style={{ backgroundColor: "#F5E6E0" }}>
                          <td className="border border-[#c99] px-3 py-2 text-xs">{index + 1}</td>
                          <td className="border border-[#c99] px-3 py-2 text-xs">{summary.transporter_name}</td>
                          <td className="border border-[#c99] px-3 py-2 text-xs">Rs {summary.total_paid.toLocaleString("en-IN")}</td>
                          <td className="border border-[#c99] px-3 py-2 text-xs">Rs {summary.total_transport_amount.toLocaleString("en-IN")}</td>
                          <td className="border border-[#c99] px-3 py-2 text-xs">Rs {summary.outstanding.toLocaleString("en-IN")}</td>
                          <td className="border border-[#c99] px-3 py-2 text-xs"></td>
                          <td className="border border-[#c99] px-3 py-2 text-xs"></td>
                          <td className="border border-[#c99] px-3 py-2 text-xs">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-5 text-[10px] px-2"
                              onClick={() => navigate(`/admin/md-transporter-money?transporter=${summary.transporter_id}`)}
                            >
                              View
                            </Button>
                          </td>
                          <td className="border border-[#c99] px-3 py-2 text-center">
                            <input type="checkbox" className="w-3 h-3" />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
