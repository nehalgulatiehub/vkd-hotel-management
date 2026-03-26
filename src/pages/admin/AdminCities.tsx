import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow } from "@/components/admin/AdminPageShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    return <div className="p-6 text-center text-muted-foreground">Loading...</div>;
  }

  if (!canManage) {
    return <div className="p-6 text-center text-muted-foreground">Access Denied</div>;
  }

  return (
    <AdminPageShell
      title="Manage Cities"
      actions={[{ label: "Add City", onClick: () => navigate("/admin/cities/add") }]}
      filterSection={
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-700 w-20 text-right">Search :</label>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 max-w-sm h-7 text-xs"
            placeholder="Search by name or state..."
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
          <ThemedTH className="w-12 text-center">S.No</ThemedTH>
          <ThemedTH>Name</ThemedTH>
          <ThemedTH>State</ThemedTH>
          <ThemedTH>Country</ThemedTH>
          <ThemedTH className="text-center w-24">Action</ThemedTH>
        </ThemedTHead>
        <tbody>
          {pagination.paginatedItems.map((city, index) => (
            <ThemedTR key={city.id} index={index}>
              <ThemedTD className="text-center">{pagination.startIndex + index}</ThemedTD>
              <ThemedTD>{city.name}</ThemedTD>
              <ThemedTD>{city.state || "-"}</ThemedTD>
              <ThemedTD>{city.country || "India"}</ThemedTD>
              <ThemedTD className="text-center">
                <button onClick={() => navigate(`/admin/cities/add?edit=${city.id}`)} className="text-blue-600 hover:underline text-xs">Edit</button>
                <span className="text-gray-400 mx-1">/</span>
                <button onClick={() => handleDelete(city.id)} className="text-blue-600 hover:underline text-xs">Delete</button>
              </ThemedTD>
            </ThemedTR>
          ))}
          {filteredCities.length === 0 && <ThemedEmptyRow colSpan={5} message="No cities found" />}
        </tbody>
      </ThemedTable>
    </AdminPageShell>
  );
}
