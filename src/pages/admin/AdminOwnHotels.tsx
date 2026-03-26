import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow } from "@/components/admin/AdminPageShell";
import { Input } from "@/components/ui/input";

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

  if (authLoading || loading) return <div className="p-6 text-center text-muted-foreground">Loading...</div>;
  if (!canManage) return <div className="p-6 text-center text-muted-foreground">Access Denied</div>;

  return (
    <AdminPageShell
      title="Manage Own Hotels"
      actions={[{ label: "Add Hotel", onClick: () => navigate("/admin/own-hotels/add") }]}
      filterSection={
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-700 w-20 text-right">Search :</label>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 max-w-sm h-7 text-xs" placeholder="Search by hotel name..." />
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
          <ThemedTH className="w-12 text-center">S.No</ThemedTH>
          <ThemedTH>Name</ThemedTH>
          <ThemedTH>Contact Person</ThemedTH>
          <ThemedTH>Phone</ThemedTH>
          <ThemedTH>City</ThemedTH>
          <ThemedTH>Rating</ThemedTH>
          <ThemedTH className="text-center w-24">Action</ThemedTH>
        </ThemedTHead>
        <tbody>
          {pagination.paginatedItems.map((h, index) => (
            <ThemedTR key={h.id} index={index}>
              <ThemedTD className="text-center">{pagination.startIndex + index}</ThemedTD>
              <ThemedTD>{h.name}</ThemedTD>
              <ThemedTD>{h.contact_person || "-"}</ThemedTD>
              <ThemedTD>{h.phone || "-"}</ThemedTD>
              <ThemedTD>{h.city?.name || "-"}</ThemedTD>
              <ThemedTD>{h.rating ?? "-"}</ThemedTD>
              <ThemedTD className="text-center">
                <button onClick={() => navigate(`/admin/own-hotels/add?edit=${h.id}`)} className="text-blue-600 hover:underline text-xs">Edit</button>
                <span className="text-gray-400 mx-1">/</span>
                <button onClick={() => handleDelete(h.id)} className="text-blue-600 hover:underline text-xs">Delete</button>
              </ThemedTD>
            </ThemedTR>
          ))}
          {filteredHotels.length === 0 && <ThemedEmptyRow colSpan={7} message="No hotels found" />}
        </tbody>
      </ThemedTable>
    </AdminPageShell>
  );
}
