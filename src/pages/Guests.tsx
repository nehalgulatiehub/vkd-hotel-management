import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Mail, Phone, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Guest {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  id_number: string | null;
  notes: string | null;
  created_at: string;
}

export default function Guests() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [newGuest, setNewGuest] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    idNumber: "",
    notes: "",
  });

  useEffect(() => {
    fetchGuests();
  }, []);

  const fetchGuests = async () => {
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGuests(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch guests");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGuest = async () => {
    if (!newGuest.firstName || !newGuest.lastName) {
      toast.error("First name and last name are required");
      return;
    }

    try {
      const { error } = await supabase.from('guests').insert({
        first_name: newGuest.firstName,
        last_name: newGuest.lastName,
        email: newGuest.email || null,
        phone: newGuest.phone || null,
        address: newGuest.address || null,
        id_number: newGuest.idNumber || null,
        notes: newGuest.notes || null,
      });

      if (error) throw error;

      toast.success("Guest added successfully");
      setIsDialogOpen(false);
      fetchGuests();
      
      setNewGuest({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        idNumber: "",
        notes: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to add guest");
    }
  };

  const filteredGuests = guests.filter((guest) =>
    guest.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.phone?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen">
      <Header title="Guests" />
      <main className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-2xl font-semibold">Guest Management</h2>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Guest
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Guest</DialogTitle>
                <DialogDescription>Enter guest details to create a new profile</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={newGuest.firstName}
                      onChange={(e) => setNewGuest({ ...newGuest, firstName: e.target.value })}
                      placeholder="Enter first name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={newGuest.lastName}
                      onChange={(e) => setNewGuest({ ...newGuest, lastName: e.target.value })}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newGuest.email}
                      onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                      placeholder="guest@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={newGuest.phone}
                      onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idNumber">ID Number</Label>
                  <Input
                    id="idNumber"
                    value={newGuest.idNumber}
                    onChange={(e) => setNewGuest({ ...newGuest, idNumber: e.target.value })}
                    placeholder="Aadhar, Passport, or other ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={newGuest.address}
                    onChange={(e) => setNewGuest({ ...newGuest, address: e.target.value })}
                    placeholder="Full address"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newGuest.notes}
                    onChange={(e) => setNewGuest({ ...newGuest, notes: e.target.value })}
                    placeholder="Special preferences or notes about the guest"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateGuest} className="bg-gradient-primary">
                    Add Guest
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading guests...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredGuests.map((guest) => (
              <Card key={guest.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {guest.first_name} {guest.last_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {guest.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground truncate">{guest.email}</span>
                    </div>
                  )}
                  
                  {guest.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{guest.phone}</span>
                    </div>
                  )}

                  {guest.id_number && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">ID: {guest.id_number}</p>
                    </div>
                  )}

                  {guest.address && (
                    <div className="text-sm pt-2 border-t">
                      <p className="text-muted-foreground line-clamp-2">{guest.address}</p>
                    </div>
                  )}

                  {guest.notes && (
                    <div className="text-sm pt-2 border-t">
                      <p className="font-medium mb-1">Notes:</p>
                      <p className="text-muted-foreground line-clamp-2">{guest.notes}</p>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground pt-2">
                    Added: {new Date(guest.created_at).toLocaleDateString('en-IN')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredGuests.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {searchTerm 
                  ? "No guests found matching your search" 
                  : "No guests yet. Add your first guest to get started."}
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
