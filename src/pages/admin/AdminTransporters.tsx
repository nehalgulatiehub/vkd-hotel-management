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

interface City {
  id: string;
  name: string;
}

export default function AdminTransporters() {
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransporter, setEditingTransporter] = useState<Transporter | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [cityId, setCityId] = useState("");
  const [vehicleTypes, setVehicleTypes] = useState("");
  const [notes, setNotes] = useState("");

  const canManage = isAdmin() || isAccount();

  useEffect(() => {
    if (!authLoading && canManage) {
      fetchTransporters();
      fetchCities();
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

  const fetchCities = async () => {
    const { data } = await supabase.from("cities").select("id, name").order("name");
    setCities(data || []);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Transporter name is required");
      return;
    }

    try {
      const transporterData = {
        name,
        company_name: companyName || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        city_id: cityId || null,
        vehicle_types: vehicleTypes ? vehicleTypes.split(",").map(t => t.trim()) : null,
        notes: notes || null,
      };

      if (editingTransporter) {
        const { error } = await supabase
          .from("transporters")
          .update(transporterData)
          .eq("id", editingTransporter.id);
        if (error) throw error;
        toast.success("Transporter updated successfully");
      } else {
        const { error } = await supabase.from("transporters").insert(transporterData);
        if (error) throw error;
        toast.success("Transporter added successfully");
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchTransporters();
    } catch (error) {
      console.error("Error saving transporter:", error);
      toast.error("Failed to save transporter");
    }
  };

  const handleEdit = (transporter: Transporter) => {
    setEditingTransporter(transporter);
    setName(transporter.name);
    setCompanyName(transporter.company_name || "");
    setPhone(transporter.phone || "");
    setEmail(transporter.email || "");
    setAddress(transporter.address || "");
    setCityId(transporter.city_id || "");
    setVehicleTypes(transporter.vehicle_types?.join(", ") || "");
    setNotes(transporter.notes || "");
    setIsDialogOpen(true);
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

  const resetForm = () => {
    setEditingTransporter(null);
    setName("");
    setCompanyName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setCityId("");
    setVehicleTypes("");
    setNotes("");
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
          <Button size="sm" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
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
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(t)}>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTransporter ? "Edit Transporter" : "Add Transporter"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
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
              <Label>Vehicle Types</Label>
              <Input value={vehicleTypes} onChange={(e) => setVehicleTypes(e.target.value)} placeholder="Bus, Car, Tempo" />
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
              <Button onClick={handleSave}>{editingTransporter ? "Update" : "Add"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
