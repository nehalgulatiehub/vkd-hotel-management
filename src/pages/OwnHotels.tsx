import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Building2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function OwnHotels() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [cities, setCities] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    city_id: "",
    address: "",
    phone: "",
    email: "",
    contact_person: "",
    rating: "",
    description: "",
    notes: ""
  });

  useEffect(() => {
    fetchCities();
    fetchHotels();
  }, []);

  const fetchCities = async () => {
    const { data, error } = await supabase
      .from("cities")
      .select("*")
      .eq("country", "India")
      .order("name");
    
    if (error) {
      console.error("Failed to load cities", error);
    } else {
      setCities(data || []);
    }
  };

  const fetchHotels = async () => {
    const { data, error } = await supabase
      .from("own_hotels")
      .select("*, cities(name, state)")
      .order("name");
    
    if (error) {
      toast.error("Failed to load hotels");
    } else {
      setHotels(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const hotelData = {
      ...formData,
      rating: formData.rating ? parseFloat(formData.rating) : null
    };

    const { error } = await supabase
      .from("own_hotels")
      .insert([hotelData]);

    if (error) {
      toast.error("Failed to create hotel");
      console.error(error);
    } else {
      toast.success("Hotel created successfully");
      setShowForm(false);
      fetchHotels();
      setFormData({
        name: "",
        city_id: "",
        address: "",
        phone: "",
        email: "",
        contact_person: "",
        rating: "",
        description: "",
        notes: ""
      });
    }
  };

  const filteredHotels = hotels.filter(hotel => 
    hotel.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hotel.cities?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header title="Own Hotels Management" />
      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Own Hotels</h2>
          <Button 
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? "View Hotels" : "Add Hotel"}
          </Button>
        </div>

        {showForm ? (
          <Card>
            <CardHeader>
              <CardTitle>Add New Hotel</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hotel Name <span className="text-destructive">*</span></Label>
                    <Input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>City</Label>
                    <Select
                      value={formData.city_id}
                      onValueChange={(value) => setFormData({ ...formData, city_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50">
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={city.id}>
                            {city.name}, {city.state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Contact Person</Label>
                    <Input
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Rating</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Address</Label>
                  <Textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" className="bg-gradient-primary">
                    Create Hotel
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search hotels..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHotels.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No hotels found
                  </CardContent>
                </Card>
              ) : (
                filteredHotels.map((hotel) => (
                  <Card key={hotel.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary" />
                          <CardTitle className="text-lg">{hotel.name}</CardTitle>
                        </div>
                        {hotel.rating && (
                          <span className="text-yellow-500 font-semibold">
                            ⭐ {hotel.rating}
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {hotel.cities && (
                        <p className="text-sm text-muted-foreground">
                          📍 {hotel.cities.name}, {hotel.cities.state}
                        </p>
                      )}
                      {hotel.phone && (
                        <p className="text-sm">📞 {hotel.phone}</p>
                      )}
                      {hotel.contact_person && (
                        <p className="text-sm">👤 {hotel.contact_person}</p>
                      )}
                      <div className="flex gap-2 pt-4">
                        <Button 
                          size="sm" 
                          onClick={() => navigate(`/hotels/${hotel.id}/rooms`)}
                          className="flex-1"
                        >
                          Manage Rooms
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
