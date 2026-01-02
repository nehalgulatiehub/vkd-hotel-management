import { useState, useEffect } from "react";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/TablePagination";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";

// Places are stored in the cities table
export default function AdminPlaces() {
  const location = useLocation();
  const isAddMode = location.pathname.includes("/add");
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(isAddMode);
  const [editingPlace, setEditingPlace] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    state: "",
    country: "India",
  });

  const canManage = isAdmin() || isAccount();

  useEffect(() => {
    if (!authLoading && canManage) {
      fetchPlaces();
    }
  }, [authLoading, canManage]);

  const fetchPlaces = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .order("name");

      if (error) throw error;
      setPlaces(data || []);
    } catch (error) {
      console.error("Error fetching places:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlace) {
        const { error } = await supabase
          .from("cities")
          .update(formData)
          .eq("id", editingPlace.id);
        if (error) throw error;
        toast.success("Place updated successfully");
      } else {
        const { error } = await supabase.from("cities").insert([formData]);
        if (error) throw error;
        toast.success("Place added successfully");
      }
      resetForm();
      fetchPlaces();
    } catch (error: any) {
      toast.error(error.message || "Error saving place");
    }
  };

  const handleEdit = (place: any) => {
    setEditingPlace(place);
    setFormData({
      name: place.name || "",
      state: place.state || "",
      country: place.country || "India",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this place?")) return;
    try {
      const { error } = await supabase.from("cities").delete().eq("id", id);
      if (error) throw error;
      toast.success("Place deleted successfully");
      fetchPlaces();
    } catch (error: any) {
      toast.error(error.message || "Error deleting place");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", state: "", country: "India" });
    setEditingPlace(null);
    setIsDialogOpen(false);
  };

  const filteredPlaces = places.filter((place) => {
    const searchLower = search.toLowerCase();
    return (
      place.name?.toLowerCase().includes(searchLower) ||
      place.state?.toLowerCase().includes(searchLower)
    );
  });

  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filteredPlaces);

  if (authLoading) {
    return (
      <div className="min-h-screen">
        <AdminHeader title="Place Manager" />
        <main className="p-4">
          <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
        </main>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="min-h-screen">
        <AdminHeader title="Access Denied" />
        <main className="p-4">
          <Card><CardContent className="py-8 text-center text-muted-foreground">Access denied.</CardContent></Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AdminHeader title="Place Manager" />
      <main className="p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Places ({filteredPlaces.length})</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Place
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingPlace ? "Edit Place" : "Add Place"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Place Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Country</Label>
                    <Input
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                    <Button type="submit">{editingPlace ? "Update" : "Add"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search places..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredPlaces.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No places found.</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((place) => (
                      <TableRow key={place.id}>
                        <TableCell className="font-medium">{place.name}</TableCell>
                        <TableCell>{place.state || "-"}</TableCell>
                        <TableCell>{place.country || "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleEdit(place)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(place.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                  totalItems={totalItems}
                  startIndex={startIndex}
                  endIndex={endIndex}
                />
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
