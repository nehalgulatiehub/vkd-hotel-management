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

export default function Agents() {
  const [agents, setAgents] = useState<any[]>([]);
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
    commission_rate: 0,
    notes: "",
  });

  useEffect(() => {
    fetchAgents();
    fetchCities();
  }, []);

  const fetchAgents = async () => {
    const { data, error } = await supabase
      .from("agents")
      .select("*, cities(name)")
      .order("name");

    if (!error) {
      setAgents(data || []);
    }
  };

  const fetchCities = async () => {
    const { data } = await supabase.from("cities").select("*").order("name");
    setCities(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("agents").insert([formData]);

    if (error) {
      toast.error("Error adding agent");
    } else {
      toast.success("Agent added successfully");
      setIsAddDialogOpen(false);
      setFormData({
        name: "",
        company_name: "",
        email: "",
        phone: "",
        address: "",
        city_id: "",
        commission_rate: 0,
        notes: "",
      });
      fetchAgents();
    }
  };

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Header title="Agent Management" />
      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <Input
            placeholder="Search agents..."
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
                  Add Agent
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Agent</DialogTitle>
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
                    <div>
                      <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                      <Input
                        id="commission_rate"
                        type="number"
                        step="0.01"
                        value={formData.commission_rate}
                        onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) })}
                      />
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
                  <Button type="submit" className="w-full">Add Agent</Button>
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
                <TableHead>Commission %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium">{agent.name}</TableCell>
                  <TableCell>{agent.company_name || "-"}</TableCell>
                  <TableCell>{agent.email || "-"}</TableCell>
                  <TableCell>{agent.phone || "-"}</TableCell>
                  <TableCell>{agent.cities?.name || "-"}</TableCell>
                  <TableCell>{agent.commission_rate}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
