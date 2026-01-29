import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AddOwnHotel() {
  const navigate = useNavigate();
  const [cities, setCities] = useState<any[]>([]);
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
      navigate("/own-hotels");
    }
  };

  const handleReset = () => {
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
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Add Own Hotel" />
      <main className="p-4">
        {/* Blue Header Bar */}
        <div className="flex justify-between items-center px-4 py-2 mb-4" style={{ backgroundColor: "#1e6e99" }}>
          <span className="text-white font-semibold text-sm">Add Own Hotel</span>
          <span className="text-white/80 text-xs">* - Required fields</span>
        </div>

        {/* Form Card */}
        <Card style={{ backgroundColor: "#F5E6E0" }}>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Hotel Name <span className="text-red-500">*</span></Label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-white"
                  />
                </div>

                <div>
                  <Label>City</Label>
                  <Select
                    value={formData.city_id}
                    onValueChange={(value) => setFormData({ ...formData, city_id: value })}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="--Select City--" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name}, {city.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-white"
                  />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-white"
                  />
                </div>

                <div>
                  <Label>Contact Person</Label>
                  <Input
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="bg-white"
                  />
                </div>

                <div>
                  <Label>Rating</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    className="bg-white"
                  />
                </div>
              </div>

              <div>
                <Label>Address</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="bg-white"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="bg-white"
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="bg-white"
                />
              </div>

              <div className="flex justify-center gap-4 pt-4">
                <Button type="submit" className="px-8">Add</Button>
                <Button type="button" variant="outline" onClick={handleReset} className="px-8">Reset</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
