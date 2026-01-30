import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Download } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import * as XLSX from "xlsx";

interface Transporter {
  id: string;
  name: string;
  company_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city_id: string | null;
  vehicle_types: string[] | null;
  notes: string | null;
  city?: { name: string } | null;
}

export default function AdminTransporters() {
  const navigate = useNavigate();
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const canManage = isAdmin() || isAccount();

  useEffect(() => {
    if (!authLoading && canManage) {
      fetchTransporters();
    }
  }, [authLoading, canManage]);

  const fetchTransporters = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("transporters")
        .select("*, city:cities(name)")
        .order("name");

      if (error) throw error;
      setTransporters(data || []);
    } catch (error) {
      console.error("Error fetching transporters:", error);
      toast.error("Failed to fetch transporters");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transporter?")) return;
    
    try {
      const { error } = await supabase.from("transporters").delete().eq("id", id);
      if (error) throw error;
      toast.success("Transporter deleted successfully");
      fetchTransporters();
    } catch (error) {
      console.error("Error deleting transporter:", error);
      toast.error("Failed to delete transporter");
    }
  };

  const handleExport = () => {
    const exportData = transporters.map(t => ({
      Name: t.name,
      Company: t.company_name || "",
      Phone: t.phone || "",
      Email: t.email || "",
      Address: t.address || "",
      City: t.city?.name || "",
      "Vehicle Types": t.vehicle_types?.join(", ") || "",
      Notes: t.notes || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transporters");
    XLSX.writeFile(wb, "transporters_export.xlsx");
    toast.success("Transporters exported successfully");
  };

  const filteredTransporters = transporters.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.company_name && t.company_name.toLowerCase().includes(search.toLowerCase())) ||
    (t.phone && t.phone.includes(search))
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
        <h1 className="text-xl font-bold">Manage Transporters</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button size="sm" onClick={() => navigate("/admin/transporters/add")}>
            <Plus className="h-4 w-4 mr-1" />
            Add Transporter
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search transporters..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Vehicle Types</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransporters.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.company_name || "-"}</TableCell>
                  <TableCell>{t.phone || "-"}</TableCell>
                  <TableCell>{t.city?.name || "-"}</TableCell>
                  <TableCell>{t.vehicle_types?.join(", ") || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/admin/transporters/add?edit=${t.id}`)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(t.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTransporters.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No transporters found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}