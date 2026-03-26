import { useState, useEffect } from "react";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface HotelDueSummary {
  hotel_name: string;
  hotel_id: string;
  total_amount: number;
  total_paid: number;
  due_amount: number;
  latest_date: string | null;
}

export default function ViewHotelDue() {
  const [summaries, setSummaries] = useState<HotelDueSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [hotelFilter, setHotelFilter] = useState("");
  const [hotelNames, setHotelNames] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("hotel_bookings")
        .select("id, hotel_id, total_amount, paid_amount, due_amount, check_in_date, created_at, hotel:another_hotels(id, name)")
        .not("hotel_id", "is", null)
        .order("check_in_date", { ascending: false });

      if (error) throw error;

      // Group by hotel
      const grouped: Record<string, HotelDueSummary> = {};
      (data || []).forEach((hb: any) => {
        const hotelName = hb.hotel?.name || "Unknown";
        const hotelId = hb.hotel_id || "unknown";
        if (!grouped[hotelId]) {
          grouped[hotelId] = {
            hotel_name: hotelName,
            hotel_id: hotelId,
            total_amount: 0,
            total_paid: 0,
            due_amount: 0,
            latest_date: null,
          };
        }
        grouped[hotelId].total_amount += hb.total_amount || 0;
        grouped[hotelId].total_paid += hb.paid_amount || 0;
        const date = hb.check_in_date || hb.created_at;
        if (date && (!grouped[hotelId].latest_date || date > grouped[hotelId].latest_date)) {
          grouped[hotelId].latest_date = date;
        }
      });

      Object.values(grouped).forEach(g => {
        g.due_amount = g.total_amount - g.total_paid;
      });

      const result = Object.values(grouped);
      setSummaries(result);

      const uniqueHotels = result.map(s => ({ id: s.hotel_id, name: s.hotel_name }));
      uniqueHotels.sort((a, b) => a.name.localeCompare(b.name));
      setHotelNames(uniqueHotels);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load another hotel due data");
    } finally {
      setLoading(false);
    }
  };

  const filteredSummaries = summaries.filter(s =>
    !hotelFilter || s.hotel_id === hotelFilter
  );

  return (
    <div className="p-4">
      <div className="bg-[#1e6e99] text-white px-4 py-2 flex items-center justify-between mb-0">
        <span className="text-sm font-medium">View Another Hotel Payment</span>
        <button onClick={() => setHotelFilter("")} className="bg-white text-[#1e6e99] hover:bg-gray-100 h-7 text-xs px-3 rounded border-0">View All Records</button>
      </div>
      <div className="bg-[#8B1538] text-white px-4 py-1"><span className="text-xs font-medium">Search</span></div>
      <div className="border border-t-0 border-gray-300 bg-[#F5E6E0] p-3 mb-0">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-700">Another Hotel :</label>
          <select value={hotelFilter} onChange={e => setHotelFilter(e.target.value)} className="h-7 text-xs border border-gray-300 rounded px-2 bg-white min-w-[200px]">
            <option value="">--Select--</option>
            {hotelNames.map(h => (<option key={h.id} value={h.id}>{h.name}</option>))}
          </select>
        </div>
      </div>
      <div className="border border-t-0 border-gray-300 overflow-x-auto">
        {loading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> : (
          <>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#D4A59A] text-gray-800">
                  <th className="border border-gray-400 px-2 py-1.5 text-left font-medium">S.No.</th>
                  <th className="border border-gray-400 px-2 py-1.5 text-left font-medium">Date</th>
                  <th className="border border-gray-400 px-2 py-1.5 text-left font-medium">Hotel</th>
                  <th className="border border-gray-400 px-2 py-1.5 text-left font-medium">Due Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredSummaries.length === 0 ? (
                  <tr><td colSpan={4} className="border border-gray-300 text-center py-8 text-gray-500">No another hotel data found</td></tr>
                ) : filteredSummaries.map((summary, idx) => (
                  <tr key={summary.hotel_id} className={idx % 2 === 0 ? "bg-[#F5E6E0]" : "bg-white"}>
                    <td className="border border-gray-300 px-2 py-1.5">{idx + 1}</td>
                    <td className="border border-gray-300 px-2 py-1.5">{summary.latest_date ? new Date(summary.latest_date).toLocaleDateString("en-GB") : "-"}</td>
                    <td className="border border-gray-300 px-2 py-1.5 font-medium">{summary.hotel_name}</td>
                    <td className="border border-gray-300 px-2 py-1.5">Rs {summary.due_amount.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSummaries.length > 0 && (
              <div className="flex items-center justify-between p-3 border-t border-gray-300 bg-[#F5E6E0]">
                <div className="text-xs font-medium">
                  Total: Rs. {filteredSummaries.reduce((s, r) => s + r.total_amount, 0).toLocaleString("en-IN")}/-
                  &nbsp;|&nbsp; Paid: Rs. {filteredSummaries.reduce((s, r) => s + r.total_paid, 0).toLocaleString("en-IN")}/-
                  &nbsp;|&nbsp; Due: Rs. {filteredSummaries.reduce((s, r) => s + r.due_amount, 0).toLocaleString("en-IN")}/-
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
