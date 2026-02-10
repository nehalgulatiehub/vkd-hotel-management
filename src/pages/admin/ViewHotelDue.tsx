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
    <div className="min-h-screen bg-background">
      <AdminHeader title="View Another Hotel Payment" />
      <main className="p-3 space-y-3">
        {/* Search Section */}
        <div className="border border-[#c99] rounded">
          <div className="flex items-center justify-between px-3 py-1.5" style={{ backgroundColor: "#1e6e99" }}>
            <span className="text-white text-xs font-bold">Search</span>
            <button onClick={() => setHotelFilter("")} className="text-white text-xs underline hover:no-underline">View All Records</button>
          </div>
          <div className="p-3" style={{ fontSize: "11px" }}>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1">
                <span>Another Hotel :</span>
                <select
                  value={hotelFilter}
                  onChange={e => setHotelFilter(e.target.value)}
                  className="border rounded px-1 py-0.5 text-xs min-w-[200px]"
                >
                  <option value="">--Select--</option>
                  {hotelNames.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
              <button className="border rounded px-4 py-1 text-xs font-bold bg-background hover:bg-muted">
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
                  <th className="border border-[#c99] px-2 py-1.5 text-left font-bold text-xs">Hotel</th>
                  <th className="border border-[#c99] px-2 py-1.5 text-left font-bold text-xs">Payment</th>
                  <th className="border border-[#c99] px-2 py-1.5 text-left font-bold text-xs">Payment Mode</th>
                  <th className="border border-[#c99] px-2 py-1.5 text-left font-bold text-xs">Cheque No</th>
                  <th className="border border-[#c99] px-2 py-1.5 text-left font-bold text-xs">Payment detail</th>
                  <th className="border border-[#c99] px-2 py-1.5 text-left font-bold text-xs">Action</th>
                  <th className="border border-[#c99] px-2 py-1.5 text-center font-bold text-xs">
                    <input type="checkbox" disabled />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-muted-foreground border border-[#c99]">
                      No another hotel data found
                    </td>
                  </tr>
                ) : (
                  filteredSummaries.map((summary, idx) => (
                    <tr key={summary.hotel_id} style={{ backgroundColor: "#F5E6E0" }}>
                      <td className="border border-[#c99] px-2 py-2 text-xs">{idx + 1}</td>
                      <td className="border border-[#c99] px-2 py-2 text-xs">
                        {summary.latest_date ? new Date(summary.latest_date).toLocaleDateString("en-GB") : "-"}
                      </td>
                      <td className="border border-[#c99] px-2 py-2 text-xs font-medium">{summary.hotel_name}</td>
                      <td className="border border-[#c99] px-2 py-2 text-xs">
                        Rs {summary.due_amount.toLocaleString("en-IN")}
                      </td>
                      <td className="border border-[#c99] px-2 py-2 text-xs"></td>
                      <td className="border border-[#c99] px-2 py-2 text-xs"></td>
                      <td className="border border-[#c99] px-2 py-2 text-xs"></td>
                      <td className="border border-[#c99] px-2 py-2 text-xs"></td>
                      <td className="border border-[#c99] px-2 py-2 text-xs text-center">
                        <input type="checkbox" />
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
    </div>
  );
}
