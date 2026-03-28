import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow, ThemedActionLink, filterInputStyle } from "@/components/admin/AdminPageShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";

export default function AdminGuestUsers() {
  const location = useLocation();
  const isAddMode = location.pathname.includes("/add");
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [guests, setGuests] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(isAddMode);
  const [editingGuest, setEditingGuest] = useState<any>(null);
  const [formData, setFormData] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    address: "", city_id: "", id_proof_type: "", id_proof_number: "", notes: "",
  });

  const canManage = isAdmin() || isAccount();

  useEffect(() => { if (!authLoading && canManage) { fetchGuests(); fetchCities(); } }, [authLoading, canManage]);

  const fetchGuests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("guests").select("*, cities(name)").order("first_name");
      if (error) throw error;
      setGuests(data || []);
    } catch (error) { console.error("Error fetching guests:", error); }
    finally { setLoading(false); }
  };

  const fetchCities = async () => { const { data } = await supabase.from("cities").select("*").order("name"); setCities(data || []); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGuest) {
        const { error } = await supabase.from("guests").update(formData).eq("id", editingGuest.id);
        if (error) throw error;
        toast.success("Guest updated successfully");
      } else {
        const { error } = await supabase.from("guests").insert([formData]);
        if (error) throw error;
        toast.success("Guest added successfully");
      }
      resetForm(); fetchGuests();
    } catch (error: any) { toast.error(error.message || "Error saving guest"); }
  };

  const handleEdit = (guest: any) => {
    setEditingGuest(guest);
    setFormData({ first_name: guest.first_name || "", last_name: guest.last_name || "", email: guest.email || "", phone: guest.phone || "", address: guest.address || "", city_id: guest.city_id || "", id_proof_type: guest.id_proof_type || "", id_proof_number: guest.id_proof_number || "", notes: guest.notes || "" });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this guest?")) return;
    try {
      const { error } = await supabase.from("guests").delete().eq("id", id);
      if (error) throw error;
      toast.success("Guest deleted successfully"); fetchGuests();
    } catch (error: any) { toast.error(error.message || "Error deleting guest"); }
  };

  const resetForm = () => {
    setFormData({ first_name: "", last_name: "", email: "", phone: "", address: "", city_id: "", id_proof_type: "", id_proof_number: "", notes: "" });
    setEditingGuest(null); setIsDialogOpen(false);
  };

  const filteredGuests = guests.filter((guest) => {
    const s = search.toLowerCase();
    return guest.first_name?.toLowerCase().includes(s) || guest.last_name?.toLowerCase().includes(s) ||
      guest.email?.toLowerCase().includes(s) || guest.phone?.includes(search);
  });

  const pagination = usePagination(filteredGuests);

  if (authLoading || loading) return <div style={{ padding: 24, textAlign: "center", color: "#999", fontSize: 11 }}>Loading...</div>;
  if (!canManage) return <div style={{ padding: 24, textAlign: "center", fontSize: 11 }}>Access Denied</div>;

  const filterSection = (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif" }}>
      <span>Search :</span>
      <input value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...filterInputStyle, minWidth: 250 }} placeholder="Search by name, email, phone..." />
    </div>
  );

  return (
    <>
      <AdminPageShell title="Guest User Manager" actions={[{ label: "Add Guest", onClick: () => { resetForm(); setIsDialogOpen(true); } }]} filterSection={filterSection} pagination={{ currentPage: pagination.currentPage, totalPages: pagination.totalPages, onPageChange: pagination.goToPage, totalItems: pagination.totalItems, startIndex: pagination.startIndex, endIndex: pagination.endIndex }}>
        <ThemedTable>
          <ThemedTHead>
            <ThemedTH>S.No</ThemedTH><ThemedTH>Name</ThemedTH><ThemedTH>Email</ThemedTH><ThemedTH>Phone</ThemedTH><ThemedTH>City</ThemedTH><ThemedTH>Action</ThemedTH>
          </ThemedTHead>
          <tbody>
            {pagination.paginatedItems.map((guest, index) => (
              <ThemedTR key={guest.id} index={index}>
                <ThemedTD>{pagination.startIndex + index + 1}</ThemedTD>
                <ThemedTD>{guest.first_name} {guest.last_name}</ThemedTD>
                <ThemedTD>{guest.email || "-"}</ThemedTD>
                <ThemedTD>{guest.phone || "-"}</ThemedTD>
                <ThemedTD>{guest.cities?.name || "-"}</ThemedTD>
                <ThemedTD>
                  <ThemedActionLink onClick={() => handleEdit(guest)}>Edit</ThemedActionLink>
                  <ThemedActionLink onClick={() => handleDelete(guest.id)}>Delete</ThemedActionLink>
                </ThemedTD>
              </ThemedTR>
            ))}
            {filteredGuests.length === 0 && <ThemedEmptyRow colSpan={6} message="No guests found" />}
          </tbody>
        </ThemedTable>
      </AdminPageShell>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingGuest ? "Edit Guest" : "Add Guest"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>First Name *</Label><Input value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required /></div>
              <div><Label>Last Name *</Label><Input value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} required /></div>
              <div><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
              <div><Label>City</Label>
                <Select value={formData.city_id} onValueChange={(v) => setFormData({ ...formData, city_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                  <SelectContent>{cities.map((city) => (<SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div><Label>ID Proof Type</Label><Input value={formData.id_proof_type} onChange={(e) => setFormData({ ...formData, id_proof_type: e.target.value })} /></div>
              <div><Label>ID Proof Number</Label><Input value={formData.id_proof_number} onChange={(e) => setFormData({ ...formData, id_proof_number: e.target.value })} /></div>
            </div>
            <div><Label>Address</Label><Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
            <div><Label>Notes</Label><Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              <Button type="submit">{editingGuest ? "Update" : "Add"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
