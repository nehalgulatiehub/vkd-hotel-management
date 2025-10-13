import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Transporters() {
  const [transporters, setTransporters] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company_name: "",
    email: "",
    phone: "",
    address: "",
    city_id: "",
    vehicle_types: [] as string[],
    notes: "",
  });

  useEffect(() => {
    fetchTransporters();
    fetchCities();
  }, []);

  const fetchTransporters = async () => {
    const { data, error } = await supabase
      .from("transporters")
      .select("*, cities(name)")
      .order("name");

    if (!error) {
      setTransporters(data || []);
    }
  };

  const fetchCities = async () => {
    const { data } = await supabase.from("cities").select("*").order("name");
    setCities(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("transporters").insert([formData]);

    if (error) {
      toast.error("Error adding transporter");
    } else {
      toast.success("Transporter added successfully");
      setIsAddDialogOpen(false);
      setFormData({
        name: "",
        company_name: "",
        email: "",
        phone: "",
        address: "",
        city_id: "",
        vehicle_types: [],
        notes: "",
      });
      fetchTransporters();
    }
  };

  const filteredTransporters = transporters.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Header title="Transporter Management" />
      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <Input
            placeholder="Search transporters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transporter
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Transporter</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="company_name">Company Name</Label>
                      <Input
                        id="company_name"
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Select value={formData.city_id} onValueChange={(value) => setFormData({ ...formData, city_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map((city) => (
                            <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full">Add Transporter</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>City</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransporters.map((transporter) => (
                <TableRow key={transporter.id}>
                  <TableCell className="font-medium">{transporter.name}</TableCell>
                  <TableCell>{transporter.company_name || "-"}</TableCell>
                  <TableCell>{transporter.email || "-"}</TableCell>
                  <TableCell>{transporter.phone || "-"}</TableCell>
                  <TableCell>{transporter.cities?.name || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
