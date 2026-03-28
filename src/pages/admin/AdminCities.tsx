import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow, filterInputStyle } from "@/components/admin/AdminPageShell";

interface City {
  id: string;
  name: string;
  state: string | null;
  country: string | null;
  created_at: string | null;
}

export default function AdminCities() {
  const navigate = useNavigate();
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const canManage = isAdmin() || isAccount();

  useEffect(() => {
    if (!authLoading && canManage) fetchCities();
  }, [authLoading, canManage]);

  const fetchCities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("cities").select("*").order("name");
      if (error) throw error;
      setCities(data || []);
    } catch (error) {
      console.error("Error fetching cities:", error);
      toast.error("Failed to fetch cities");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this city?")) return;
    try {
      const { error } = await supabase.from("cities").delete().eq("id", id);
      if (error) throw error;
      toast.success("City deleted successfully");
      fetchCities();
    } catch (error) {
      console.error("Error deleting city:", error);
      toast.error("Failed to delete city");
    }
  };

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(search.toLowerCase()) ||
    (city.state && city.state.toLowerCase().includes(search.toLowerCase()))
  );

  const pagination = usePagination(filteredCities);

  if (authLoading || loading) {
    return <div style={{ padding: 24, textAlign: "center", color: "#999", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 }}>Loading...</div>;
  }

  if (!canManage) {
    return <div style={{ padding: 24, textAlign: "center", color: "#999", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 }}>Access Denied</div>;
  }

  return (
    <AdminPageShell
      title="Manage Cities"
      actions={[{ label: "Add City", onClick: () => navigate("/admin/cities/add") }]}
      filterSection={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 11, minWidth: 50, textAlign: "right" }}>Search :</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or state..."
            style={{ ...filterInputStyle, width: 250 }}
          />
        </div>
      }
      pagination={{
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
        onPageChange: pagination.goToPage,
        totalItems: pagination.totalItems,
        startIndex: pagination.startIndex,
        endIndex: pagination.endIndex,
      }}
    >
      <ThemedTable>
        <ThemedTHead>
          <ThemedTH>S.No</ThemedTH>
          <ThemedTH>Name</ThemedTH>
          <ThemedTH>State</ThemedTH>
          <ThemedTH>Country</ThemedTH>
          <ThemedTH>Action</ThemedTH>
        </ThemedTHead>
        <tbody>
          {pagination.paginatedItems.map((city, index) => (
            <ThemedTR key={city.id} index={index}>
              <ThemedTD>{pagination.startIndex + index}</ThemedTD>
              <ThemedTD>{city.name}</ThemedTD>
              <ThemedTD>{city.state || "-"}</ThemedTD>
              <ThemedTD>{city.country || "India"}</ThemedTD>
              <ThemedTD>
                <span onClick={() => navigate(`/admin/cities/add?edit=${city.id}`)} style={{ color: "#0066cc", cursor: "pointer", fontSize: 10 }} onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")} onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>Edit</span>
                {" / "}
                <span onClick={() => handleDelete(city.id)} style={{ color: "#0066cc", cursor: "pointer", fontSize: 10 }} onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")} onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>Delete</span>
              </ThemedTD>
            </ThemedTR>
          ))}
          {filteredCities.length === 0 && <ThemedEmptyRow colSpan={5} message="No cities found" />}
        </tbody>
      </ThemedTable>
    </AdminPageShell>
  );
}