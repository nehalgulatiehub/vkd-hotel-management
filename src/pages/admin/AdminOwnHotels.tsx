import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";

interface OwnHotel {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  rating: number | null;
  city_id: string | null;
  description: string | null;
  amenities: string[] | null;
  notes: string | null;
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
    if (!authLoading && canManage) {
      fetchHotels();
    }
  }, [authLoading, canManage]);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("own_hotels")
        .select("*, city:cities(name)")
        .order("name");

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

  const filteredHotels = hotels.filter(h => 
    h.name.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading || loading) {
    return <div className="p-6 text-center text-muted-foreground">Loading...</div>;
  }

  if (!canManage) {
    return <div className="p-6"><Card><CardContent className="py-8 text-center">Access Denied</CardContent></Card></div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Manage Own Hotels</h1>
        <Button size="sm" onClick={() => navigate("/admin/own-hotels/add")}>
          <Plus className="h-4 w-4 mr-1" />
          Add Hotel
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search hotels..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHotels.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="font-medium">{h.name}</TableCell>
                  <TableCell>{h.contact_person || "-"}</TableCell>
                  <TableCell>{h.phone || "-"}</TableCell>
                  <TableCell>{h.city?.name || "-"}</TableCell>
                  <TableCell>{h.rating ?? "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/admin/own-hotels/add?edit=${h.id}`)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(h.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredHotels.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No hotels found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}