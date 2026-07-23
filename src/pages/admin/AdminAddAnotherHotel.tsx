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

export default function AdminAddAnotherHotel() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;
  
  const [cities, setCities] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    room_types: "",
    contact_person: "",
    email: "",
    phone: "",
    website_url: "",
    city_id: "",
    state: "",
    address: "",
    packages: "",
  });

  useEffect(() => {
    fetchCities();
    if (editId) {
      fetchHotelData(editId);
    }
  }, [editId]);

  const fetchCities = async () => {
    const { data } = await supabase.from("cities").select("*").order("name");
    setCities(data || []);
  };

  const fetchHotelData = async (id: string) => {
    const { data, error } = await supabase.from("another_hotels").select("*").eq("id", id).single();
    if (data && !error) {
      setFormData({
        name: data.name || "",
        room_types: data.room_types || "",
        contact_person: data.contact_person || "",
        email: data.email || "",
        phone: data.phone || "",
        website_url: data.website_url || "",
        city_id: data.city_id || "",
        state: data.state || "",
        address: data.address || "",
        packages: data.packages || "",
      });
    } else {
      toast.error("Failed to load hotel data");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      city_id: formData.city_id || null,
    };

    if (isEditMode && editId) {
      const { error } = await supabase.from("another_hotels").update(payload).eq("id", editId);
      if (error) {
        toast.error("Error updating hotel: " + error.message);
      } else {
        toast.success("Hotel updated successfully");
        navigate("/admin/another-hotels");
      }
    } else {
      const { error } = await supabase.from("another_hotels").insert([payload]);
      if (error) {
        toast.error("Error adding hotel: " + error.message);
      } else {
        toast.success("Hotel added successfully");
        navigate("/admin/another-hotels");
      }
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      room_types: "",
      contact_person: "",
      email: "",
      phone: "",
      website_url: "",
      city_id: "",
      state: "",
      address: "",
      packages: "",
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">{isEditMode ? "Edit Another Hotel" : "Add Another Hotel"}</h1>
      
      {/* Blue Header Bar */}
      <div className="flex justify-between items-center px-4 py-2 mb-0 rounded-t" style={{ backgroundColor: "#b44a50" }}>
        <span className="text-white font-semibold text-sm">{isEditMode ? "Edit Another Hotel" : "Add Another Hotel"}</span>
      </div>

      {/* Form Card */}
      <Card className="rounded-t-none border-t-0" style={{ backgroundColor: "#f6f0f0" }}>
        <CardContent className="pt-4">
          {/* Required fields note */}
          <div className="text-right text-red-500 text-xs mb-4">* - Required fields</div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Hotel Name <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="bg-white"
                />
              </div>
              <div>
                <Label htmlFor="room_types">Room Types</Label>
                <Input
                  id="room_types"
                  value={formData.room_types}
                  onChange={(e) => setFormData({ ...formData, room_types: e.target.value })}
                  placeholder="Please Enter Comma Separated By Room Types"
                  className="bg-white"
                />
              </div>
              <div>
                <Label htmlFor="contact_person">Contact Person <span className="text-red-500">*</span></Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className="bg-white"
                />
              </div>
              <div>
                <Label htmlFor="email">Email-Id <span className="text-red-500">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-white"
                />
              </div>
              <div>
                <Label htmlFor="phone">Contact No <span className="text-red-500">*</span></Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-white"
                />
              </div>
              <div>
                <Label htmlFor="website_url">Weburl</Label>
                <Input
                  id="website_url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="(EX: http://xyz.com)"
                  className="bg-white"
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Select value={formData.city_id} onValueChange={(value) => setFormData({ ...formData, city_id: value })}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="--Select City--" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="bg-white"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="bg-white"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="packages">Packages</Label>
              <Textarea
                id="packages"
                value={formData.packages}
                onChange={(e) => setFormData({ ...formData, packages: e.target.value })}
                className="bg-white"
                rows={3}
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