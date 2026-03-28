import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow, filterInputStyle } from "@/components/admin/AdminPageShell";

interface OwnHotel {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  rating: number | null;
  city_id: string | null;
  city?: { name: string } | null;
}

export default function AdminOwnHotels() {
  const navigate = useNavigate();
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [hotels, setHotels] = useState<OwnHotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const canManage = isAdmin() || isAccount();

  useEffect(() => {
    if (!authLoading && canManage) fetchHotels();
  }, [authLoading, canManage]);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("own_hotels").select("*, city:cities(name)").order("name");
      if (error) throw error;
      setHotels(data || []);
    } catch (error) {
      console.error("Error fetching hotels:", error);
      toast.error("Failed to fetch hotels");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this hotel?")) return;
    try {
      const { error } = await supabase.from("own_hotels").delete().eq("id", id);
      if (error) throw error;
      toast.success("Hotel deleted successfully");
      fetchHotels();
    } catch (error) {
      console.error("Error deleting hotel:", error);
      toast.error("Failed to delete hotel");
    }
  };

  const filteredHotels = hotels.filter(h => h.name.toLowerCase().includes(search.toLowerCase()));
  const pagination = usePagination(filteredHotels);

  if (authLoading || loading) return <div style={{ padding: 24, textAlign: "center", color: "#999", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 }}>Loading...</div>;
  if (!canManage) return <div style={{ padding: 24, textAlign: "center", color: "#999", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 }}>Access Denied</div>;

  return (
    <AdminPageShell
      title="Manage Own Hotels"
      actions={[{ label: "Add Hotel", onClick: () => navigate("/admin/own-hotels/add") }]}
      filterSection={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 11, minWidth: 50, textAlign: "right" }}>Search :</label>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by hotel name..." style={{ ...filterInputStyle, width: 250 }} />
        </div>
      }
      pagination={{
        currentPage: pagination.currentPage, totalPages: pagination.totalPages,
        onPageChange: pagination.goToPage, totalItems: pagination.totalItems,
        startIndex: pagination.startIndex, endIndex: pagination.endIndex,
      }}
    >
      <ThemedTable>
        <ThemedTHead>
          <ThemedTH>S.No</ThemedTH>
          <ThemedTH>Name</ThemedTH>
          <ThemedTH>Contact Person</ThemedTH>
          <ThemedTH>Phone</ThemedTH>
          <ThemedTH>City</ThemedTH>
          <ThemedTH>Rating</ThemedTH>
          <ThemedTH>Action</ThemedTH>
        </ThemedTHead>
        <tbody>
          {pagination.paginatedItems.map((h, index) => (
            <ThemedTR key={h.id} index={index}>
              <ThemedTD>{pagination.startIndex + index}</ThemedTD>
              <ThemedTD>{h.name}</ThemedTD>
              <ThemedTD>{h.contact_person || "-"}</ThemedTD>
              <ThemedTD>{h.phone || "-"}</ThemedTD>
              <ThemedTD>{h.city?.name || "-"}</ThemedTD>
              <ThemedTD>{h.rating ?? "-"}</ThemedTD>
              <ThemedTD>
                <span onClick={() => navigate(`/admin/own-hotels/add?edit=${h.id}`)} style={{ color: "#0066cc", cursor: "pointer", fontSize: 10 }} onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")} onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>Edit</span>
                {" / "}
                <span onClick={() => handleDelete(h.id)} style={{ color: "#0066cc", cursor: "pointer", fontSize: 10 }} onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")} onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>Delete</span>
              </ThemedTD>
            </ThemedTR>
          ))}
          {filteredHotels.length === 0 && <ThemedEmptyRow colSpan={7} message="No hotels found" />}
        </tbody>
      </ThemedTable>
    </AdminPageShell>
  );
}