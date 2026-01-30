import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
  const { user, isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const { profiles, getUserName } = useProfilesMap();
  
  // Form state
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [commissionRate, setCommissionRate] = useState("");
  const [cityId, setCityId] = useState("");
  const [notes, setNotes] = useState("");

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

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Agent name is required");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to add an agent");
      return;
    }

    try {
      const agentData = {
        name,
        company_name: companyName || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        commission_rate: commissionRate ? parseFloat(commissionRate) : null,
        city_id: cityId || null,
        notes: notes || null,
      };

      if (editingAgent) {
        const { error } = await supabase
          .from("agents")
          .update(agentData)
          .eq("id", editingAgent.id);
        if (error) throw error;
        toast.success("Agent updated successfully");
      } else {
        const { error } = await supabase.from("agents").insert({
          ...agentData,
          created_by: user.id,
        });
        if (error) throw error;
        toast.success("Agent added successfully");
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchAgents();
    } catch (error) {
      console.error("Error saving agent:", error);
      toast.error("Failed to save agent");
    }
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setName(agent.name);
    setCompanyName(agent.company_name || "");
    setPhone(agent.phone || "");
    setEmail(agent.email || "");
    setAddress(agent.address || "");
    setCommissionRate(agent.commission_rate?.toString() || "");
    setCityId(agent.city_id || "");
    setNotes(agent.notes || "");
    setIsDialogOpen(true);
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
      Notes: agent.notes || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Agents");
    XLSX.writeFile(wb, "agents_export.xlsx");
    toast.success("Agents exported successfully");
  };

  const resetForm = () => {
    setEditingAgent(null);
    setName("");
    setCompanyName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setCommissionRate("");
    setCityId("");
    setNotes("");
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
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
          <Button size="sm" onClick={openAddDialog}>
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
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(agent)}>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAgent ? "Edit Agent" : "Add Agent"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Agent name" />
            </div>
            <div>
              <Label>Company Name</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
            </div>
            <div>
              <Label>City</Label>
              <Select value={cityId} onValueChange={setCityId}>
                <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                <SelectContent>
                  {cities.map(city => (
                    <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Commission Rate (%)</Label>
              <Input value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} placeholder="0" type="number" />
            </div>
            <div className="col-span-2">
              <Label>Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" rows={2} />
            </div>
            <div className="col-span-2 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editingAgent ? "Update" : "Add"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
