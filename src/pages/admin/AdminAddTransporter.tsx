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

export default function AdminAddTransporter() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;
  
  const [cities, setCities] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city_id: "",
    notes: "",
  });

  useEffect(() => {
    fetchCities();
    if (editId) {
      fetchTransporterData(editId);
    }
  }, [editId]);

  const fetchCities = async () => {
    const { data } = await supabase.from("cities").select("*").order("name");
    setCities(data || []);
  };

  const fetchTransporterData = async (id: string) => {
    const { data, error } = await supabase.from("transporters").select("*").eq("id", id).single();
    if (data && !error) {
      setFormData({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        city_id: data.city_id || "",
        notes: data.notes || "",
      });
    } else {
      toast.error("Failed to load transporter data");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditMode && editId) {
      const { error } = await supabase.from("transporters").update(formData).eq("id", editId);
      if (error) {
        toast.error("Error updating transporter");
      } else {
        toast.success("Transporter updated successfully");
        navigate("/admin/transporters");
      }
    } else {
      const { error } = await supabase.from("transporters").insert([formData]);
      if (error) {
        toast.error("Error adding transporter");
      } else {
        toast.success("Transporter added successfully");
        navigate("/admin/transporters");
      }
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      city_id: "",
      notes: "",
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">{isEditMode ? "Edit Transporter" : "Add Transporter"}</h1>
      
      {/* Blue Header Bar */}
      <div className="flex justify-between items-center px-4 py-2 mb-0 rounded-t" style={{ backgroundColor: "#1e6e99" }}>
        <span className="text-white font-semibold text-sm">{isEditMode ? "Edit Transporter" : "Add Transporter"}</span>
      </div>

      {/* Form Card */}
      <Card className="rounded-t-none border-t-0" style={{ backgroundColor: "#f6f0f0" }}>
        <CardContent className="pt-4">
          {/* Required fields note */}
          <div className="text-right text-red-500 text-xs mb-4">* - Required fields</div>
          
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4">
            {/* Transporter Name */}
            <div className="flex items-center gap-2">
              <Label htmlFor="name" className="w-56 text-right text-xs whitespace-nowrap">Transporter Name :</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-white flex-1"
              />
              <span className="text-red-500">*</span>
            </div>

            {/* Email(s) */}
            <div className="flex items-start gap-2">
              <Label htmlFor="email" className="w-56 text-right text-xs whitespace-nowrap pt-2">Email(s) :</Label>
              <div className="flex-1">
                <Textarea
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-white"
                  rows={3}
                />
                <span className="text-xs text-muted-foreground">(Please enter every email in new line)</span>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-2">
              <Label htmlFor="address" className="w-56 text-right text-xs whitespace-nowrap pt-2">Address :</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="bg-white flex-1"
                rows={3}
              />
            </div>

            {/* City */}
            <div className="flex items-center gap-2">
              <Label htmlFor="city" className="w-56 text-right text-xs whitespace-nowrap">City :</Label>
              <Select value={formData.city_id} onValueChange={(value) => setFormData({ ...formData, city_id: value })}>
                <SelectTrigger className="bg-white flex-1">
                  <SelectValue placeholder="-City-" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contact Person with Contact Details */}
            <div className="flex items-start gap-2">
              <Label htmlFor="notes" className="w-56 text-right text-xs whitespace-nowrap pt-2">Contact Person with Contact Details :</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="bg-white flex-1"
                rows={3}
              />
            </div>

            {/* Contact No */}
            <div className="flex items-center gap-2">
              <Label htmlFor="phone" className="w-56 text-right text-xs whitespace-nowrap">Contact No. :</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-white flex-1"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-center gap-2 pt-4">
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