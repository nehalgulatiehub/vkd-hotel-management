import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Download } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useProfilesMap } from "@/hooks/useProfilesMap";
import * as XLSX from "xlsx";

interface Agent {
  id: string;
  name: string;
  company_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  commission_rate: number | null;
  city_id: string | null;
  notes: string | null;
  created_by: string | null;
  city?: { name: string } | null;
}

interface City {
  id: string;
  name: string;
}

export default function AdminAgents() {
  const navigate = useNavigate();
  const { user, isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const { profiles, getUserName } = useProfilesMap();

  const canManage = isAdmin() || isAccount();

  useEffect(() => {
    if (!authLoading && canManage) {
      fetchAgents();
      fetchCities();
    }
  }, [authLoading, canManage]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("agents")
        .select("*, city:cities(name), created_by")
        .order("name");

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error("Error fetching agents:", error);
      toast.error("Failed to fetch agents");
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async () => {
    const { data } = await supabase.from("cities").select("id, name").order("name");
    setCities(data || []);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this agent?")) return;
    
    try {
      const { error } = await supabase.from("agents").delete().eq("id", id);
      if (error) throw error;
      toast.success("Agent deleted successfully");
      fetchAgents();
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast.error("Failed to delete agent");
    }
  };

  const handleExport = () => {
    const exportData = agents.map(agent => ({
      Name: agent.name,
      Company: agent.company_name || "",
      Phone: agent.phone || "",
      Email: agent.email || "",
      Address: agent.address || "",
      "Commission Rate": agent.commission_rate || 0,
      City: agent.city?.name || "",
      User: agent.created_by ? getUserName(agent.created_by) : "",
      Notes: agent.notes || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Agents");
    XLSX.writeFile(wb, "agents_export.xlsx");
    toast.success("Agents exported successfully");
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(search.toLowerCase()) ||
      (agent.company_name && agent.company_name.toLowerCase().includes(search.toLowerCase())) ||
      (agent.phone && agent.phone.includes(search));
    const matchesUser = !userFilter || userFilter === "all" || agent.created_by === userFilter;
    return matchesSearch && matchesUser;
  });

  if (authLoading || loading) {
    return <div className="p-6 text-center text-muted-foreground">Loading...</div>;
  }

  if (!canManage) {
    return <div className="p-6"><Card><CardContent className="py-8 text-center">Access Denied</CardContent></Card></div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Manage Agents</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button size="sm" onClick={() => navigate("/admin/agents/add")}>
            <Plus className="h-4 w-4 mr-1" />
            Add Agent
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex gap-4 items-end flex-wrap">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search agents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
            <div className="w-48">
              <Label className="text-xs mb-1 block">User</Label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select User" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {profiles.map(profile => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.username || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>City</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Commission %</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium">{agent.name}</TableCell>
                  <TableCell>{agent.company_name || "-"}</TableCell>
                  <TableCell>{agent.phone || "-"}</TableCell>
                  <TableCell>{agent.email || "-"}</TableCell>
                  <TableCell>{agent.city?.name || "-"}</TableCell>
                  <TableCell>{agent.created_by ? getUserName(agent.created_by) : "-"}</TableCell>
                  <TableCell>{agent.commission_rate ?? "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/admin/agents/add?edit=${agent.id}`)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(agent.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredAgents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No agents found
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