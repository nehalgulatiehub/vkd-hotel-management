import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LegacyFormPanel } from "@/components/legacy/LegacyFormPanel";
import { LegacyFormRow } from "@/components/legacy/LegacyFormRow";

export default function AddAnotherHotel() {
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
        navigate("/hotels");
      }
    } else {
      const { error } = await supabase.from("another_hotels").insert([payload]);
      if (error) {
        toast.error("Error adding hotel: " + error.message);
      } else {
        toast.success("Hotel added successfully");
        navigate("/hotels");
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
    <div className="min-h-screen bg-background">
      <Header title={isEditMode ? "Edit Another Hotel" : "Add Another Hotel"} />
      <main className="p-4">
        <LegacyFormPanel title={isEditMode ? "Edit Another Hotel" : "Add Another Hotel"} rightSlot={<span className="text-white/80 text-xs">* - Required fields</span>}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <LegacyFormRow label="Hotel Name" htmlFor="name" required>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-white"
              />
            </LegacyFormRow>
            <LegacyFormRow label="Room Types" htmlFor="room_types">
              <Input
                id="room_types"
                value={formData.room_types}
                onChange={(e) => setFormData({ ...formData, room_types: e.target.value })}
                placeholder="Please Enter Comma Separated By Room Types"
                className="bg-white"
              />
            </LegacyFormRow>
            <LegacyFormRow label="Contact Person" htmlFor="contact_person" required>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                className="bg-white"
              />
            </LegacyFormRow>
            <LegacyFormRow label="Email-Id" htmlFor="email" required>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-white"
              />
            </LegacyFormRow>
            <LegacyFormRow label="Contact No" htmlFor="phone" required>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-white"
              />
            </LegacyFormRow>
            <LegacyFormRow label="Weburl" htmlFor="website_url">
              <Input
                id="website_url"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                placeholder="(EX: http://xyz.com)"
                className="bg-white"
              />
            </LegacyFormRow>
            <LegacyFormRow label="City" htmlFor="city">
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
            </LegacyFormRow>
            <LegacyFormRow label="State" htmlFor="state">
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="bg-white"
              />
            </LegacyFormRow>
            <LegacyFormRow label="Address" htmlFor="address">
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="bg-white"
                rows={3}
              />
            </LegacyFormRow>
            <LegacyFormRow label="Packages" htmlFor="packages">
              <Textarea
                id="packages"
                value={formData.packages}
                onChange={(e) => setFormData({ ...formData, packages: e.target.value })}
                className="bg-white"
                rows={3}
              />
            </LegacyFormRow>
            <div className="flex justify-center gap-4 pt-4">
              <Button type="submit" className="px-8">{isEditMode ? "Update" : "Add"}</Button>
              <Button type="button" variant="outline" onClick={handleReset} className="px-8">Reset</Button>
            </div>
          </form>
        </LegacyFormPanel>
      </main>
    </div>
  );
}
