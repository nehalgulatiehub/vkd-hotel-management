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
    if (!authLoading && canManage) {
      fetchCities();
    }
  }, [authLoading, canManage]);

  const fetchCities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .order("name");

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

  if (authLoading || loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Access Denied
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Manage Cities</h1>
        <Button size="sm" onClick={() => navigate("/admin/cities/add")}>
          <Plus className="h-4 w-4 mr-1" />
          Add City
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Country</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCities.map((city) => (
                <TableRow key={city.id}>
                  <TableCell className="font-medium">{city.name}</TableCell>
                  <TableCell>{city.state || "-"}</TableCell>
                  <TableCell>{city.country || "India"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/admin/cities/add?edit=${city.id}`)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(city.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCities.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No cities found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}