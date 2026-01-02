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

interface City {
  id: string;
  name: string;
}

export default function AdminOwnHotels() {
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [hotels, setHotels] = useState<OwnHotel[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<OwnHotel | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [rating, setRating] = useState("");
  const [cityId, setCityId] = useState("");
  const [description, setDescription] = useState("");
  const [amenities, setAmenities] = useState("");
  const [notes, setNotes] = useState("");

  const canManage = isAdmin() || isAccount();

  useEffect(() => {
    if (!authLoading && canManage) {
      fetchHotels();
      fetchCities();
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

  const fetchCities = async () => {
    const { data } = await supabase.from("cities").select("id, name").order("name");
    setCities(data || []);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Hotel name is required");
      return;
    }

    try {
      const hotelData = {
        name,
        contact_person: contactPerson || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        rating: rating ? parseFloat(rating) : null,
        city_id: cityId || null,
        description: description || null,
        amenities: amenities ? amenities.split(",").map(a => a.trim()) : null,
        notes: notes || null,
      };

      if (editingHotel) {
        const { error } = await supabase
          .from("own_hotels")
          .update(hotelData)
          .eq("id", editingHotel.id);
        if (error) throw error;
        toast.success("Hotel updated successfully");
      } else {
        const { error } = await supabase.from("own_hotels").insert(hotelData);
        if (error) throw error;
        toast.success("Hotel added successfully");
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchHotels();
    } catch (error) {
      console.error("Error saving hotel:", error);
      toast.error("Failed to save hotel");
    }
  };

  const handleEdit = (hotel: OwnHotel) => {
    setEditingHotel(hotel);
    setName(hotel.name);
    setContactPerson(hotel.contact_person || "");
    setPhone(hotel.phone || "");
    setEmail(hotel.email || "");
    setAddress(hotel.address || "");
    setRating(hotel.rating?.toString() || "");
    setCityId(hotel.city_id || "");
    setDescription(hotel.description || "");
    setAmenities(hotel.amenities?.join(", ") || "");
    setNotes(hotel.notes || "");
    setIsDialogOpen(true);
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

  const resetForm = () => {
    setEditingHotel(null);
    setName("");
    setContactPerson("");
    setPhone("");
    setEmail("");
    setAddress("");
    setRating("");
    setCityId("");
    setDescription("");
    setAmenities("");
    setNotes("");
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
        <Button size="sm" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
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
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(h)}>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingHotel ? "Edit Hotel" : "Add Hotel"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Hotel name" />
            </div>
            <div>
              <Label>Contact Person</Label>
              <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Contact person" />
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
              <Label>Rating</Label>
              <Input value={rating} onChange={(e) => setRating(e.target.value)} placeholder="1-5" type="number" min="1" max="5" />
            </div>
            <div className="col-span-2">
              <Label>Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
            </div>
            <div className="col-span-2">
              <Label>Amenities (comma separated)</Label>
              <Input value={amenities} onChange={(e) => setAmenities(e.target.value)} placeholder="WiFi, AC, TV" />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={2} />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" rows={2} />
            </div>
            <div className="col-span-2 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editingHotel ? "Update" : "Add"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
