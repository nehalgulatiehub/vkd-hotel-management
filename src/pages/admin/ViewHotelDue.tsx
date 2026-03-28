import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow, filterSelectStyle } from "@/components/admin/AdminPageShell";

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

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("hotel_bookings").select("id, hotel_id, total_amount, paid_amount, due_amount, check_in_date, created_at, hotel:another_hotels(id, name)").not("hotel_id", "is", null).order("check_in_date", { ascending: false });
      if (error) throw error;
      const grouped: Record<string, HotelDueSummary> = {};
      (data || []).forEach((hb: any) => {
        const hotelName = hb.hotel?.name || "Unknown";
        const hotelId = hb.hotel_id || "unknown";
        if (!grouped[hotelId]) grouped[hotelId] = { hotel_name: hotelName, hotel_id: hotelId, total_amount: 0, total_paid: 0, due_amount: 0, latest_date: null };
        grouped[hotelId].total_amount += hb.total_amount || 0;
        grouped[hotelId].total_paid += hb.paid_amount || 0;
        const date = hb.check_in_date || hb.created_at;
        if (date && (!grouped[hotelId].latest_date || date > grouped[hotelId].latest_date)) grouped[hotelId].latest_date = date;
      });
      Object.values(grouped).forEach(g => { g.due_amount = g.total_amount - g.total_paid; });
      const result = Object.values(grouped);
      setSummaries(result);
      const uniqueHotels = result.map(s => ({ id: s.hotel_id, name: s.hotel_name }));
      uniqueHotels.sort((a, b) => a.name.localeCompare(b.name));
      setHotelNames(uniqueHotels);
    } catch (error) { console.error(error); toast.error("Failed to load another hotel due data"); }
    finally { setLoading(false); }
  };

  const filteredSummaries = summaries.filter(s => !hotelFilter || s.hotel_id === hotelFilter);
  const pagination = usePagination(filteredSummaries);
  const totalAmount = filteredSummaries.reduce((s, r) => s + r.total_amount, 0);
  const totalPaid = filteredSummaries.reduce((s, r) => s + r.total_paid, 0);
  const totalDue = filteredSummaries.reduce((s, r) => s + r.due_amount, 0);

  const filterSection = (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <label style={{ fontSize: 11, minWidth: 100, textAlign: "right" }}>Another Hotel :</label>
      <select value={hotelFilter} onChange={e => setHotelFilter(e.target.value)} style={{ ...filterSelectStyle, minWidth: 200 }}>
        <option value="">--Select--</option>
        {hotelNames.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
      </select>
    </div>
  );

  return (
    <AdminPageShell
      title="View Another Hotel Payment"
      actions={[{ label: "View All Records", onClick: () => setHotelFilter("") }]}
      filterSection={filterSection}
      pagination={{ currentPage: pagination.currentPage, totalPages: pagination.totalPages, onPageChange: pagination.goToPage, totalItems: pagination.totalItems, startIndex: pagination.startIndex, endIndex: pagination.endIndex }}
    >
      {loading ? <div style={{ textAlign: "center", padding: 32, color: "#999" }}>Loading...</div> : (
        <>
          <ThemedTable>
            <ThemedTHead>
              <ThemedTH>S.No.</ThemedTH>
              <ThemedTH>Date</ThemedTH>
              <ThemedTH>Hotel</ThemedTH>
              <ThemedTH>Due Amount</ThemedTH>
            </ThemedTHead>
            <tbody>
              {pagination.paginatedItems.length === 0 ? <ThemedEmptyRow colSpan={4} message="No another hotel data found" /> : pagination.paginatedItems.map((summary, idx) => (
                <ThemedTR key={summary.hotel_id} index={idx}>
                  <ThemedTD>{pagination.startIndex + idx + 1}</ThemedTD>
                  <ThemedTD>{summary.latest_date ? new Date(summary.latest_date).toLocaleDateString("en-GB") : "-"}</ThemedTD>
                  <ThemedTD>{summary.hotel_name}</ThemedTD>
                  <ThemedTD>Rs {summary.due_amount.toLocaleString("en-IN")}</ThemedTD>
                </ThemedTR>
              ))}
            </tbody>
          </ThemedTable>
          {filteredSummaries.length > 0 && (
            <div style={{ padding: "6px 10px", fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif", color: "#c00", fontStyle: "italic" }}>
              <strong>Total :</strong> Rs. {totalAmount.toLocaleString("en-IN")}/-&nbsp;&nbsp;
              <strong>Paid :</strong> Rs. {totalPaid.toLocaleString("en-IN")}/-&nbsp;&nbsp;
              <strong>Due :</strong> Rs. {totalDue.toLocaleString("en-IN")}/-
            </div>
          )}
        </>
      )}
    </AdminPageShell>
  );
}
