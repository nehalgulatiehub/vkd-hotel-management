import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/TablePagination";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Guests() {
  const [guests, setGuests] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    city_id: "",
    id_proof_type: "",
    id_proof_number: "",
    notes: "",
  });

  useEffect(() => {
    fetchGuests();
    fetchCities();
  }, []);

  const fetchGuests = async () => {
    const { data, error } = await supabase
      .from("guests")
      .select("*, cities(name)")
      .order("first_name");

    if (!error) {
      setGuests(data || []);
    }
  };

  const fetchCities = async () => {
    const { data } = await supabase.from("cities").select("*").order("name");
    setCities(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("guests").insert([formData]);

    if (error) {
      toast.error("Error adding guest");
    } else {
      toast.success("Guest added successfully");
      setIsAddDialogOpen(false);
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        address: "",
        city_id: "",
        id_proof_type: "",
        id_proof_number: "",
        notes: "",
      });
      fetchGuests();
    }
  };

  const filteredGuests = guests.filter(guest =>
    guest.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.phone?.includes(searchTerm)
  );

  const pagination = usePagination(filteredGuests);
  
  useEffect(() => {
    pagination.resetPage();
  }, [searchTerm]);

  return (
    <div className="min-h-screen">
      <Header title="Guest Management" />
      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <Input
            placeholder="Search guests..."
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
                  Add Guest
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Guest</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">First Name *</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last Name *</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        required
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
                      <Label htmlFor="id_proof_type">ID Proof Type</Label>
                      <Input
                        id="id_proof_type"
                        value={formData.id_proof_type}
                        onChange={(e) => setFormData({ ...formData, id_proof_type: e.target.value })}
                        placeholder="e.g., Passport, Aadhar"
                      />
                    </div>
                    <div>
                      <Label htmlFor="id_proof_number">ID Proof Number</Label>
                      <Input
                        id="id_proof_number"
                        value={formData.id_proof_number}
                        onChange={(e) => setFormData({ ...formData, id_proof_number: e.target.value })}
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
                  <Button type="submit" className="w-full">Add Guest</Button>
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
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>City</TableHead>
                <TableHead>ID Proof</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.paginatedItems.map((guest) => (
                <TableRow key={guest.id}>
                  <TableCell className="font-medium">{`${guest.first_name} ${guest.last_name}`}</TableCell>
                  <TableCell>{guest.email || "-"}</TableCell>
                  <TableCell>{guest.phone || "-"}</TableCell>
                  <TableCell>{guest.cities?.name || "-"}</TableCell>
                  <TableCell>{guest.id_proof_type && guest.id_proof_number ? `${guest.id_proof_type}: ${guest.id_proof_number}` : "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.goToPage}
            totalItems={pagination.totalItems}
            startIndex={pagination.startIndex}
            endIndex={pagination.endIndex}
          />
        </div>
      </main>
    </div>
  );
}
