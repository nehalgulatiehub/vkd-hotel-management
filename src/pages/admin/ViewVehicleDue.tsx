import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

interface TransporterDueSummary {
  transporter_id: string;
  transporter_name: string;
  due_amount: number;
}

export default function ViewVehicleDue() {
  const navigate = useNavigate();
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [summaries, setSummaries] = useState<TransporterDueSummary[]>([]);
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
      const { data, error } = await supabase
        .from("vehicle_bookings")
        .select("transporter_id, total_amount, paid_amount, due_amount, transporters(name)")
        .not("transporter_id", "is", null);

      if (error) throw error;

      // Group by transporter
      const grouped: Record<string, { name: string; due: number }> = {};
      (data || []).forEach((vb: any) => {
        const tId = vb.transporter_id;
        if (!tId) return;
        if (!grouped[tId]) {
          grouped[tId] = {
            name: vb.transporters?.name || "Unknown",
            due: 0,
          };
        }
        grouped[tId].due += (vb.due_amount || 0);
      });

      const results: TransporterDueSummary[] = Object.entries(grouped)
        .map(([id, info]) => ({
          transporter_id: id,
          transporter_name: info.name,
          due_amount: info.due,
        }))
        .sort((a, b) => a.transporter_name.localeCompare(b.transporter_name));

      setSummaries(results);
    } catch (error) {
      console.error("Error fetching vehicle due data:", error);
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
        <AdminHeader title="Due Amount Transporter" />
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
      <AdminHeader title="Due Amount Transporter" />
      <main className="p-4">
        {/* Blue Header Bar */}
        <div className="flex justify-between items-center px-4 py-2 mb-3" style={{ backgroundColor: "#1e6e99" }}>
          <span className="text-white font-semibold text-sm">View Another Vehicle Transporter Payment</span>
          <div className="flex items-center gap-4">
            <Button variant="link" className="text-white p-0 h-auto text-sm hover:text-white/80" onClick={() => setSelectedTransporter("")}>
              View All Records
            </Button>
          </div>
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
                <option value="">-- Select Transporter --</option>
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
                      <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Transporter↕</th>
                      <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Payment</th>
                      <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold"></th>
                      <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold"></th>
                      <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold"></th>
                      <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSummaries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-4 text-xs text-muted-foreground">
                          No records found.
                        </td>
                      </tr>
                    ) : (
                      filteredSummaries.map((summary) => (
                        <tr key={summary.transporter_id} style={{ backgroundColor: "#F5E6E0" }}>
                          <td className="border border-[#c99] px-3 py-2 text-xs">{summary.transporter_name}</td>
                          <td className="border border-[#c99] px-3 py-2 text-xs">Rs {summary.due_amount.toLocaleString("en-IN")} /-</td>
                          <td className="border border-[#c99] px-3 py-2 text-xs"></td>
                          <td className="border border-[#c99] px-3 py-2 text-xs"></td>
                          <td className="border border-[#c99] px-3 py-2 text-xs"></td>
                          <td className="border border-[#c99] px-3 py-2 text-xs"></td>
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
