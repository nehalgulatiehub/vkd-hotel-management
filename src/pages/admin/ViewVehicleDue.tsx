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

  if (authLoading) return <div className="p-6 text-center text-muted-foreground">Loading...</div>;
  if (!canManage) return <div className="p-6 text-center text-muted-foreground">Access Denied</div>;

  return (
    <div className="p-4">
      <div className="bg-[#1e6e99] text-white px-4 py-2 flex items-center justify-between mb-0">
        <span className="text-sm font-medium">Due Amount Transporter</span>
        <Button variant="outline" className="bg-white text-[#1e6e99] hover:bg-gray-100 h-7 text-xs" onClick={() => setSelectedTransporter("")}>View All Records</Button>
      </div>
      <div className="bg-[#8B1538] text-white px-4 py-1"><span className="text-xs font-medium">Search</span></div>
      <div className="border border-t-0 border-gray-300 bg-[#F5E6E0] p-3 mb-0">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-700">Transporter :</label>
          <select value={selectedTransporter} onChange={(e) => setSelectedTransporter(e.target.value)} className="h-7 text-xs border border-gray-300 rounded px-2 bg-white min-w-[200px]">
            <option value="">-- Select Transporter --</option>
            {transporters.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
          </select>
        </div>
      </div>
      <div className="border border-t-0 border-gray-300 overflow-x-auto">
        {loading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> : (
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#D4A59A] text-gray-800">
                <th className="border border-gray-400 px-2 py-1.5 text-left font-medium">Transporter</th>
                <th className="border border-gray-400 px-2 py-1.5 text-left font-medium">Due Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredSummaries.length === 0 ? (
                <tr><td colSpan={2} className="border border-gray-300 text-center py-8 text-gray-500">No records found.</td></tr>
              ) : filteredSummaries.map((summary, index) => (
                <tr key={summary.transporter_id} className={index % 2 === 0 ? "bg-[#F5E6E0]" : "bg-white"}>
                  <td className="border border-gray-300 px-2 py-1.5">{summary.transporter_name}</td>
                  <td className="border border-gray-300 px-2 py-1.5">Rs {summary.due_amount.toLocaleString("en-IN")} /-</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
