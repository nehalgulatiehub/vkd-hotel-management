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

  if (authLoading) return <div className="p-6 text-center text-muted-foreground">Loading...</div>;
  if (!canManage) return <div className="p-6 text-center text-muted-foreground">Access Denied</div>;

  return (
    <div className="p-4">
      <div className="bg-[#b44a50] text-white px-4 py-2 flex items-center justify-between mb-0">
        <span className="text-sm font-medium">Due MD Transporter Payment</span>
        <Button variant="outline" className="bg-white text-[#c00] hover:bg-gray-100 h-7 text-xs" onClick={() => setSelectedTransporter("")}>View All Records</Button>
      </div>
      <div className="bg-[#b44a50] text-white px-4 py-1"><span className="text-xs font-medium">Search</span></div>
      <div className="border border-t-0 border-gray-300 bg-[#f6f0f0] p-3 mb-0">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-700">Transporter :</label>
          <select value={selectedTransporter} onChange={(e) => setSelectedTransporter(e.target.value)} className="h-7 text-xs border border-gray-300 rounded px-2 bg-white min-w-[200px]">
            <option value="">--Select--</option>
            {transporters.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
          </select>
        </div>
      </div>
      <div className="border border-t-0 border-gray-300 overflow-x-auto">
        {loading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> : (
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#c47a7e] text-gray-800">
                <th className="border border-gray-400 px-2 py-1.5 text-left font-medium">S.No.</th>
                <th className="border border-gray-400 px-2 py-1.5 text-left font-medium">Transporter</th>
                <th className="border border-gray-400 px-2 py-1.5 text-left font-medium">Total Paid</th>
                <th className="border border-gray-400 px-2 py-1.5 text-left font-medium">Total Transport Amount</th>
                <th className="border border-gray-400 px-2 py-1.5 text-left font-medium">Outstanding</th>
                <th className="border border-gray-400 px-2 py-1.5 text-center font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSummaries.length === 0 ? (
                <tr><td colSpan={6} className="border border-gray-300 text-center py-8 text-gray-500">No records found.</td></tr>
              ) : filteredSummaries.map((summary, index) => (
                <tr key={summary.transporter_id} className={index % 2 === 0 ? "bg-[#f6f0f0]" : "bg-white"}>
                  <td className="border border-gray-300 px-2 py-1.5">{index + 1}</td>
                  <td className="border border-gray-300 px-2 py-1.5">{summary.transporter_name}</td>
                  <td className="border border-gray-300 px-2 py-1.5">Rs {summary.total_paid.toLocaleString("en-IN")}</td>
                  <td className="border border-gray-300 px-2 py-1.5">Rs {summary.total_transport_amount.toLocaleString("en-IN")}</td>
                  <td className="border border-gray-300 px-2 py-1.5">Rs {summary.outstanding.toLocaleString("en-IN")}</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-center">
                    <button onClick={() => navigate(`/admin/md-transporter-money?transporter=${summary.transporter_id}`)} className="text-blue-600 hover:underline text-xs">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
