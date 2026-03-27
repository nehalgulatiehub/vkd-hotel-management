import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminAddOwnHotel() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;
  
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
    if (editId) {
      fetchHotelData(editId);
    }
  }, [editId]);

  const fetchCities = async () => {
    const { data } = await supabase
      .from("cities")
      .select("*")
      .eq("country", "India")
      .order("name");
    setCities(data || []);
  };

  const fetchHotelData = async (id: string) => {
    const { data, error } = await supabase.from("own_hotels").select("*").eq("id", id).single();
    if (data && !error) {
      setFormData({
        name: data.name || "",
        city_id: data.city_id || "",
        address: data.address || "",
        phone: data.phone || "",
        email: data.email || "",
        contact_person: data.contact_person || "",
        rating: data.rating?.toString() || "",
        description: data.description || "",
        notes: data.notes || "",
      });
    } else {
      toast.error("Failed to load hotel data");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const hotelData = {
      ...formData,
      rating: formData.rating ? parseFloat(formData.rating) : null
    };

    if (isEditMode && editId) {
      const { error } = await supabase.from("own_hotels").update(hotelData).eq("id", editId);
      if (error) {
        toast.error("Error updating hotel");
      } else {
        toast.success("Hotel updated successfully");
        navigate("/admin/own-hotels");
      }
    } else {
      const { error } = await supabase.from("own_hotels").insert([hotelData]);
      if (error) {
        toast.error("Error adding hotel");
      } else {
        toast.success("Hotel added successfully");
        navigate("/admin/own-hotels");
      }
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
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">{isEditMode ? "Edit Own Hotel" : "Add Own Hotel"}</h1>
      
      {/* Blue Header Bar */}
      <div className="flex justify-between items-center px-4 py-2 mb-0 rounded-t" style={{ backgroundColor: "#b44a50" }}>
        <span className="text-white font-semibold text-sm">{isEditMode ? "Edit Own Hotel" : "Add Own Hotel"}</span>
      </div>

      {/* Form Card */}
      <Card className="rounded-t-none border-t-0" style={{ backgroundColor: "#f6f0f0" }}>
        <CardContent className="pt-4">
          {/* Required fields note */}
          <div className="text-right text-red-500 text-xs mb-4">* - Required fields</div>
          
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
              <Button type="submit" variant="outline" className="px-6 bg-gray-100 border-gray-400 text-black hover:bg-gray-200">
                {isEditMode ? "Update" : "Add"}
              </Button>
              <Button type="button" variant="outline" onClick={handleReset} className="px-6 bg-gray-100 border-gray-400 text-black hover:bg-gray-200">
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}