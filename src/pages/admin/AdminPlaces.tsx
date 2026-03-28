import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePagination } from "@/hooks/usePagination";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow, ThemedActionLink, filterInputStyle } from "@/components/admin/AdminPageShell";

export default function AdminPlaces() {
  const location = useLocation();
  const isAddMode = location.pathname.includes("/add");
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(isAddMode);
  const [editingPlace, setEditingPlace] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", state: "", country: "India" });
  const canManage = isAdmin() || isAccount();

  useEffect(() => { if (!authLoading && canManage) fetchPlaces(); }, [authLoading, canManage]);

  const fetchPlaces = async () => { setLoading(true); const { data } = await supabase.from("cities").select("*").order("name"); setPlaces(data || []); setLoading(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlace) { const { error } = await supabase.from("cities").update(formData).eq("id", editingPlace.id); if (error) throw error; toast.success("Place updated"); }
      else { const { error } = await supabase.from("cities").insert([formData]); if (error) throw error; toast.success("Place added"); }
      resetForm(); fetchPlaces();
    } catch (error: any) { toast.error(error.message || "Error saving place"); }
  };

  const handleEdit = (place: any) => { setEditingPlace(place); setFormData({ name: place.name || "", state: place.state || "", country: place.country || "India" }); setIsDialogOpen(true); };
  const handleDelete = async (id: string) => { if (!confirm("Delete this place?")) return; const { error } = await supabase.from("cities").delete().eq("id", id); if (error) { toast.error("Error deleting"); return; } toast.success("Place deleted"); fetchPlaces(); };
  const resetForm = () => { setFormData({ name: "", state: "", country: "India" }); setEditingPlace(null); setIsDialogOpen(false); };

  const filteredPlaces = places.filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()) || p.state?.toLowerCase().includes(search.toLowerCase()));
  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filteredPlaces);

  if (authLoading || loading) return <div style={{ padding: 24, textAlign: "center", color: "#999", fontSize: 11 }}>Loading...</div>;
  if (!canManage) return <div style={{ padding: 24, textAlign: "center", fontSize: 11 }}>Access Denied</div>;

  const filterSection = (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif" }}>
      <span>Search :</span>
      <input value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...filterInputStyle, minWidth: 200 }} placeholder="Search places..." />
    </div>
  );

  return (
    <>
      <AdminPageShell title="Place Manager" actions={[{ label: "Add Place", onClick: () => { resetForm(); setIsDialogOpen(true); } }]} filterSection={filterSection} pagination={{ currentPage, totalPages, onPageChange: goToPage, totalItems, startIndex, endIndex }}>
        <ThemedTable>
          <ThemedTHead><ThemedTH>S.No</ThemedTH><ThemedTH>Name</ThemedTH><ThemedTH>State</ThemedTH><ThemedTH>Country</ThemedTH><ThemedTH>Action</ThemedTH></ThemedTHead>
          <tbody>
            {paginatedItems.length === 0 ? <ThemedEmptyRow colSpan={5} message="No places found" /> : paginatedItems.map((place, index) => (
              <ThemedTR key={place.id} index={index}>
                <ThemedTD>{startIndex + index + 1}</ThemedTD>
                <ThemedTD>{place.name}</ThemedTD>
                <ThemedTD>{place.state || "-"}</ThemedTD>
                <ThemedTD>{place.country || "-"}</ThemedTD>
                <ThemedTD>
                  <ThemedActionLink onClick={() => handleEdit(place)}>Edit</ThemedActionLink>
                  <ThemedActionLink onClick={() => handleDelete(place.id)}>Delete</ThemedActionLink>
                </ThemedTD>
              </ThemedTR>
            ))}
          </tbody>
        </ThemedTable>
      </AdminPageShell>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingPlace ? "Edit Place" : "Add Place"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Place Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
            <div><Label>State</Label><Input value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} /></div>
            <div><Label>Country</Label><Input value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} /></div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              <Button type="submit">{editingPlace ? "Update" : "Add"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
